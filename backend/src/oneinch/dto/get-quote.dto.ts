import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetQuoteDto {
  @ApiProperty({
    description: 'Source token contract address',
    example: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  })
  @IsString()
  @IsNotEmpty()
  fromTokenAddress: string;

  @ApiProperty({
    description: 'Destination token contract address',
    example: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  })
  @IsString()
  @IsNotEmpty()
  toTokenAddress: string;

  @ApiProperty({
    description: 'Amount of source token in smallest unit (e.g., wei for ETH)',
    example: '10000000000000000',
  })
  @IsString()
  @Matches(/^\d+$/, { message: 'amount must be an integer in wei' })
  amount: string;

  @ApiProperty({
    description: 'Source wallet address (optional)',
    example: '0xbddb6c4fc08af549d13a33455374e7ffbfd7fa70',
    required: false,
  })
  @IsOptional()
  @IsString()
  fromAddress?: string;

  @ApiProperty({
    description: 'Slippage tolerance percentage (e.g., 1 for 1%)',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  slippage?: string;
}
