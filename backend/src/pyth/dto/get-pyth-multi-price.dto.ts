// backend/src/pyth/dto/get-pyth-multi-price.dto.ts

import {
  IsArray,
  ArrayNotEmpty,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { PythFeedKey } from '../pyth-feeds.config';

export class GetPythMultiPriceDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(['ETH_USD', 'BTC_USD', 'SOL_USD', 'USDC_USD'], { each: true })
  feedKeys: PythFeedKey[];

  @IsOptional()
  @IsString()
  network?: string;

  @IsOptional()
  @IsString()
  @IsIn(['update', 'read-only'])
  mode?: 'update' | 'read-only';
}
