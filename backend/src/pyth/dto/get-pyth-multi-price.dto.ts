// backend/src/pyth/dto/get-pyth-multi-price.dto.ts

import { IsOptional, IsString } from 'class-validator';
import { PythFeedKey } from '../pyth-feeds.config';

export class GetPythMultiPriceDto {
  @IsString()
  feedKeys: string; // Comma-separated feed keys, e.g., "ETH_USD,BTC_USD,SOL_USD"

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsString()
  mode?: 'update' | 'read-only';

  // Internal helper to parse and validate
  getParsedFeedKeys(): PythFeedKey[] {
    const validKeys = ['ETH_USD', 'BTC_USD', 'SOL_USD', 'USDC_USD'];
    const parsed = this.feedKeys
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    const invalid = parsed.filter((k) => !validKeys.includes(k));
    if (invalid.length > 0) {
      throw new Error(`Invalid feed keys: ${invalid.join(', ')}`);
    }
    if (parsed.length === 0) {
      throw new Error('At least one feed key is required');
    }
    return parsed as PythFeedKey[];
  }
}
