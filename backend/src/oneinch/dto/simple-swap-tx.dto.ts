import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimpleSwapTxDto {
  @ApiProperty({
    description: 'Network identifier (e.g. base, ethereum, polygon)',
    required: false,
    example: 'base',
  })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiProperty({ description: 'Source token symbol', example: 'ETH' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9$+._-]{2,15}$/)
  fromSymbol: string;

  @ApiProperty({ description: 'Destination token symbol', example: 'USDC' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9$+._-]{2,15}$/)
  toSymbol: string;

  @ApiProperty({
    description: 'Human readable amount (decimal)',
    example: '0.5',
  })
  @IsString()
  @Matches(/^[0-9]+(\.[0-9]+)?$/)
  amount: string;

  @ApiProperty({
    description: 'Source wallet executing swap',
    example: '0xbddb6c4fc08af549d13a33455374e7ffbfd7fa70',
  })
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @ApiProperty({
    description: 'Slippage tolerance percent',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  slippage?: string;
}
