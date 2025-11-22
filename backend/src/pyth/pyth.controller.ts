// backend/src/pyth/pyth.controller.ts

import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PythService } from './pyth.service';
import { GetPythPriceDto } from './dto/get-pyth-price.dto';
import { GetPythMultiPriceDto } from './dto/get-pyth-multi-price.dto';

@ApiTags('Pyth Oracle')
@Controller('pyth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PythController {
  constructor(private readonly pythService: PythService) {}

  @Get('price')
  @ApiOperation({
    summary: 'Get single price feed from Pyth Oracle',
    description:
      'Fetch cryptocurrency prices using Pyth Pull oracle. Choose between read-only (free, no gas) or update mode (requires transaction).',
  })
  @ApiQuery({
    name: 'feedKey',
    required: true,
    enum: ['ETH_USD', 'BTC_USD', 'SOL_USD', 'USDC_USD'],
    description: 'Price feed identifier',
    example: 'ETH_USD',
  })
  @ApiQuery({
    name: 'network',
    required: false,
    enum: [
      'sepolia',
      'base-sepolia',
      'polygon-amoy',
      'optimism-sepolia',
      'arbitrum-sepolia',
      'scroll-sepolia',
    ],
    description: 'Target blockchain network (defaults to sepolia)',
    example: 'sepolia',
  })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: ['update', 'read-only'],
    description:
      'update: Fetch fresh price + on-chain tx (costs gas) | read-only: Read stored price (free, no gas)',
    example: 'read-only',
  })
  @ApiResponse({
    status: 200,
    description: 'Price data retrieved successfully',
    schema: {
      example: {
        network: 'sepolia',
        feedKey: 'ETH_USD',
        feedId:
          '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
        txHash:
          '0x28cf4c1bc92a0cf823a5632adbf7cb0ee778b089927b431c7018174bac91e01b',
        onChain: {
          rawPrice: '275206399700',
          expo: -8,
          publishTime: 1763837358,
          priceDecimal: '2752.06399700',
        },
      },
    },
  })
  async getPrice(@Query() dto: GetPythPriceDto) {
    if (dto.mode === 'read-only') {
      return this.pythService.getStoredSinglePrice(dto.feedKey, dto.network);
    }
    // Default mode: PULL Hermes + updatePriceFeeds + read price
    return this.pythService.updateAndGetSinglePrice(dto.feedKey, dto.network);
  }

  @Get('prices')
  @ApiOperation({
    summary: 'Batch update multiple price feeds',
    description:
      'Update multiple cryptocurrency prices in a single transaction. More gas efficient than individual updates.',
  })
  @ApiQuery({
    name: 'feedKeys',
    required: true,
    isArray: true,
    enum: ['ETH_USD', 'BTC_USD', 'SOL_USD', 'USDC_USD'],
    description:
      'Array of feed keys to fetch. Use multiple feedKeys parameters: ?feedKeys=ETH_USD&feedKeys=BTC_USD',
    example: ['ETH_USD', 'BTC_USD'],
  })
  @ApiQuery({
    name: 'network',
    required: false,
    enum: [
      'sepolia',
      'base-sepolia',
      'polygon-amoy',
      'optimism-sepolia',
      'arbitrum-sepolia',
      'scroll-sepolia',
    ],
    description: 'Target blockchain network (defaults to sepolia)',
    example: 'sepolia',
  })
  @ApiQuery({
    name: 'mode',
    required: false,
    enum: ['update', 'read-only'],
    description:
      'update: Batch update all feeds (1 tx) | read-only: Read all stored prices (no gas)',
    example: 'update',
  })
  @ApiResponse({
    status: 200,
    description: 'Multiple prices retrieved successfully',
    schema: {
      example: {
        network: 'sepolia',
        txHash:
          '0xec49856d805c8dcc911a7cd58e62fb418269e558f6bbffd678ea9f4e2e4b88ce',
        results: [
          {
            feedKey: 'ETH_USD',
            feedId:
              '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
            onChain: {
              rawPrice: '275027246515',
              expo: -8,
              publishTime: 1763837855,
              priceDecimal: '2750.27246515',
            },
          },
          {
            feedKey: 'BTC_USD',
            feedId:
              '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
            onChain: {
              rawPrice: '8455604343241',
              expo: -8,
              publishTime: 1763837855,
              priceDecimal: '84556.04343241',
            },
          },
        ],
      },
    },
  })
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
