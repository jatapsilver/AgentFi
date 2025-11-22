import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * Script to add additional supported feed IDs to existing PythPriceConsumer contracts
 *
 * Usage:
 * npx hardhat run scripts/addSupportedFeeds.ts --network sepolia
 */

// Additional feeds to support (BTC, SOL, USDC)
const ADDITIONAL_FEEDS = {
  BTC_USD: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
  SOL_USD: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
  USDC_USD:
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
};

function upperName(n: string) {
  return n
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toUpperCase();
}

async function main() {
  const netName = network.name;
  const upper = upperName(netName);
  const consumerAddress = process.env[`PYTH_CONSUMER_${upper}`];

  if (!consumerAddress) {
    throw new Error(`Missing PYTH_CONSUMER_${upper} for network ${netName}`);
  }

  console.log(`\n📡 Network: ${netName}`);
  console.log(`📝 Consumer Contract: ${consumerAddress}`);

  const [signer] = await ethers.getSigners();
  console.log(`🔑 Signer: ${signer.address}\n`);

  const consumer = await ethers.getContractAt(
    "PythPriceConsumer",
    consumerAddress,
    signer
  );

  // Check ownership
  const owner = await consumer.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `Signer ${signer.address} is not the owner (${owner}). Cannot add feeds.`
    );
  }

  console.log("✅ Ownership verified. Adding feeds...\n");

  for (const [name, feedId] of Object.entries(ADDITIONAL_FEEDS)) {
    try {
      // Check if already supported
      const isSupported = await consumer.supportedFeedIds(feedId);

      if (isSupported) {
        console.log(`⏭️  ${name} (${feedId}) - Already supported`);
        continue;
      }

      console.log(`➕ Adding ${name} (${feedId})...`);
      const tx = await consumer.addSupportedFeed(feedId);
      const receipt = await tx.wait(1);
      console.log(`   ✅ Tx: ${receipt?.hash}\n`);
    } catch (error: any) {
      console.error(`   ❌ Failed to add ${name}: ${error.message}\n`);
    }
  }

  console.log("🎉 Feed addition complete!\n");

  // Verify all feeds are now supported
  console.log("🔍 Verifying supported feeds:");
  for (const [name, feedId] of Object.entries(ADDITIONAL_FEEDS)) {
    const isSupported = await consumer.supportedFeedIds(feedId);
    console.log(`   ${isSupported ? "✅" : "❌"} ${name}: ${feedId}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
