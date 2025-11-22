import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NetworkConfig, resolveNetworkConfig } from './constants/networks';

export interface ResolvedToken {
  address: string;
  decimals: number;
  symbol?: string;
  name?: string;
}

@Injectable()
export class TokensService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('ONEINCH_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'ONEINCH_BASE_URL',
      'https://api.1inch.dev',
    );
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  resolveNetwork(rawNetwork?: string): NetworkConfig {
    return resolveNetworkConfig(rawNetwork);
  }

  private async fetchTokensForNetwork(network: NetworkConfig): Promise<any> {
    const url = `${this.baseUrl}/swap/v6.0/${network.chainId}/tokens`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, { headers: this.getAuthHeaders() }),
    );
    return data;
  }

  private findTokenBySymbolLocal(
    tokensResponse: any,
    symbol: string,
  ): ResolvedToken | null {
    if (!tokensResponse || !tokensResponse.tokens) {
      return null;
    }
    const targetSymbol = symbol.trim().toUpperCase();
    const entries = Object.entries(tokensResponse.tokens) as [
      string,
      { symbol: string; name?: string; decimals: number },
    ][];
    for (const [address, meta] of entries) {
      if (meta.symbol && meta.symbol.toUpperCase() === targetSymbol) {
        return {
          address,
          decimals: meta.decimals,
          symbol: meta.symbol,
          name: meta.name,
        };
      }
    }
    return null;
  }

  async resolveTokenBySymbol(
    networkIdentifier: string | undefined,
    symbol: string,
  ): Promise<{ network: NetworkConfig; token: ResolvedToken }> {
    // Basic symbol format validation before hitting remote endpoint
    if (!/^[A-Za-z0-9$+._-]{2,15}$/.test(symbol)) {
      throw new Error(`Invalid token symbol format: ${symbol}`);
    }
    const network = this.resolveNetwork(networkIdentifier);
    const tokensResponse = await this.fetchTokensForNetwork(network);
    const token = this.findTokenBySymbolLocal(tokensResponse, symbol);
    if (!token) {
      throw new Error(
        `Token symbol not supported on ${network.name}: ${symbol}`,
      );
    }
    return { network, token };
  }

  toBaseUnits(amountDecimal: string, decimals: number): string {
    if (!/^[0-9]+(\.[0-9]+)?$/.test(amountDecimal)) {
      throw new Error(`Invalid decimal amount: ${amountDecimal}`);
    }
    const [integerPart, fractionalRaw = ''] = amountDecimal.split('.');
    const fractionalPadded = (fractionalRaw + '0'.repeat(decimals)).slice(
      0,
      decimals,
    );
    const full = integerPart + fractionalPadded;
    if (!/^[0-9]+$/.test(full)) {
      throw new Error(`Invalid decimal amount: ${amountDecimal}`);
    }
    return BigInt(full).toString();
  }
}
