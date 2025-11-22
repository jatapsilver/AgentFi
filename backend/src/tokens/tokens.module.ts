import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TokensService } from './tokens.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
