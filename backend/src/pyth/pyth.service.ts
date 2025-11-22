// backend/src/pyth/pyth.service.ts

import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import {
  PYTH_NETWORKS,
  PythNetworkKey,
  resolvePythNetworkKey,
  DEFAULT_PYTH_NETWORK_KEY,
} from './pyth-networks.config';
import { PYTH_FEEDS, PythFeedKey } from './pyth-feeds.config';
import { PythPriceConsumerAbi } from './abi';

interface NetworkClient {
  key: PythNetworkKey;
  provider: JsonRpcProvider;
  signer: Wallet;
  consumer: Contract;
}

interface StoredPriceData {
  price: bigint;
  expo: number;
  publishTime: bigint;
}

@Injectable()
export class PythService implements OnModuleInit {
  private readonly logger = new Logger(PythService.name);
  private readonly hermesUrl: string;
  private readonly defaultUpdateFeeWei: string;
  private readonly networkClients = new Map<PythNetworkKey, NetworkClient>();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.hermesUrl =
      this.configService.get<string>('PYTH_HERMES_URL') ||
      'https://hermes.pyth.network';
    this.defaultUpdateFeeWei =
      this.configService.get<string>('PYTH_DEFAULT_UPDATE_FEE_WEI') ||
      '100000000000000';
  }

  async onModuleInit() {
    const privateKey = this.configService.get<string>(
      'PYTH_UPDATER_PRIVATE_KEY',
    );
    if (!privateKey) {
      throw new InternalServerErrorException(
        'PYTH_UPDATER_PRIVATE_KEY not configured',
      );
    }

    // Inicializar clientes para cada red configurada
    for (const [networkKey, networkConfig] of Object.entries(PYTH_NETWORKS)) {
      const rpcUrl = this.configService.get<string>(networkConfig.rpcEnv);
      const consumerAddress = this.configService.get<string>(
        networkConfig.consumerAddressEnv,
      );

      if (!rpcUrl) {
        this.logger.warn(
          `Skipping network ${networkKey}: ${networkConfig.rpcEnv} not configured`,
        );
        continue;
      }

      if (!consumerAddress) {
        this.logger.warn(
          `Skipping network ${networkKey}: ${networkConfig.consumerAddressEnv} not configured`,
        );
        continue;
      }

      try {
        const provider = new JsonRpcProvider(rpcUrl);
        const signer = new Wallet(privateKey, provider);
        const consumer = new Contract(
          consumerAddress,
          PythPriceConsumerAbi,
          signer,
        );

        this.networkClients.set(networkKey as PythNetworkKey, {
          key: networkKey as PythNetworkKey,
          provider,
          signer,
          consumer,
        });

        this.logger.log(
          `Initialized Pyth client for ${networkKey} at ${consumerAddress}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to initialize network ${networkKey}: ${error.message}`,
        );
      }
    }

    if (this.networkClients.size === 0) {
      throw new InternalServerErrorException(
        'No Pyth network clients initialized',
      );
    }
  }

  private getNetworkClient(rawNetwork?: string): NetworkClient {
    const networkKey = rawNetwork
      ? resolvePythNetworkKey(rawNetwork)
      : DEFAULT_PYTH_NETWORK_KEY;

    const client = this.networkClients.get(networkKey);
    if (!client) {
      throw new InternalServerErrorException(
        `Network client not available for ${networkKey}`,
      );
    }

    return client;
  }

  private async fetchPriceUpdateData(feedIds: string[]): Promise<string[]> {
    try {
      const url = `${this.hermesUrl}/v2/updates/price/latest`;
      const params = new URLSearchParams();
      feedIds.forEach((id) => params.append('ids[]', id));
      params.append('encoding', 'hex');

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      const updateData = response.data?.binary?.data;
      if (!Array.isArray(updateData) || updateData.length === 0) {
        throw new Error('No price update data received from Hermes');
      }

      // Convert hex strings to proper format for ethers
      return updateData.map((hexStr) => `0x${hexStr}`);
    } catch (error) {
      this.logger.error(
        `Failed to fetch price update data from Hermes: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to fetch price update data',
      );
    }
  }

  private normalizePrice(price: bigint, expo: number): string {
    const priceStr = price.toString();
    const isNegativePrice = priceStr.startsWith('-');
    const absPrice = isNegativePrice ? priceStr.slice(1) : priceStr;

    if (expo >= 0) {
      // Precio se multiplica por 10^expo
      const multiplier = BigInt(10) ** BigInt(expo);
      const result = BigInt(absPrice) * multiplier;
      return isNegativePrice ? `-${result.toString()}` : result.toString();
    } else {
      // Precio se divide por 10^(-expo)
      const absExpo = Math.abs(expo);
      const divisor = BigInt(10) ** BigInt(absExpo);
      const priceBigInt = BigInt(absPrice);

      // Integer division
      const wholePart = priceBigInt / divisor;
      const remainder = priceBigInt % divisor;

      // Pad remainder with leading zeros if needed
      const remainderStr = remainder.toString().padStart(absExpo, '0');
      const result = `${wholePart}.${remainderStr}`;

      return isNegativePrice ? `-${result}` : result;
    }
  }

  async updateAndGetSinglePrice(feedKey: PythFeedKey, rawNetwork?: string) {
    const feedConfig = PYTH_FEEDS[feedKey];
    if (!feedConfig) {
      throw new InternalServerErrorException(`Unknown feed key: ${feedKey}`);
    }

    const client = this.getNetworkClient(rawNetwork);
    this.logger.log(
      `Updating price for ${feedKey} on ${client.key} network...`,
    );

    // 1) Fetch price update data from Hermes
    const priceUpdateData = await this.fetchPriceUpdateData([feedConfig.id]);

    // 2) Call updateAndGetPrice on contract
    const tx = await client.consumer.updateAndGetPrice(
      priceUpdateData,
      feedConfig.id,
      {
        value: this.defaultUpdateFeeWei,
        gasLimit: 500000,
      },
    );

    this.logger.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait(1);
    this.logger.log(`Transaction mined in block ${receipt.blockNumber}`);

    // 3) Read stored price from contract
    const stored: StoredPriceData = await client.consumer.getStoredPrice(
      feedConfig.id,
    );

    const priceDecimal = this.normalizePrice(stored.price, Number(stored.expo));

    return {
      network: client.key,
      feedKey,
      feedId: feedConfig.id,
      txHash: receipt.hash,
      onChain: {
        rawPrice: stored.price.toString(),
        expo: Number(stored.expo),
        publishTime: Number(stored.publishTime),
        priceDecimal,
      },
    };
  }

  async getStoredSinglePrice(feedKey: PythFeedKey, rawNetwork?: string) {
    const feedConfig = PYTH_FEEDS[feedKey];
    if (!feedConfig) {
      throw new InternalServerErrorException(`Unknown feed key: ${feedKey}`);
    }

    const client = this.getNetworkClient(rawNetwork);
    this.logger.log(
      `Reading stored price for ${feedKey} on ${client.key} network...`,
    );

    // Read stored price without update
    const stored: StoredPriceData = await client.consumer.getStoredPrice(
      feedConfig.id,
    );

    const priceDecimal = this.normalizePrice(stored.price, Number(stored.expo));

    return {
      network: client.key,
      feedKey,
      feedId: feedConfig.id,
      onChain: {
        rawPrice: stored.price.toString(),
        expo: Number(stored.expo),
        publishTime: Number(stored.publishTime),
        priceDecimal,
      },
      mode: 'read-only',
    };
  }

  async updateAndGetMultiple(
    feedKeys: PythFeedKey[],
    rawNetwork?: string,
  ): Promise<any> {
    const client = this.getNetworkClient(rawNetwork);

    // Map feedKeys to feedIds and configs
    const feedConfigs = feedKeys.map((key) => {
      const config = PYTH_FEEDS[key];
      if (!config) {
        throw new InternalServerErrorException(`Unknown feed key: ${key}`);
      }
      return { key, config };
    });

    const feedIds = feedConfigs.map((fc) => fc.config.id);

    this.logger.log(
      `Updating multiple prices (${feedKeys.join(', ')}) on ${client.key} network...`,
    );

    // 1) Fetch price update data from Hermes for all feeds
    const priceUpdateData = await this.fetchPriceUpdateData(feedIds);

    // 2) Call updateAndGetMultiple on contract
    const tx = await client.consumer.updateAndGetMultiple(
      priceUpdateData,
      feedIds,
      {
        value: this.defaultUpdateFeeWei,
        gasLimit: 1000000,
      },
    );

    this.logger.log(`Batch transaction sent: ${tx.hash}`);
    const receipt = await tx.wait(1);
    this.logger.log(`Batch transaction mined in block ${receipt.blockNumber}`);

    // 3) Read stored prices for each feed
    const results = await Promise.all(
      feedConfigs.map(async ({ key, config }) => {
        const stored: StoredPriceData = await client.consumer.getStoredPrice(
          config.id,
        );
        const priceDecimal = this.normalizePrice(
          stored.price,
          Number(stored.expo),
        );

        return {
          feedKey: key,
          feedId: config.id,
          onChain: {
            rawPrice: stored.price.toString(),
            expo: Number(stored.expo),
            publishTime: Number(stored.publishTime),
            priceDecimal,
          },
        };
      }),
    );

    return {
      network: client.key,
      txHash: receipt.hash,
      results,
    };
  }
}
