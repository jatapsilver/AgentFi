// contracts/hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Helper: build per-network RPC env var name (RPC_URL_<UPPER>)
function rpcFor(name, fallback) {
  const upper = name.toUpperCase();
  const v = process.env[`RPC_URL_${upper}`];
  if (v && v.length > 0) return v;
  if (fallback) return fallback;
  console.warn(`⚠️  Missing RPC for ${name} -> define RPC_URL_${upper}`);
  return "http://127.0.0.1:8545"; // final generic fallback
}

function accounts() {
  return PRIVATE_KEY ? [PRIVATE_KEY] : [];
}

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: { chainId: 31337 },
    // Testnet networks only
    sepolia: {
      url: rpcFor("sepolia"),
      chainId: 11155111,
      accounts: accounts(),
    },
    baseSepolia: {
      url: rpcFor("base_sepolia"),
      chainId: 84532,
      accounts: accounts(),
    },
    polygonAmoy: {
      url: rpcFor("polygon_amoy"),
      chainId: 80002,
      accounts: accounts(),
    },
    optimismSepolia: {
      url: rpcFor("optimism_sepolia"),
      chainId: 11155420,
      accounts: accounts(),
    },
    arbitrumSepolia: {
      url: rpcFor("arbitrum_sepolia"),
      chainId: 421614,
      accounts: accounts(),
    },
    scrollSepolia: {
      url: rpcFor("scroll_sepolia"),
      chainId: 534351,
      accounts: accounts(),
    },
  },
  // Only provide api keys for networks we intend to verify (sepolia only)
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

module.exports = config;
