const { ethers } = require("ethers");
require("dotenv").config();

// Networks we will test (must have RPC_URL_<UPPER>, PYTH_EVM_CONTRACT_<UPPER>, feed ID shared)
const NETWORKS = [
  "sepolia",
  "base_sepolia",
  "polygon_amoy",
  "optimism_sepolia",
  "arbitrum_sepolia",
  "scroll_sepolia",
];

/** @param {string} name */
function upper(name) {
  return name.toUpperCase();
}

/** @param {string[]} base64List */
function toBytesArray(base64List) {
  return base64List.map((b) => Buffer.from(b, "base64"));
}

/** @param {string} feedId */
async function fetchVaas(feedId) {
  const url = `https://hermes.pyth.network/api/latest_vaas?ids[]=${feedId}`;
  const res = await fetch(url);
  const json = await res.json();
  const arr = Array.isArray(json)
    ? json
    : Array.isArray(json.vaas)
      ? json.vaas.map((v) => (typeof v === "string" ? v : v.vaa))
      : [];
  if (!arr.length) throw new Error(`No VAA data for feed ${feedId}`);
  return toBytesArray(arr);
}

async function run() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY missing");
  const wallet = new ethers.Wallet(pk);
  console.log("Using deployer:", wallet.address);

  for (const n of NETWORKS) {
    const up = upper(n);
    const rpc = process.env[`RPC_URL_${up}`];
    const consumer = process.env[`PYTH_CONSUMER_${up}`];
    const feeds = process.env[`PYTH_FEEDS_${up}`];
    if (!rpc || !consumer || !feeds) {
      console.warn(`Skipping ${n} (missing RPC/consumer/feed env vars)`);
      continue;
    }
    const feedId = feeds.split(/[,\s]+/)[0];
    const provider = new ethers.JsonRpcProvider(rpc);
    const signer = wallet.connect(provider);
    console.log(
      `\n=== Network: ${n} | Consumer: ${consumer} | Feed: ${feedId} ===`
    );
    const consumerContract = new ethers.Contract(
      consumer,
      [
        "function pyth() view returns(address)",
        "function updateAndGetPrice(bytes[] priceUpdateData, bytes32 feedId) payable returns(int64,int32)",
        "function getStoredPrice(bytes32 feedId) view returns(tuple(int64 price,int32 expo,uint publishTime))",
      ],
      signer
    );
    const pythAddress = await consumerContract.pyth();
    const pythContract = new ethers.Contract(
      pythAddress,
      ["function getUpdateFee(bytes[] priceUpdateData) view returns(uint256)"],
      provider
    );
    try {
      const updateData = await fetchVaas(feedId);
      const fee = await pythContract.getUpdateFee(updateData);
      console.log(`Required fee: ${fee.toString()} wei`);
      const bal = await provider.getBalance(wallet.address);
      console.log(`Wallet balance: ${bal.toString()} wei`);
      if (bal < fee) {
        console.warn(`Insufficient balance for ${n}, skipping update.`);
        continue;
      }
      const tx = await consumerContract.updateAndGetPrice(updateData, feedId, {
        value: fee,
      });
      console.log(`Tx sent: ${tx.hash}`);
      const rcpt = await tx.wait();
      console.log(`Mined block: ${rcpt.blockNumber}`);
      const stored = await consumerContract.getStoredPrice(feedId);
      console.log(
        `Stored price=${stored.price} expo=${stored.expo} publishTime=${stored.publishTime}`
      );
    } catch (e) {
      console.error(`Update failed on ${n}:`, e.message || e);
    }
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
