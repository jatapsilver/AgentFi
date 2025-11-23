// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OneInchModule } from './oneinch/oneinch.module';
import { envValidationSchema } from './config/env.validation';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PythModule } from './pyth/pyth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        synchronize: true,
        autoLoadEntities: true,
        logging: config.get<string>('NODE_ENV') !== 'production',
        retryAttempts: 30,
        retryDelay: 5000,
      }),
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    OneInchModule,
    UserModule,
    AuthModule,
    PythModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
