// backend/src/pyth/pyth.module.ts

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PythService } from './pyth.service';
import { PythController } from './pyth.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [PythService],
  controllers: [PythController],
  exports: [PythService],
})
export class PythModule {}
