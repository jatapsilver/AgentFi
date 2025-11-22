// backend/src/pyth/pyth-networks.config.ts

export type PythNetworkKey = 'sepolia' | 'base-sepolia';

export interface PythNetworkConfig {
  key: PythNetworkKey;
  rpcEnv: string; // nombre de la env del RPC (ej: "SEPOLIA_RPC_URL")
  consumerAddressEnv: string; // nombre de la env del contrato PythPriceConsumer
}

export const PYTH_NETWORKS: Record<PythNetworkKey, PythNetworkConfig> = {
  sepolia: {
    key: 'sepolia',
    rpcEnv: 'SEPOLIA_RPC_URL',
    consumerAddressEnv: 'PYTH_CONSUMER_SEPOLIA',
  },
  'base-sepolia': {
    key: 'base-sepolia',
    rpcEnv: 'BASE_SEPOLIA_RPC_URL',
    consumerAddressEnv: 'PYTH_CONSUMER_BASE_SEPOLIA',
  },
};

export const DEFAULT_PYTH_NETWORK_KEY: PythNetworkKey = 'sepolia';

export function resolvePythNetworkKey(raw?: string): PythNetworkKey {
  if (!raw) return DEFAULT_PYTH_NETWORK_KEY;
  const normalized = raw.trim().toLowerCase();
  switch (normalized) {
    case 'sepolia':
    case 'eth-sepolia':
      return 'sepolia';
    case 'base':
    case 'base-sepolia':
      return 'base-sepolia';
    default:
      throw new Error(`Unsupported Pyth network identifier: ${raw}`);
  }
}
