# Pyth Oracle Module

Módulo NestJS para integrar Pyth Network Oracle usando el método Pull de actualización de precios on-chain.

## 🎯 Funcionalidad

Este módulo implementa el **flujo completo del método Pull de Pyth**:

1. **Pull/Fetch**: Obtiene datos de precios actualizados desde Hermes (servicio de Pyth)
2. **Update On-Chain**: Llama a `updatePriceFeeds` en el contrato `PythPriceConsumer` deployado
3. **Read Price**: Lee el precio almacenado en el contrato y lo devuelve vía REST API

## 📁 Estructura

```
src/pyth/
├── abi/
│   ├── PythPriceConsumer.json    # ABI del contrato (extraído de Hardhat)
│   └── index.ts                   # Export del ABI
├── dto/
│   ├── get-pyth-price.dto.ts      # DTO para endpoint /price
│   └── get-pyth-multi-price.dto.ts # DTO para endpoint /prices
├── pyth-feeds.config.ts           # Configuración de feeds (ETH/USD, BTC/USD, etc.)
├── pyth-networks.config.ts        # Configuración de redes soportadas
├── pyth.service.ts                # Lógica de negocio (Pull + Update + Read)
├── pyth.controller.ts             # Endpoints REST
└── pyth.module.ts                 # Módulo NestJS
```

## 🔧 Configuración

### Variables de Entorno Requeridas

```bash
# Pyth Oracle Core
PYTH_HERMES_URL=https://hermes.pyth.network
PYTH_UPDATER_PRIVATE_KEY=0x...  # Private key para firmar transacciones
PYTH_DEFAULT_UPDATE_FEE_WEI=100000000000000  # 0.0001 ETH fallback

# RPC URLs (al menos una red requerida)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Contract Addresses (direcciones de PythPriceConsumer deployados)
PYTH_CONSUMER_SEPOLIA=0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7
PYTH_CONSUMER_BASE_SEPOLIA=0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e
```

## 🚀 Endpoints

### 1. Obtener Precio Individual

```http
GET /pyth/price?feedKey=ETH_USD&network=sepolia&mode=update
```

**Query Parameters:**

- `feedKey` (required): `ETH_USD` | `BTC_USD` | `SOL_USD` | `USDC_USD`
- `network` (optional): `sepolia` | `base-sepolia` (default: `sepolia`)
- `mode` (optional): `update` | `read-only` (default: `update`)

**Modos de Operación:**

- **`update` (default)**: Ejecuta el flujo completo Pull → Update → Read
  1. Obtiene VAA desde Hermes
  2. Envía transacción on-chain para actualizar precio
  3. Lee precio almacenado
- **`read-only`**: Solo lee el precio almacenado sin actualizar (no consume gas)

**Respuesta (modo `update`):**

```json
{
  "network": "sepolia",
  "feedKey": "ETH_USD",
  "feedId": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  "txHash": "0xabc123...",
  "onChain": {
    "rawPrice": "274825566837",
    "expo": -8,
    "publishTime": 1700000000,
    "priceDecimal": "2748.25566837"
  }
}
```

**Respuesta (modo `read-only`):**

```json
{
  "network": "sepolia",
  "feedKey": "ETH_USD",
  "feedId": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  "onChain": {
    "rawPrice": "274825566837",
    "expo": -8,
    "publishTime": 1700000000,
    "priceDecimal": "2748.25566837"
  },
  "mode": "read-only"
}
```

### 2. Obtener Múltiples Precios (Batch)

```http
GET /pyth/prices?feedKeys=ETH_USD&feedKeys=BTC_USD&feedKeys=SOL_USD&network=sepolia
```

**Query Parameters:**

- `feedKeys` (required, array): Lista de feed keys a consultar
- `network` (optional): Red a utilizar
- `mode` (optional): `update` | `read-only`

**Respuesta:**

```json
{
  "network": "sepolia",
  "txHash": "0xdef456...",
  "results": [
    {
      "feedKey": "ETH_USD",
      "feedId": "0xff614...",
      "onChain": {
        "rawPrice": "274825566837",
        "expo": -8,
        "publishTime": 1700000000,
        "priceDecimal": "2748.25566837"
      }
    },
    {
      "feedKey": "BTC_USD",
      "feedId": "0xe62df...",
      "onChain": {
        "rawPrice": "4312550000000",
        "expo": -8,
        "publishTime": 1700000000,
        "priceDecimal": "43125.50000000"
      }
    }
  ]
}
```

## 🔑 Feed Keys Disponibles

| Feed Key   | Pair     | Feed ID (Pyth)                                                       |
| ---------- | -------- | -------------------------------------------------------------------- |
| `ETH_USD`  | ETH/USD  | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |
| `BTC_USD`  | BTC/USD  | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| `SOL_USD`  | SOL/USD  | `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` |
| `USDC_USD` | USDC/USD | `0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a` |

Más feed IDs en: https://pyth.network/developers/price-feed-ids

## 🌐 Redes Soportadas

- **Sepolia** (`sepolia`, `eth-sepolia`)
- **Base Sepolia** (`base-sepolia`, `base`)

Puedes agregar más redes editando `pyth-networks.config.ts` y agregando las variables de entorno correspondientes.

## 💡 Casos de Uso

### Para Agentes AI / Automatización

```bash
# Actualizar precio ETH en Sepolia
curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=sepolia"

# Leer precio almacenado sin actualizar (sin costo de gas)
curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=sepolia&mode=read-only"

# Actualizar múltiples precios en una sola transacción
curl "http://localhost:3000/pyth/prices?feedKeys=ETH_USD&feedKeys=BTC_USD&network=base-sepolia"
```

### Desde tu Frontend/App

```typescript
// Obtener precio actualizado
const response = await fetch('/pyth/price?feedKey=ETH_USD&network=sepolia');
const data = await response.json();
console.log(`ETH Price: $${data.onChain.priceDecimal}`);

// Leer precio almacenado (más rápido, sin gas)
const cached = await fetch(
  '/pyth/price?feedKey=ETH_USD&network=sepolia&mode=read-only',
);
```

## 🔒 Seguridad

- **Private Key**: La `PYTH_UPDATER_PRIVATE_KEY` debe ser una wallet dedicada solo para updates de Pyth
- **Fondeo**: Mantén fondos suficientes en la wallet para pagar gas fees de updates
- **Rate Limiting**: Considera agregar rate limiting a los endpoints para evitar abuse
- **Validation**: Todos los DTOs usan `class-validator` para validación estricta

## 📊 Gas Costs

- **Single Update** (`updateAndGetPrice`): ~150k - 250k gas
- **Batch Update** (`updateAndGetMultiple`): ~200k - 400k gas (dependiendo de cantidad de feeds)
- **Read Only** (`getStoredPrice`): 0 gas (view function)

## 🐛 Troubleshooting

### Error: "Network client not available"

- Verifica que las variables `RPC_URL_<NETWORK>` y `PYTH_CONSUMER_<NETWORK>` estén configuradas
- Revisa los logs al iniciar el backend: debe mostrar "Initialized Pyth client for..."

### Error: "Failed to fetch price update data"

- Verifica que `PYTH_HERMES_URL` sea accesible
- Confirma que el `feedId` en `pyth-feeds.config.ts` sea correcto

### Transacción falla con "Insufficient fee"

- Incrementa `PYTH_DEFAULT_UPDATE_FEE_WEI` en tu `.env`
- Verifica que la wallet tenga fondos suficientes

### Precio devuelve 0

- El feed puede no haber sido actualizado nunca en ese contrato
- Ejecuta un update primero con `mode=update`

## 🔗 Links Útiles

- [Pyth Network Docs](https://docs.pyth.network/)
- [Hermes API](https://hermes.pyth.network/docs)
- [Price Feed IDs](https://pyth.network/developers/price-feed-ids)
- [Contract Addresses](https://docs.pyth.network/price-feeds/contract-addresses/evm)
