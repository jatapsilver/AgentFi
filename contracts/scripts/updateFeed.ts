import { ethers, network } from "hardhat";

// Fetch helper (Node 18 has global fetch; fallback dynamic import if needed)
async function httpGetJson(url: string): Promise<any> {
  if (typeof fetch === "function") {
    const r = await fetch(url);
    return r.json();
  } else {
    const f = (await import("node-fetch")).default as any;
    const r = await f(url);
    return r.json();
  }
}

function upperName(n: string) {
  return n
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toUpperCase();
}

async function main() {
  const netName = network.name; // e.g. sepolia
  const upper = upperName(netName); // SEPOLIA
  const consumerAddressEnv = process.env[`PYTH_CONSUMER_${upper}`];
  const feedEnv = process.env[`PYTH_FEEDS_${upper}`];
  if (!feedEnv) throw new Error(`Missing PYTH_FEEDS_${upper}`);
  const feedId = feedEnv.split(/[,\s]+/)[0]; // use first feed
  // If consumer address not in env, allow passing via CLI arg CONTRACT=0x...
  const cliAddr = process.env.CONTRACT || process.env.contract;
  const consumerAddress = consumerAddressEnv || cliAddr;
  if (!consumerAddress)
    throw new Error(`Provide PYTH_CONSUMER_${upper} or CONTRACT env var`);

  console.log(`Network: ${netName}`);
  console.log(`Consumer: ${consumerAddress}`);
  console.log(`Feed ID: ${feedId}`);

  // Fetch latest VAA update messages for feed
  const url = `https://hermes.pyth.network/api/latest_vaas?ids[]=${feedId}`;
  const json = await httpGetJson(url);
  // API returns an array of base64 strings or object with 'vaas'
  const base64Array: string[] = Array.isArray(json)
    ? json
    : Array.isArray(json.vaas)
      ? json.vaas.map((v: any) => (typeof v === "string" ? v : v.vaa))
      : [];
  if (!base64Array.length)
    throw new Error(`No VAA data returned for feed ${feedId}`);

  const priceUpdateData = base64Array.map((b64) => Buffer.from(b64, "base64"));

  const consumer = await ethers.getContractAt(
    "PythPriceConsumer",
    consumerAddress
  );
  const pythAddr: string = await consumer.pyth();
  const pyth = await ethers.getContractAt("IPyth", pythAddr);
  const fee = await pyth.getUpdateFee(priceUpdateData);
  console.log(`Required update fee (wei): ${fee.toString()}`);

  // Perform update & read price
  const tx = await consumer.updateAndGetPrice(priceUpdateData, feedId, {
    value: fee,
  });
  console.log(`Sent tx: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`Mined in block ${receipt.blockNumber}`);

  const stored = await consumer.getStoredPrice(feedId);
  console.log(
    `Stored price: ${stored.price} expo: ${stored.expo} publishTime: ${stored.publishTime}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
