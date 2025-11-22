# Pyth Module - Testing Guide

## 🧪 Pruebas Manuales

### 1. Verificar que el servicio inició correctamente

Al iniciar el backend, debes ver logs como:

```
[PythService] Initialized Pyth client for sepolia at 0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7
[PythService] Initialized Pyth client for base-sepolia at 0x91AD55444751D26d1FfDB3A883810BA3a3B79F3e
```

### 2. Test con cURL

#### Obtener precio ETH/USD en Sepolia (con update on-chain)

```bash
curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=sepolia"
```

**Respuesta esperada:**

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

#### Leer precio almacenado (sin tx, más rápido)

```bash
curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=sepolia&mode=read-only"
```

#### Obtener precio en Base Sepolia

```bash
curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=base-sepolia"
```

#### Batch: Múltiples precios en una sola tx

```bash
curl "http://localhost:3000/pyth/prices?feedKeys=ETH_USD&feedKeys=BTC_USD&feedKeys=SOL_USD&network=sepolia"
```

### 3. Test con Postman/Insomnia

**GET** `http://localhost:3000/pyth/price`

Query Params:

- `feedKey`: `ETH_USD`
- `network`: `sepolia`
- `mode`: `update` (o `read-only`)

### 4. Verificar en Blockchain Explorer

Después de hacer un update, copia el `txHash` de la respuesta y búscalo en:

- Sepolia: https://sepolia.etherscan.io/tx/[txHash]
- Base Sepolia: https://sepolia.basescan.org/tx/[txHash]

Debes ver:

- Transaction confirmada
- Evento `FeedPriceUpdated` emitido
- Gas usado: ~150k - 250k

### 5. Test de Validación

#### ❌ Feed key inválido (debe fallar)

```bash
curl "http://localhost:3000/pyth/price?feedKey=INVALID_KEY&network=sepolia"
```

**Respuesta esperada:** 400 Bad Request

#### ❌ Red no soportada (debe fallar)

```bash
curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=mainnet"
```

**Respuesta esperada:** 500 Internal Server Error con mensaje "Unsupported Pyth network identifier"

### 6. Performance Tests

#### Comparar tiempos: Update vs Read-Only

```bash
# Con update (lento, ~15-30 segundos)
time curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=sepolia&mode=update"

# Read-only (rápido, <1 segundo)
time curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=sepolia&mode=read-only"
```

#### Batch vs Individual

```bash
# Batch (1 tx, más eficiente)
time curl "http://localhost:3000/pyth/prices?feedKeys=ETH_USD&feedKeys=BTC_USD&network=sepolia"

# Individual (2 tx, más costoso)
time curl "http://localhost:3000/pyth/price?feedKey=ETH_USD&network=sepolia"
time curl "http://localhost:3000/pyth/price?feedKey=BTC_USD&network=sepolia"
```

## 🐛 Common Issues

### Error: "No Pyth network clients initialized"

**Causa:** Ninguna red se configuró correctamente.

**Solución:**

1. Verifica que tu `.env` tenga las variables necesarias
2. Revisa los logs al iniciar el backend
3. Asegúrate que el RPC URL sea válido y accesible

### Error: "Failed to fetch price update data"

**Causa:** No se pudo conectar con Hermes.

**Solución:**

1. Verifica conectividad a internet
2. Prueba manualmente: `curl "https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace&encoding=hex"`
3. Verifica `PYTH_HERMES_URL` en tu `.env`

### Transaction falla: "Insufficient fee"

**Causa:** El `PYTH_DEFAULT_UPDATE_FEE_WEI` es muy bajo.

**Solución:**

1. Incrementa el valor en `.env` (ej: `200000000000000` = 0.0002 ETH)
2. O consulta el fee exacto desde el contrato Pyth antes de enviar

### Precio devuelve 0 en read-only

**Causa:** El feed nunca ha sido actualizado en ese contrato.

**Solución:**

1. Ejecuta un update primero: `mode=update`
2. Luego puedes usar `mode=read-only`

### Wallet sin fondos

**Causa:** La `PYTH_UPDATER_PRIVATE_KEY` wallet no tiene ETH para gas.

**Solución:**

1. Usa un faucet para obtener testnet ETH
2. Verifica balance: https://sepolia.etherscan.io/address/[tu_wallet]

## 📊 Expected Gas Costs (Sepolia)

| Operation              | Gas Used | Cost @ 20 gwei |
| ---------------------- | -------- | -------------- |
| Single Update          | ~200k    | 0.004 ETH      |
| Batch Update (3 feeds) | ~350k    | 0.007 ETH      |
| Read-Only              | 0        | Free           |

## ✅ Checklist de Testing Completo

- [ ] Backend inicia sin errores
- [ ] Se inicializan clientes para Sepolia y Base Sepolia
- [ ] GET /pyth/price funciona con ETH_USD
- [ ] mode=read-only devuelve precio sin txHash
- [ ] mode=update devuelve precio con txHash válido
- [ ] GET /pyth/prices funciona con múltiples feeds
- [ ] Validación rechaza feed keys inválidos
- [ ] Validación rechaza redes no soportadas
- [ ] Transaction se confirma en blockchain explorer
- [ ] Evento FeedPriceUpdated se emite correctamente
- [ ] Precio decimal se calcula correctamente (expo negativo)
- [ ] Timestamp (publishTime) es reciente y válido

## 🔄 Workflow Recomendado

Para desarrollo y testing:

1. **Primera vez**: Usa `mode=update` para inicializar el precio en el contrato
2. **Lecturas frecuentes**: Usa `mode=read-only` para evitar costos de gas
3. **Updates periódicos**: Configura un cron job o agente que actualice cada X minutos
4. **Validación**: Siempre verifica que `publishTime` no sea muy antiguo (< 60 segundos ideal)

## 📝 Notas

- Los precios de Pyth se actualizan cada ~400ms en Hermes
- El `publishTime` viene del oráculo, no del blockchain
- Un precio con `publishTime` muy antiguo (>5 min) puede estar stale
- En producción, considera validar la frescura del precio antes de usarlo
- Para high-frequency trading, usa el modo batch para ahorrar gas
