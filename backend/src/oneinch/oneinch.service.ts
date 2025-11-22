import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { GetQuoteDto } from './dto/get-quote.dto';
import { BuildSwapTxDto } from './dto/build-swap-tx.dto';
import { SimpleQuoteDto } from './dto/simple-quote.dto';
import { SimpleSwapTxDto } from './dto/simple-swap-tx.dto';
import { TokensService } from '../tokens/tokens.service';
import { SwapQuoteLog } from './entities/swap-quote-log.entity';
import { resolveNetworkConfig } from '../tokens/constants/networks';

@Injectable()
export class OneInchService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(SwapQuoteLog)
    private readonly swapQuoteLogRepo: Repository<SwapQuoteLog>,
    private readonly tokensService: TokensService,
  ) {
    this.apiKey = this.configService.get<string>('ONEINCH_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'ONEINCH_BASE_URL',
      'https://api.1inch.dev',
    );
  }

  private getAuthHeaders() {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    return headers;
  }

  // Quote using direct token addresses; now supports dynamic network via optional network param.
  async getQuote(dto: GetQuoteDto, userId?: string) {
    const network = resolveNetworkConfig((dto as any).network); // extend DTO without breaking validation
    const url = `${this.baseUrl}/swap/v6.0/${network.chainId}/quote`;
    const params: any = {
      src: dto.fromTokenAddress,
      dst: dto.toTokenAddress,
      amount: dto.amount,
    };
    if (dto.fromAddress) params.from = dto.fromAddress;
    if (dto.slippage) params.slippage = dto.slippage;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params, headers: this.getAuthHeaders() }),
      );
      const data = response.data;

      const log = new SwapQuoteLog();
      log.userId = userId;
      log.chainId = String(network.chainId);
      log.fromTokenAddress = dto.fromTokenAddress;
      log.toTokenAddress = dto.toTokenAddress;
      log.amountIn = dto.amount;
      log.amountOut = data?.dstAmount ?? data?.toAmount ?? null;
      log.fromAddress = dto.fromAddress ?? null;
      log.oneInchRequestId = data?.requestId ?? data?.id ?? null;
      log.rawResponse = data ?? null;
      await this.swapQuoteLogRepo.save(log);

      return { network, quote: data };
    } catch (err) {
      throw new InternalServerErrorException(
        `Error fetching quote from 1inch: ${err?.response?.data?.description || err?.message || 'Unknown error'}`,
      );
    }
  }

  // Symbol + network based quote.
  async getQuoteSimple(dto: SimpleQuoteDto) {
    try {
      const { network, token: fromToken } =
        await this.tokensService.resolveTokenBySymbol(
          dto.network,
          dto.fromSymbol,
        );
      const { token: toToken } = await this.tokensService.resolveTokenBySymbol(
        network.key,
        dto.toSymbol,
      );
      const amountWei = this.tokensService.toBaseUnits(
        dto.amount,
        fromToken.decimals,
      );
      const url = `${this.baseUrl}/swap/v6.0/${network.chainId}/quote`;
      const params: Record<string, string> = {
        src: fromToken.address,
        dst: toToken.address,
        amount: amountWei,
      };
      if (dto.fromAddress) params.from = dto.fromAddress;
      if (dto.slippage) params.slippage = dto.slippage;
      const { data: quote } = await firstValueFrom(
        this.httpService.get(url, { params, headers: this.getAuthHeaders() }),
      );
      return {
        network,
        input: {
          fromSymbol: dto.fromSymbol,
          toSymbol: dto.toSymbol,
          amountDecimal: dto.amount,
          amountWei,
        },
        tokens: { from: fromToken, to: toToken },
        quote,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Error fetching simple quote from 1inch: ${err?.message || 'Unknown error'}`,
      );
    }
  }

  // Build swap transaction from raw addresses.
  async buildSwapTx(dto: BuildSwapTxDto) {
    const network = resolveNetworkConfig((dto as any).network);
    const url = `${this.baseUrl}/swap/v6.0/${network.chainId}/swap`;
    const params: any = {
      src: dto.fromTokenAddress,
      dst: dto.toTokenAddress,
      amount: dto.amount,
      from: dto.fromAddress,
    };
    if (dto.slippage) params.slippage = dto.slippage;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { params, headers: this.getAuthHeaders() }),
      );
      return { network, tx: response.data };
    } catch (err) {
      throw new InternalServerErrorException(
        `Error building swap transaction with 1inch: ${err?.response?.data?.description || err?.message || 'Unknown error'}`,
      );
    }
  }

  // Build swap transaction resolving symbols.
  async buildSwapTxSimple(dto: SimpleSwapTxDto) {
    try {
      const { network, token: fromToken } =
        await this.tokensService.resolveTokenBySymbol(
          dto.network,
          dto.fromSymbol,
        );
      const { token: toToken } = await this.tokensService.resolveTokenBySymbol(
        network.key,
        dto.toSymbol,
      );
      const amountWei = this.tokensService.toBaseUnits(
        dto.amount,
        fromToken.decimals,
      );
      const url = `${this.baseUrl}/swap/v6.0/${network.chainId}/swap`;
      const params: Record<string, string> = {
        src: fromToken.address,
        dst: toToken.address,
        amount: amountWei,
        from: dto.fromAddress,
      };
      if (dto.slippage) params.slippage = dto.slippage;
      const { data: tx } = await firstValueFrom(
        this.httpService.get(url, { params, headers: this.getAuthHeaders() }),
      );
      return {
        network,
        input: {
          fromSymbol: dto.fromSymbol,
          toSymbol: dto.toSymbol,
          amountDecimal: dto.amount,
          amountWei,
        },
        tokens: { from: fromToken, to: toToken },
        tx,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        `Error building simple swap tx: ${err?.response?.data?.description || err?.message || 'Unknown error'}`,
      );
    }
  }

  async getWalletBalances(address: string, rawNetwork?: string) {
    const network = resolveNetworkConfig(rawNetwork);
    const url = `${this.baseUrl}/balance/v1.2/${network.chainId}/balances/${address}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getAuthHeaders() }),
      );
      return { network, balances: response.data };
    } catch (err) {
      throw new InternalServerErrorException(
        `Error fetching balances from 1inch: ${err?.response?.data?.description || err?.message || 'Unknown error'}`,
      );
    }
  }

  healthCheck() {
    return {
      ok: true,
      baseUrl: this.baseUrl,
      hasApiKey: Boolean(this.apiKey && this.apiKey.length > 0),
      supportedNetworks: [
        'ethereum',
        'base',
        'polygon',
        'bsc',
        'arbitrum',
        'optimism',
        'avalanche',
        'fantom',
        'gnosis',
        'zksync',
        'linea',
        'scroll',
        'blast',
        'mode',
      ],
      defaultNetwork: 'base',
      note: 'Use symbol-based endpoints for dynamic network resolution.',
    };
  }

  async getQuoteLogs() {
    return this.swapQuoteLogRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getQuoteLogById(id: string) {
    const found = await this.swapQuoteLogRepo.findOneBy({ id });
    if (!found) throw new NotFoundException('Quote log not found');
    return found;
  }
}
