// src/config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // General
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('3600s'),

  // 1inch API
  ONEINCH_API_KEY: Joi.string().required(),
  ONEINCH_BASE_URL: Joi.string().default('https://api.1inch.dev'),
  TOKEN_CACHE_TTL_MS: Joi.number().default(3600000),

  // Pyth Oracle
  PYTH_HERMES_URL: Joi.string().default('https://hermes.pyth.network'),
  PYTH_UPDATER_PRIVATE_KEY: Joi.string().required(),
  PYTH_DEFAULT_UPDATE_FEE_WEI: Joi.string().default('100000000000000'),

  // Testnet RPC URLs
  SEPOLIA_RPC_URL: Joi.string().optional(),
  BASE_SEPOLIA_RPC_URL: Joi.string().optional(),
  POLYGON_AMOY_RPC_URL: Joi.string().optional(),
  OPTIMISM_SEPOLIA_RPC_URL: Joi.string().optional(),
  ARBITRUM_SEPOLIA_RPC_URL: Joi.string().optional(),
  SCROLL_SEPOLIA_RPC_URL: Joi.string().optional(),

  // Pyth Consumer Contract Addresses
  PYTH_CONSUMER_SEPOLIA: Joi.string().optional(),
  PYTH_CONSUMER_BASE_SEPOLIA: Joi.string().optional(),
  PYTH_CONSUMER_POLYGON_AMOY: Joi.string().optional(),
  PYTH_CONSUMER_OPTIMISM_SEPOLIA: Joi.string().optional(),
  PYTH_CONSUMER_ARBITRUM_SEPOLIA: Joi.string().optional(),
  PYTH_CONSUMER_SCROLL_SEPOLIA: Joi.string().optional(),
});
