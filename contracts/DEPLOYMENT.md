# 📄 Deployment Report - PythPriceConsumer

## ✅ Successful Deployments (Testnets)

- **Network**: Sepolia (Chain ID: 11155111)
- **Contract Address**: `0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7`
- **Pyth Contract**: `0xDd24F84d36BF92C65F92307595335bdFab5Bbd21`
- **Feed ID**: ETH/USD (`0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`)
- **Status**: ✅ Deployed successfully
- **Verification**: ⚠️ Attempted (Etherscan API v1 deprecated warning)
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7)

### Base Sepolia

- **Chain ID**: 84532
- **Contract Address**: `0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e`
- **Pyth Contract**: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- **Feed ID**: ETH/USD
- **Status**: ✅ Deployed

### Polygon Amoy

- **Chain ID**: 80002
- **Contract Address**: `0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e`
- **Pyth Contract**: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- **Feed ID**: ETH/USD
- **Status**: ✅ Deployed

### Optimism Sepolia

- **Chain ID**: 11155420
- **Contract Address**: `0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e`
- **Pyth Contract**: `0x0708325268dF9F66270F1401206434524814508b`
- **Feed ID**: ETH/USD
- **Status**: ✅ Deployed

### Arbitrum Sepolia

- **Chain ID**: 421614
- **Contract Address**: `0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e`
- **Pyth Contract**: `0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF`
- **Feed ID**: ETH/USD
- **Status**: ✅ Deployed

### Scroll Sepolia

- **Chain ID**: 534351
- **Contract Address**: `0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e`
- **Pyth Contract**: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- **Feed ID**: ETH/USD
- **Status**: ✅ Deployed

> Nota: El mismo address (`0x91AD...`) en varias redes es esperado; cada red calcula su propio resultado del CREATE y no comparte estado.

## 🔧 Configuration Summary

Parámetros comunes:

- Feed inicial: ETH/USD
- Número de feeds iniciales: 1
- Owner: dirección derivada de la nueva `PRIVATE_KEY`
- Funciones disponibles: `updateAndGetPrice`, `updateAndGetMultiple`, `getStoredPrice`, `addSupportedFeed`, `transferOwnership`.

---

## ✅ Próximas Pruebas Recomendadas

1. Obtener VAA de Hermes para ETH/USD y ejecutar `updateAndGetPrice` en Sepolia.
2. Verificar emisión de `FeedPriceUpdated` en explorer.
3. Llamar `getStoredPrice(feedId)` y comprobar `publishTime > 0`.
4. Añadir feed BTC/USD y repetir update.
5. Probar refund enviando `value` > `getUpdateFee`.

---

## 📌 Verificación Manual (Sepolia)

````bash
npx hardhat verify --network sepolia 0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7 \
   "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21" \
   "[0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace]"

---

## 🐛 Troubleshooting

- Update fallido: revisar fee (`pyth.getUpdateFee`) y frescura del payload.
- `publishTime = 0`: feed no estaba en payload o VAA inválido.
- `Unsupported feed`: registrar con `addSupportedFeed` primero.

---

## 🔐 Security Reminder
Usar solo claves de testnet. Rotar si se expone. Mantener `.env` fuera de control de versiones.
# 📄 Deployment Report - PythPriceConsumer

## ✅ Successful Deployments

### Ethereum Sepolia

- **Network**: Sepolia (Chain ID: 11155111)
- **Contract Address**: `0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7`
- **Pyth Contract**: `0xDd24F84d36BF92C65F92307595335bdFab5Bbd21`
- **Feed ID**: ETH/USD (`0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`)
- **Status**: ✅ Deployed successfully
- **Verification**: ⚠️ Attempted (Etherscan API v1 deprecated warning)
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7)

---

## ❌ Failed Deployments (Insufficient Funds)

All remaining testnets require gas tokens in the deployer wallet (`0x5EEa7805E1920Ed024dBa8fC8c65A1fda2411fEB`):

### Base Sepolia

- **Network**: Base Sepolia (Chain ID: 84532)
- **Pyth Contract**: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- **Required Gas**: ~0.0000013 ETH
- **Status**: ❌ Insufficient funds

### Polygon Amoy

- **Network**: Polygon Amoy (Chain ID: 80002)
- **Pyth Contract**: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- **Required Gas**: ~0.027 MATIC
- **Status**: ❌ Insufficient funds

### Optimism Sepolia

- **Network**: Optimism Sepolia (Chain ID: 11155420)
- **Pyth Contract**: `0x0708325268dF9F66270F1401206434524814508b`
- **Required Gas**: ~0.0000002 ETH
- **Status**: ❌ Insufficient funds

### Arbitrum Sepolia

- **Network**: Arbitrum Sepolia (Chain ID: 421614)
- **Pyth Contract**: `0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF`
- **Required Gas**: ~0.000026 ETH
- **Status**: ❌ Insufficient funds

### Scroll Sepolia

- **Network**: Scroll Sepolia (Chain ID: 534351)
- **Pyth Contract**: `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729`
- **Status**: ❌ Insufficient funds

---

## 🔧 Configuration Summary

All deployments use:

- **Feed ID**: ETH/USD price feed
- **Owner**: Deployer address (`0x5EEa7805E1920Ed024dBa8fC8c65A1fda2411fEB`)
- **Initial Feeds**: 1 (ETH/USD)

## 📝 Next Steps

1. **Fund the deployer wallet** with testnet tokens:
   - Base Sepolia ETH: [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - Polygon Amoy MATIC: [Polygon Faucet](https://faucet.polygon.technology/)
   - Optimism Sepolia ETH: [Optimism Faucet](https://www.alchemy.com/faucets/optimism-sepolia)
   - Arbitrum Sepolia ETH: [Arbitrum Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia)
   - Scroll Sepolia ETH: [Scroll Faucet](https://sepolia.scroll.io/bridge)

2. **Re-run deployments** for remaining networks:

   ```bash
   npm run deploy:pyth:baseSepolia
   npm run deploy:pyth:polygonAmoy
   npm run deploy:pyth:optimismSepolia
   npm run deploy:pyth:arbitrumSepolia
   npm run deploy:pyth:scrollSepolia
````

3. **Update Etherscan API** config to v2 (already fixed in config)

4. **Verify contract on Sepolia** manually if needed:
   ```bash
   npx hardhat verify --network sepolia 0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7 "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21" "[0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace]"
   ```
