export type NetworkKey =
  | 'ethereum'
  | 'base'
  | 'polygon'
  | 'bsc'
  | 'arbitrum'
  | 'optimism'
  | 'avalanche'
  | 'fantom'
  | 'gnosis'
  | 'zksync'
  | 'linea'
  | 'scroll'
  | 'blast'
  | 'mode';

export interface NetworkConfig {
  key: NetworkKey;
  chainId: number;
  name: string;
}

export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  ethereum: { key: 'ethereum', chainId: 1, name: 'Ethereum Mainnet' },
  base: { key: 'base', chainId: 8453, name: 'Base Mainnet' },
  polygon: { key: 'polygon', chainId: 137, name: 'Polygon Mainnet' },
  bsc: { key: 'bsc', chainId: 56, name: 'BNB Smart Chain' },
  arbitrum: { key: 'arbitrum', chainId: 42161, name: 'Arbitrum One' },
  optimism: { key: 'optimism', chainId: 10, name: 'Optimism Mainnet' },
  avalanche: { key: 'avalanche', chainId: 43114, name: 'Avalanche C-Chain' },
  fantom: { key: 'fantom', chainId: 250, name: 'Fantom Opera' },
  gnosis: { key: 'gnosis', chainId: 100, name: 'Gnosis Chain' },
  zksync: { key: 'zksync', chainId: 324, name: 'zkSync Era' },
  linea: { key: 'linea', chainId: 59144, name: 'Linea Mainnet' },
  scroll: { key: 'scroll', chainId: 534352, name: 'Scroll Mainnet' },
  blast: { key: 'blast', chainId: 81457, name: 'Blast Mainnet' },
  mode: { key: 'mode', chainId: 34443, name: 'Mode Mainnet' },
};

export const DEFAULT_NETWORK_KEY: NetworkKey = 'base';

export function resolveNetworkConfig(rawNetwork?: string): NetworkConfig {
  if (!rawNetwork) {
    return NETWORKS[DEFAULT_NETWORK_KEY];
  }

  const normalized = rawNetwork.trim().toLowerCase();

  switch (normalized) {
    case 'ethereum':
    case 'eth':
      return NETWORKS.ethereum;
    case 'base':
    case 'base-mainnet':
      return NETWORKS.base;
    case 'polygon':
    case 'matic':
      return NETWORKS.polygon;
    case 'bsc':
    case 'binance':
      return NETWORKS.bsc;
    case 'arbitrum':
    case 'arb':
      return NETWORKS.arbitrum;
    case 'optimism':
    case 'op':
      return NETWORKS.optimism;
    case 'avalanche':
    case 'avax':
      return NETWORKS.avalanche;
    case 'fantom':
    case 'ftm':
      return NETWORKS.fantom;
    case 'gnosis':
    case 'xdai':
      return NETWORKS.gnosis;
    case 'zksync':
    case 'era':
      return NETWORKS.zksync;
    case 'linea':
      return NETWORKS.linea;
    case 'scroll':
      return NETWORKS.scroll;
    case 'blast':
      return NETWORKS.blast;
    case 'mode':
      return NETWORKS.mode;
    default:
      throw new Error(`Unsupported network identifier: ${rawNetwork}`);
  }
}
