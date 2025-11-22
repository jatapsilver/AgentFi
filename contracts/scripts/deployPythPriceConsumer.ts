import { ethers, network, run } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

function upperName(n: string) {
  // convert baseSepolia -> BASE_SEPOLIA etc.
  return n
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toUpperCase();
}

function parseFeedIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const netName = network.name; // e.g. sepolia
  const upper = upperName(netName); // SEPOLIA
  const pythAddr = process.env[`PYTH_EVM_CONTRACT_${upper}`];
  if (!pythAddr) {
    throw new Error(
      `Missing PYTH_EVM_CONTRACT_${upper} for network ${netName}`
    );
  }
  const feedRaw = process.env[`PYTH_FEEDS_${upper}`];
  const feedIds = parseFeedIds(feedRaw);
  console.log(`Network: ${netName}`);
  console.log(`Pyth address: ${pythAddr}`);
  console.log(`Feed IDs (${feedIds.length}):`, feedIds);

  // Validate feed ids basic format (0x + 64 hex)
  feedIds.forEach((fid) => {
    if (!/^0x[0-9a-fA-F]{64}$/.test(fid)) {
      throw new Error(`Invalid feed id format: ${fid}`);
    }
  });

  const factory = await ethers.getContractFactory("PythPriceConsumer");
  const deployed = await factory.deploy(pythAddr, feedIds);
  await deployed.waitForDeployment();
  const contractAddress = await deployed.getAddress();
  console.log("PythPriceConsumer deployed at:", contractAddress);

  // Conditional verification: sepolia testnet only + api key present
  const shouldVerify =
    netName === "sepolia" && (process.env.ETHERSCAN_API_KEY || "").length > 0;

  if (shouldVerify) {
    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [pythAddr, feedIds],
      });
      console.log("Verification complete.");
    } catch (err: any) {
      console.error("Verification failed:", err.message || err);
    }
  } else {
    console.log(
      `Skipping verification (network: ${netName}, verification only enabled for sepolia with ETHERSCAN_API_KEY)`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
