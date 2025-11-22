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
    summary: '🔥 Get quote by symbols (RECOMMENDED FOR AGENTS)',
    description:
      'Get swap quote using human-readable token symbols and decimal amounts. Backend resolves symbols to addresses and converts amounts to wei automatically. Perfect for N8N agents and chat interfaces.',
  })
  @ApiQuery({
    name: 'network',
    required: false,
    description: 'Network: base, ethereum, polygon, arbitrum, optimism, etc.',
    example: 'base',
  })
  @ApiQuery({
    name: 'fromSymbol',
    required: true,
    description: 'Source token symbol',
    example: 'ETH',
  })
  @ApiQuery({
    name: 'toSymbol',
    required: true,
    description: 'Destination token symbol',
    example: 'USDC',
  })
  @ApiQuery({
    name: 'amount',
    required: true,
    description: 'Human-readable decimal amount (NOT wei)',
    example: '0.5',
  })
  @ApiQuery({
    name: 'slippage',
    required: false,
    description: 'Slippage tolerance in percent (e.g., 1 = 1%)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote retrieved with resolved tokens and conversion details',
    schema: {
      example: {
        network: { key: 'base', chainId: 8453, name: 'Base Mainnet' },
        input: {
          fromSymbol: 'ETH',
          toSymbol: 'USDC',
          amountDecimal: '0.5',
          amountWei: '500000000000000000',
        },
        tokens: {
          from: {
            address: '0x4200000000000000000000000000000000000006',
            decimals: 18,
            symbol: 'WETH',
          },
          to: {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            decimals: 6,
            symbol: 'USDC',
          },
        },
        quote: {
          dstAmount: '1376030000',
          srcAmount: '500000000000000000',
          protocols: [],
        },
      },
    },
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
    summary: '🔥 Build swap transaction by symbols (RECOMMENDED FOR AGENTS)',
    description:
      'Build ready-to-sign swap transaction using token symbols and decimal amounts. Returns transaction object that can be sent to user wallet for signing. Perfect for N8N agents completing swaps.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Transaction built successfully with resolved tokens and tx data',
    schema: {
      example: {
        network: { key: 'polygon', chainId: 137, name: 'Polygon Mainnet' },
        input: {
          fromSymbol: 'MATIC',
          toSymbol: 'USDC',
          amountDecimal: '10',
          amountWei: '10000000000000000000',
        },
        tokens: {
          from: {
            address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            decimals: 18,
            symbol: 'WPOL',
          },
          to: {
            address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            decimals: 6,
            symbol: 'USDC',
          },
        },
        tx: {
          to: '0x1111111254eeb25477b68fb85ed929f73a960582',
          data: '0x12aa3caf...',
          value: '0',
          gas: 185000,
          gasPrice: '50000000000',
        },
      },
    },
  })
  buildSwapTxSimple(@Body() dto: SimpleSwapTxDto) {
    return this.oneInchService.buildSwapTxSimple(dto);
  }

  @Get('balances/:address')
  @ApiOperation({
    summary: '🔥 Get wallet token balances (RECOMMENDED FOR AGENTS)',
    description:
      'Check what tokens a wallet holds on a specific network. Useful for agents to verify user has sufficient balance before attempting swaps.',
  })
  @ApiParam({
    name: 'address',
    description: 'Wallet address to check',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
  })
  @ApiQuery({
    name: 'network',
    required: false,
    description:
      'Network: base, ethereum, polygon, arbitrum, etc. (default: base)',
    example: 'polygon',
  })
  @ApiResponse({
    status: 200,
    description: 'Balances retrieved successfully',
    schema: {
      example: {
        network: { key: 'polygon', chainId: 137, name: 'Polygon Mainnet' },
        balances: {
          '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': '5247382947329847329',
          '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': '150000000',
          '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': '250000000000000000',
        },
      },
    },
  })
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
