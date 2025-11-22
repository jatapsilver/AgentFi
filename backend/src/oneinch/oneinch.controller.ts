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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OneInchService } from './oneinch.service';
import { GetQuoteDto } from './dto/get-quote.dto';
import { BuildSwapTxDto } from './dto/build-swap-tx.dto';
import { SimpleQuoteDto } from './dto/simple-quote.dto';

@ApiTags('1inch Integration')
@Controller('oneinch')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class OneInchController {
  constructor(private readonly oneInchService: OneInchService) {}

  @Get('quote')
  @ApiOperation({
    summary: 'Get swap quote',
    description: 'Get a quote for swapping tokens using 1inch aggregator',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters',
  })
  getQuote(@Query() dto: GetQuoteDto) {
    const userId: string | undefined = undefined;
    return this.oneInchService.getQuote(dto, userId);
  }

  @Get('quote/simple')
  @ApiOperation({
    summary: 'Get simple quote by symbols',
    description: 'Resolve tokens by symbol & network and return enriched quote',
  })
  @ApiResponse({
    status: 200,
    description: 'Simple quote retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  getQuoteSimple(@Query() dto: SimpleQuoteDto) {
    return this.oneInchService.getQuoteSimple(dto);
  }

  @Post('tx')
  @ApiOperation({
    summary: 'Build swap transaction',
    description: 'Build a ready-to-sign transaction for token swap',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction built successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters',
  })
  buildSwapTx(@Body() dto: BuildSwapTxDto) {
    return this.oneInchService.buildSwapTx(dto);
  }

  @Get('balances/:address')
  @ApiOperation({
    summary: 'Get wallet balances',
    description: 'Get token balances for a given wallet address',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
  })
  @ApiResponse({
    status: 200,
    description: 'Balances retrieved successfully',
  })
  getBalances(@Param('address') address: string) {
    return this.oneInchService.getWalletBalances(address);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check 1inch integration configuration status',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status',
  })
  health() {
    return this.oneInchService.healthCheck();
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Get quote logs',
    description: 'Retrieve history of quote requests',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs retrieved successfully',
  })
  getLogs() {
    return this.oneInchService.getQuoteLogs();
  }

  @Get('logs/:id')
  @ApiOperation({
    summary: 'Get quote log by ID',
    description: 'Retrieve a specific quote log entry',
  })
  @ApiParam({
    name: 'id',
    description: 'Log entry UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Log entry retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Log entry not found',
  })
  getLogById(@Param('id') id: string) {
    return this.oneInchService.getQuoteLogById(id);
  }
}
