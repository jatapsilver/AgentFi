import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class SimpleQuoteDto {
  @IsOptional()
  @IsString()
  network?: string; // e.g. "base", "ethereum", "polygon"

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9$+._-]{2,15}$/, { message: 'fromSymbol invalid format' })
  fromSymbol: string; // e.g. "ETH"

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9$+._-]{2,15}$/, { message: 'toSymbol invalid format' })
  toSymbol: string; // e.g. "USDC"

  @IsString()
  @Matches(/^[0-9]+(\.[0-9]+)?$/, {
    message: 'amount must be a decimal number',
  })
  amount: string; // human readable amount e.g. "0.01"

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  slippage?: string;
}
