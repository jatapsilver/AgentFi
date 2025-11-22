// backend/src/pyth/pyth.controller.ts

import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PythService } from './pyth.service';
import { GetPythPriceDto } from './dto/get-pyth-price.dto';
import { GetPythMultiPriceDto } from './dto/get-pyth-multi-price.dto';

@Controller('pyth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PythController {
  constructor(private readonly pythService: PythService) {}

  /**
   * GET /pyth/price?feedKey=ETH_USD&network=sepolia&mode=update
   *
   * Modes:
   * - 'update' (default): Pull from Hermes + updatePriceFeeds + read stored price
   * - 'read-only': Only read stored price without on-chain update
   */
  @Get('price')
  async getPrice(@Query() dto: GetPythPriceDto) {
    if (dto.mode === 'read-only') {
      return this.pythService.getStoredSinglePrice(dto.feedKey, dto.network);
    }
    // Default mode: PULL Hermes + updatePriceFeeds + read price
    return this.pythService.updateAndGetSinglePrice(dto.feedKey, dto.network);
  }

  /**
   * GET /pyth/prices?feedKeys=ETH_USD&feedKeys=SOL_USD&network=sepolia
   *
   * Batch update multiple feeds in a single transaction
   */
  @Get('prices')
  async getPrices(@Query() dto: GetPythMultiPriceDto) {
    if (dto.mode === 'read-only') {
      // Read-only mode for multiple feeds
      const results = await Promise.all(
        dto.feedKeys.map((key) =>
          this.pythService.getStoredSinglePrice(key, dto.network),
        ),
      );
      return { results, mode: 'read-only' };
    }
    // Default: batch update + consume
    return this.pythService.updateAndGetMultiple(dto.feedKeys, dto.network);
  }
}
