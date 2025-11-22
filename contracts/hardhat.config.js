// contracts/hardhat.config.js

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const RPC_URL = process.env.RPC_URL || "";
const RPC_URL_FALLBACK =
  process.env.RPC_URL_FALLBACK || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const CHAIN_ID = process.env.CHAIN_ID
  ? parseInt(process.env.CHAIN_ID, 10)
  : 31337;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Function to get RPC URL with fallback
function getRpcUrl() {
  if (RPC_URL) {
    return RPC_URL;
  }
  console.warn("⚠️  RPC_URL not found, using fallback:", RPC_URL_FALLBACK);
  return RPC_URL_FALLBACK;
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
    hardhat: {
      chainId: 31337,
    },
    testnet: {
      url: getRpcUrl(),
      chainId: CHAIN_ID,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
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
