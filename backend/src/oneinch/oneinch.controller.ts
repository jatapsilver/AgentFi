import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OneInchService } from './oneinch.service';
import { GetQuoteDto } from './dto/get-quote.dto';
import { BuildSwapTxDto } from './dto/build-swap-tx.dto';
import { SimpleQuoteDto } from './dto/simple-quote.dto';
import { SimpleSwapTxDto } from './dto/simple-swap-tx.dto';

@ApiTags('1inch Integration')
@Controller('oneinch')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class OneInchController {
  constructor(private readonly oneInchService: OneInchService) {}

  @Get('quote')
  @ApiOperation({
    summary: 'Get swap quote (addresses)',
    description:
      'Quote using token addresses; provide optional network for dynamic chain resolution.',
  })
  @ApiQuery({
    name: 'network',
    required: false,
    description: 'Network key (e.g. base, ethereum, polygon)',
  })
  @ApiResponse({ status: 200, description: 'Quote retrieved successfully' })
  getQuote(@Query() dto: GetQuoteDto) {
    return this.oneInchService.getQuote(dto);
  }

  @Get('quote/simple')
  @ApiOperation({
    summary: 'Get quote by symbols',
    description:
      'Resolve symbols + network internally and return enriched quote.',
  })
  @ApiResponse({
    status: 200,
    description: 'Simple quote retrieved successfully',
  })
  getQuoteSimple(@Query() dto: SimpleQuoteDto) {
    return this.oneInchService.getQuoteSimple(dto);
  }

  @Post('tx')
  @ApiOperation({
    summary: 'Build swap transaction (addresses)',
    description:
      'Swap transaction using raw token addresses; optional network param.',
  })
  @ApiQuery({
    name: 'network',
    required: false,
    description: 'Network key (e.g. base, ethereum)',
  })
  @ApiResponse({ status: 200, description: 'Transaction built successfully' })
  buildSwapTx(@Body() dto: BuildSwapTxDto) {
    return this.oneInchService.buildSwapTx(dto);
  }

  @Post('tx/simple')
  @ApiOperation({
    summary: 'Build swap transaction by symbols',
    description:
      'Resolve symbols + network and construct ready-to-sign swap transaction.',
  })
  @ApiResponse({
    status: 200,
    description: 'Simple transaction built successfully',
  })
  buildSwapTxSimple(@Body() dto: SimpleSwapTxDto) {
    return this.oneInchService.buildSwapTxSimple(dto);
  }

  @Get('balances/:address')
  @ApiOperation({
    summary: 'Get wallet balances',
    description: 'Get token balances for a wallet on a specific network.',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
  })
  @ApiQuery({
    name: 'network',
    required: false,
    description: 'Network key (default base)',
  })
  @ApiResponse({ status: 200, description: 'Balances retrieved successfully' })
  getBalances(
    @Param('address') address: string,
    @Query('network') network?: string,
  ) {
    return this.oneInchService.getWalletBalances(address, network);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check 1inch integration configuration & supported networks.',
  })
  @ApiResponse({ status: 200, description: 'Health status' })
  health() {
    return this.oneInchService.healthCheck();
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Get quote logs',
    description: 'Retrieve history of quote requests.',
  })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  getLogs() {
    return this.oneInchService.getQuoteLogs();
  }

  @Get('logs/:id')
  @ApiOperation({
    summary: 'Get quote log by ID',
    description: 'Retrieve a specific quote log entry.',
  })
  @ApiParam({
    name: 'id',
    description: 'Log entry UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Log entry retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Log entry not found' })
  getLogById(@Param('id') id: string) {
    return this.oneInchService.getQuoteLogById(id);
  }
}
