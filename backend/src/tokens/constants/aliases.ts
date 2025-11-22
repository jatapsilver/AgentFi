// Canonical symbol normalization map.
// Key: user-provided variant (uppercase), Value: canonical symbol used by 1inch tokens list.
// Extend as needed per chain migrations.
export const SYMBOL_ALIASES: Record<string, string> = {
  MATIC: 'WPOL',
  WMATIC: 'WPOL',
  POL: 'WPOL', // treat POL as WPOL for quoting wrapped
  USDC_E: 'USDC',
  USDCe: 'USDC',
  USDCE: 'USDC',
  WETH: 'WETH', // self mappings optional for clarity
  ETH: 'WETH', // on Polygon user may input ETH wanting WETH
};

export function normalizeSymbol(raw: string): string {
  const upper = raw.trim().toUpperCase();
  return SYMBOL_ALIASES[upper] || upper;
}
