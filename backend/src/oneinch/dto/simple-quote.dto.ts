import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimpleQuoteDto {
  @ApiProperty({
    description: 'Network identifier',
    example: 'base',
    required: false,
  })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiProperty({
    description: 'Source token symbol',
    example: 'ETH',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9$+._-]{2,15}$/, { message: 'fromSymbol invalid format' })
  fromSymbol: string;

  @ApiProperty({
    description: 'Destination token symbol',
    example: 'USDC',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9$+._-]{2,15}$/, { message: 'toSymbol invalid format' })
  toSymbol: string;

  @ApiProperty({
    description:
      'Decimal amount with DOT as separator (NOT comma). Examples: 0.5, 0.000005, 100, 1.25',
    example: '0.000005',
  })
  @IsString()
  @Matches(/^[0-9]+(\.[0-9]+)?$/, {
    message: 'amount must be a decimal number',
  })
  amount: string;

  @ApiProperty({
    description: 'Source wallet address (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  fromAddress?: string;

  @ApiProperty({
    description: 'Slippage tolerance percentage',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  slippage?: string;
}
