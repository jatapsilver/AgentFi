import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OneInchService } from './oneinch.service';
import { OneInchController } from './oneinch.controller';
import { SwapQuoteLog } from './entities/swap-quote-log.entity';
import { TokensModule } from '../tokens/tokens.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([SwapQuoteLog]),
    TokensModule,
  ],
  controllers: [OneInchController],
  providers: [OneInchService],
  exports: [OneInchService],
})
export class OneInchModule {}
