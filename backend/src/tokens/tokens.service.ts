import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NetworkConfig, resolveNetworkConfig } from './constants/networks';
import { normalizeSymbol } from './constants/aliases';

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
  private readonly cacheTtlMs: number;
  private readonly tokenCache: Map<
    number,
    { fetchedAt: number; tokensResponse: any }
  >; // chainId -> cached tokens

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('ONEINCH_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'ONEINCH_BASE_URL',
      'https://api.1inch.dev',
    );
    // Allow override via env TOKEN_CACHE_TTL_MS; default 1 hour.
    this.cacheTtlMs = parseInt(
      this.configService.get<string>('TOKEN_CACHE_TTL_MS', '3600000'),
      10,
    );
    this.tokenCache = new Map();
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

  private async getTokensResponse(network: NetworkConfig): Promise<any> {
    const cached = this.tokenCache.get(network.chainId);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < this.cacheTtlMs) {
      return cached.tokensResponse;
    }
    const fresh = await this.fetchTokensForNetwork(network);
    this.tokenCache.set(network.chainId, {
      fetchedAt: now,
      tokensResponse: fresh,
    });
    return fresh;
  }

  // Manual invalidation (could be exposed later via controller)
  invalidateChainCache(chainId: number) {
    this.tokenCache.delete(chainId);
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
    const normalizedInput = normalizeSymbol(symbol);
    // Basic symbol format validation (after normalization) before hitting remote endpoint
    if (!/^[A-Za-z0-9$+._-]{2,15}$/.test(normalizedInput)) {
      throw new Error(`Invalid token symbol format: ${symbol}`);
    }
    const network = this.resolveNetwork(networkIdentifier);
    const tokensResponse = await this.getTokensResponse(network);
    const token = this.findTokenBySymbolLocal(tokensResponse, normalizedInput);
    if (!token) {
      // If cache might be stale, force refresh once
      this.invalidateChainCache(network.chainId);
      const refreshed = await this.getTokensResponse(network);
      const retryToken = this.findTokenBySymbolLocal(
        refreshed,
        normalizedInput,
      );
      if (!retryToken) {
        throw new Error(
          `Token symbol not supported on ${network.name}: ${symbol} (normalized: ${normalizedInput})`,
        );
      }
      return { network, token: retryToken };
    }
    return { network, token };
  }

  toBaseUnits(amountDecimal: string, decimals: number): string {
    if (!/^[0-9]+(\.[0-9]+)?$/.test(amountDecimal)) {
      throw new Error(`Invalid decimal amount: ${amountDecimal}`);
    }
    const [integerPart, fractionalPart = ''] = amountDecimal.split('.');

    // Pad fractional part to match decimals length
    const paddedFractional = fractionalPart.padEnd(decimals, '0');

    // If fractional part is longer than decimals, it's invalid
    if (fractionalPart.length > decimals) {
      throw new Error(
        `Amount has too many decimal places. Max ${decimals} decimals allowed.`,
      );
    }

    const full = integerPart + paddedFractional;
    return BigInt(full).toString();
  }
}
