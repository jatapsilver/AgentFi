# DeFi Edu Contracts – Pyth Integration

Multi-network Pyth price feed consumer contract with deployment scripts for 6 EVM testnets.

## 📋 Contract Overview

`PythPriceConsumer.sol`:

- Multi-feed price consumer for Pyth Network
- Owner-managed feed ID registration
- On-chain price updates via `updateAndGetPrice` / `updateAndGetMultiple`
- Automatic excess ETH refund after paying Pyth update fees
- Persistent storage of latest prices (mantissa, exponent, publishTime)

## 🌐 Supported Networks (Testnets Only)

| Network          | Chain ID | Pyth Contract                                | Status      |
| ---------------- | -------- | -------------------------------------------- | ----------- |
| Ethereum Sepolia | 11155111 | `0xDd24F84d36BF92C65F92307595335bdFab5Bbd21` | ✅ Deployed |
| Base Sepolia     | 84532    | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` | ⏳ Ready    |
| Polygon Amoy     | 80002    | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` | ⏳ Ready    |
| Optimism Sepolia | 11155420 | `0x0708325268dF9F66270F1401206434524814508b` | ⏳ Ready    |
| Arbitrum Sepolia | 421614   | `0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF` | ⏳ Ready    |
| Scroll Sepolia   | 534351   | `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` | ⏳ Ready    |

**Deployed Contract (Sepolia)**: [`0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7`](https://sepolia.etherscan.io/address/0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7)

## 🚀 Quick Start

### Install & Compile

```bash
npm install
npm run compile
```

### Deploy to Network

```bash
# Ethereum Sepolia (with verification)
npm run deploy:pyth:sepolia

# Other networks
npm run deploy:pyth:baseSepolia
npm run deploy:pyth:polygonAmoy
npm run deploy:pyth:optimismSepolia
npm run deploy:pyth:arbitrumSepolia
npm run deploy:pyth:scrollSepolia
```

## ⚙️ Configuration

Configure `.env` with per-network settings:

```bash
# Deployer account
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key

# Network RPC URLs
RPC_URL_SEPOLIA=https://sepolia.infura.io/v3/YOUR_KEY
RPC_URL_BASE_SEPOLIA=https://sepolia.base.org
RPC_URL_POLYGON_AMOY=https://rpc-amoy.polygon.technology
# ... (see .env.example for all networks)

# Pyth Contracts (already configured in .env.example)
PYTH_EVM_CONTRACT_SEPOLIA=0xDd24F84d36BF92C65F92307595335bdFab5Bbd21
# ... (auto-loaded from .env)

# Feed IDs (comma-separated bytes32 hex)
PYTH_FEEDS_SEPOLIA=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace
# ETH/USD feed ID (same for all testnets)
```

## 🧪 Testing Guide

### 1. Verify Deployment

Check contract on explorer:

```bash
# Sepolia example
https://sepolia.etherscan.io/address/0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7
```

### 2. Read Contract State

Using Hardhat console or Etherscan:

```javascript
const contract = await ethers.getContractAt(
  "PythPriceConsumer",
  "0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7",
);

// Check Pyth address
await contract.pyth(); // Should return Pyth contract address

// Check owner
await contract.owner(); // Your deployer address

// Check if feed is supported
const ethUsdFeed =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
await contract.supportedFeedIds(ethUsdFeed); // Should return true
```

### 3. Update Price Feed (Off-chain test)

Fetch price update data from Hermes:

```bash
# Get ETH/USD price update
curl "https://hermes.pyth.network/api/latest_vaas?ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
```

### 4. Update Price On-Chain

```javascript
// Example: Update ETH/USD price
const priceUpdateData = ["0x..."]; // From Hermes API
const feedId =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

// Get required fee
const fee = await contract.pyth.getUpdateFee(priceUpdateData);

// Update and get price
const tx = await contract.updateAndGetPrice(priceUpdateData, feedId, {
  value: fee,
});
await tx.wait();

// Read stored price
const stored = await contract.getStoredPrice(feedId);
console.log("Price:", stored.price);
console.log("Exponent:", stored.expo);
console.log("Publish Time:", stored.publishTime);
```

### 4.1 Scripted Update (Recommended)

Instead of manual steps, use the provided scripts:

```bash
# Single network (uses env feed & contract address)
npm run update:feed:sepolia
npm run update:feed:baseSepolia
npm run update:feed:polygonAmoy
npm run update:feed:optimismSepolia
npm run update:feed:arbitrumSepolia
npm run update:feed:scrollSepolia

# Batch test all testnets sequentially
npm run update:all
```

These scripts:

- Fetch latest VAA update messages from Hermes.
- Compute required fee via `IPyth.getUpdateFee`.
- Call `updateAndGetPrice` and log stored price.
- Skip networks missing required env vars.

To override the consumer address (if not set via `PYTH_CONSUMER_<NETWORK>`), pass:

```bash
CONTRACT=0xYourConsumerAddress npm run update:feed:sepolia
```

Add `PYTH_CONSUMER_<NETWORK>` env variables to `.env` for convenience:

```
PYTH_CONSUMER_SEPOLIA=0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7
PYTH_CONSUMER_BASE_SEPOLIA=0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e
PYTH_CONSUMER_POLYGON_AMOY=0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e
PYTH_CONSUMER_OPTIMISM_SEPOLIA=0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e
PYTH_CONSUMER_ARBITRUM_SEPOLIA=0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e
PYTH_CONSUMER_SCROLL_SEPOLIA=0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e
```

### 4.2 Validating Results

After a script run, confirm:

- Tx hash printed.
- Stored price non-zero.
- publishTime recent (compare with current epoch time).
- Repeat run later shows changed price or publishTime.

### 4.3 Common Issues

- Fee mismatch: Ensure script reads fee from chain (already handled).
- Empty VAA array: Hermes outage or incorrect feed ID.
- Low balance: Fund wallet with faucet tokens before retry.

### 5. Test Owner Functions

```javascript
// Add new feed (owner only)
const btcUsdFeed =
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
await contract.addSupportedFeed(btcUsdFeed);

// Transfer ownership
await contract.transferOwnership(newOwnerAddress);
```

## 🔍 Verification

Only Sepolia supports automatic Etherscan verification. For manual verification:

```bash
npx hardhat verify --network sepolia \
  0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7 \
  "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21" \
  "[0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace]"
```

## 📊 Price Feed IDs

Common Pyth price feeds (all networks):

- **ETH/USD**: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- **BTC/USD**: `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- **USDC/USD**: `0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a`

Find more: [Pyth Price Feed IDs](https://pyth.network/developers/price-feed-ids)

## 🐛 Troubleshooting

### Insufficient Funds Error

Fund deployer wallet with testnet tokens:

- [Sepolia ETH Faucet](https://sepoliafaucet.com/)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- [Optimism Sepolia Faucet](https://www.alchemy.com/faucets/optimism-sepolia)
- [Arbitrum Sepolia Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia)
- [Scroll Sepolia Faucet](https://sepolia.scroll.io/bridge)

### Invalid Feed ID Format

Ensure feed IDs are 66 characters (0x + 64 hex):

```javascript
// ✅ Valid
"0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

// ❌ Invalid
"ff61491a..."; // Missing 0x prefix
"0xff614..."; // Too short
```

### Price Update Failures

- Ensure sufficient ETH sent with transaction (check `getUpdateFee`)
- Verify price update data is fresh (< 60s old from Hermes)
- Confirm feed ID is registered in contract

## 📚 Resources

- [Pyth Network Docs](https://docs.pyth.network/)
- [Pyth EVM Contract Addresses](https://docs.pyth.network/price-feeds/contract-addresses/evm)
- [Hermes API](https://hermes.pyth.network/docs)
- [Price Feed Explorer](https://pyth.network/developers/price-feed-ids)

## ⚠️ Security

- Never use production private keys in development
- Keep `.env` file out of version control
- Test thoroughly on testnets before mainnet deployment
- Audit contract before production use

---

See `DEPLOYMENT.md` for detailed deployment logs and status.
