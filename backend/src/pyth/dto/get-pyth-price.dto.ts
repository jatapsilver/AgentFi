// backend/src/pyth/dto/get-pyth-price.dto.ts

import { IsIn, IsOptional, IsString } from 'class-validator';
import { PythFeedKey } from '../pyth-feeds.config';

export class GetPythPriceDto {
  @IsString()
  @IsIn(['ETH_USD', 'BTC_USD', 'SOL_USD', 'USDC_USD'])
  feedKey: PythFeedKey;

  // Red: 'sepolia', 'base-sepolia', etc.
  @IsOptional()
  @IsString()
  network?: string;

  // mode = 'update' (default) o 'read-only'
  @IsOptional()
  @IsString()
  @IsIn(['update', 'read-only'])
  mode?: 'update' | 'read-only';
}
