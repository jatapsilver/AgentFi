// backend/src/pyth/pyth-feeds.config.ts

export type PythFeedKey = 'ETH_USD' | 'BTC_USD' | 'SOL_USD' | 'USDC_USD';

export interface PythFeedConfig {
  id: string; // priceFeedId de Pyth, en hex, con 0x
  description: string;
}

export const PYTH_FEEDS: Record<PythFeedKey, PythFeedConfig> = {
  ETH_USD: {
    id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    description: 'ETH / USD spot price',
  },
  BTC_USD: {
    id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC/USD feed ID from Pyth
    description: 'BTC / USD spot price',
  },
  SOL_USD: {
    id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', // SOL/USD feed ID from Pyth
    description: 'SOL / USD spot price',
  },
  USDC_USD: {
    id: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a', // USDC/USD feed ID from Pyth
    description: 'USDC / USD oracle price',
  },
};
