<div align="center">
	<img src="public/logo.png" alt="AgentFi Logo" height="110" />
	<h1>AgentFi – AI-Powered DeFi Education & Execution Platform</h1>
	<p><strong>Learn DeFi concepts, query real market data, and execute on-chain actions through intelligent, multi-modal AI agents.</strong></p>
	<img src="public/cover.jpg" alt="AgentFi Cover" width="820" />
	<br/>
	<img src="public/Frontend View.png" alt="Frontend Application View" width="380" />
	<img src="public/API Documentation.png" alt="Swagger API Documentation" width="380" />
	<img src="public/chatbot view.png" alt="Chatbot Modal View" width="780" />
</div>

---

## Table of Contents

1. Overview
2. Architecture
3. Core Features
4. Backend (NestJS) – Modules & Endpoints
5. Smart Contracts (Hardhat / Pyth Consumer)
6. AI Agents (n8n Workflows)
7. Frontend (Vite + React)
8. Authentication & Security Model
9. Environment Configuration
10. Local Development & Docker
11. Operational Flows (Price Update, Swap Build, Agent Chat)
12. Assets & Media
13. Roadmap & Future Work
14. Troubleshooting & Support
15. Disclaimer

---

## 1. Overview

AgentFi is a DeFi educational and execution platform combining:

- A **NestJS backend** exposing secured endpoints for token swaps (1inch), price oracle updates (Pyth), balances and logs.
- A **React/Vite frontend** with multilingual UX (English/Spanish), interactive chatbot (text + audio), authentication, and agent-driven tooling.
- **Self-hosted n8n AI automation workflows** powering conversational reasoning, tool orchestration, and execution triggers.
- **Smart contracts** for on-chain Pyth price feed consumption across multiple EVM test networks.

Primary goal: Provide a guided, safe, testnet-based learning environment where users (or autonomous agents) can observe and perform real DeFi operations.

---

## 2. Architecture

```
Root
├── backend (NestJS API: auth, Pyth, 1inch, tokens, Swagger)
├── frontend (React + Vite UI, Chatbot, session management)
├── ai-agents (n8n self-hosted orchestration + versioned workflows)
│   └── workflows/v1, v2 (JSON definitions for agents/tools)
├── contracts (Hardhat project: PythPriceConsumer + deployment scripts)
├── public (Shared marketing & documentation images)
```

Key Integration Points:

- Frontend ↔ Backend: REST + JWT Bearer authentication.
- Frontend ↔ n8n: Webhook (`VITE_WEBHOOK_URL`) for agent/chat actions.
- Backend ↔ Pyth: Hermes API (price update VAAs) + on-chain contract calls.
- Backend ↔ 1inch: Aggregation & swap transaction building.

---

## 3. Core Features

| Domain      | Feature                | Description                                                                            |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------- |
| Education   | Interactive Chatbot    | Multi-language AI assistant with audio input & token gating.                           |
| Oracle      | Pyth Price Feeds       | Fetch, batch update, and read stored on-chain prices (update vs read-only).            |
| Trading     | 1inch Integration      | Quote tokens (by symbol or address), build swap transactions, inspect balances.        |
| Automation  | n8n Agents             | Workflow-driven orchestration (1inch Agent, Pyth Agent, Information Agent, Swap Tool). |
| Logging     | Swap Quote Logs        | Persisted quote history for analysis & replay.                                         |
| Security    | JWT Auth & Role Guards | Access control to DeFi endpoints and agent tools.                                      |
| Multi-Chain | Testnet Deployments    | Contract and oracle operations across several EVM test networks.                       |
| UX          | Audio + Text Input     | Voice recording to trigger agent workflow via webhook.                                 |

---

## 4. Backend (NestJS)

### 4.1 Modules

- **Auth**: Issues JWT on `/auth/login` (email + wallet). Token stored client-side (sessionStorage) and used as `Authorization: Bearer <token>`.
- **Pyth Oracle**: Endpoints under `/pyth`; supports single and batch price retrieval with optional on-chain update step.
- **1inch Integration**: Endpoints under `/oneinch`; quoting, swap building, balances, health, and logs.
- **Tokens**: Symbol/network resolution & metadata.
- **Logging**: Swap quote logs persisted (TypeORM).
- **Swagger**: Live docs at `/api` ([http://146.190.119.62:3000/api](http://146.190.119.62:3000/api)). JSON at `/api-json`.

### 4.2 Pyth Oracle Endpoints

| Endpoint       | Method | Purpose                                    | Key Query Params                     |
| -------------- | ------ | ------------------------------------------ | ------------------------------------ | ---------- |
| `/pyth/price`  | GET    | Single feed price (optional update)        | `feedKey`, `network`, `mode` (update | read-only) |
| `/pyth/prices` | GET    | Batch multiple feeds (single TX on update) | `feedKeys[]`, `network`, `mode`      |

Modes:

- `update` (default): Pull VAAs → submit on-chain update → read stored price.
- `read-only`: Skip transaction; read last stored price (no gas).

### 4.3 1inch Integration Endpoints

| Endpoint                     | Method | Purpose                                              |
| ---------------------------- | ------ | ---------------------------------------------------- |
| `/oneinch/quote`             | POST   | (Address-based) Generate quote (advanced)            |
| `/oneinch/quote/simple`      | POST   | (Symbol-based) Quote with automatic token resolution |
| `/oneinch/tx`                | POST   | Build swap TX (addresses)                            |
| `/oneinch/tx/simple`         | POST   | Build swap TX (symbols) – recommended for agents     |
| `/oneinch/balances/:address` | GET    | Wallet token balances per network                    |
| `/oneinch/logs`              | GET    | Retrieve past quote logs                             |
| `/oneinch/logs/:id`          | GET    | Get a specific quote log entry                       |
| `/oneinch/health`            | GET    | Integration health & supported networks              |

### 4.4 Authentication Flow

1. Frontend submits `{ email, wallet }` to `/auth/login`.
2. Backend returns a JWT (string) – stored in `sessionStorage` as `auth_token`.
3. Chatbot & agent features verify token freshness (grace via `VITE_JWT_EXP_GRACE`).

### 4.5 Validation & Security

- Global `ValidationPipe` with whitelist & transform.
- Role-based guard (`RolesEnum.USER`) applied to protected endpoints.
- Bearer auth enforced.

### 4.6 Swap Quote Logging

Every quote request persists:

- User identifier (if provided)
- Token pair / symbols / network
- Raw amounts (wei & decimal)
- Slippage / output metadata
- Timestamp
  Useful for agent replay, analytics and auditing.

### 4.7 Health & Observability

`/oneinch/health` returns network coverage + API key status.
Root service (`/`) and potential `/health` can be extended for DB connectivity checks.

---

## 5. Smart Contracts (Hardhat – `contracts/`)

Core contract: **`PythPriceConsumer.sol`**
Features:

- Register supported Pyth feed IDs.
- Update single or multiple feeds via on-chain transaction (Hermes VAA input).
- Store latest price mantissa, exponent (`expo`), and publishTime.
- Refund excess ETH after update fee payment.

### 5.1 Deployments (Sepolia & Testnets)

See `contracts/DEPLOYMENT.md` for full report. Example:

- Sepolia deployed consumer: `0xDFB049b6E07e933887a7D0b0CCa23bE5783501F7`
  Additional test networks targeted (Base Sepolia, Polygon Amoy, Optimism Sepolia, Arbitrum Sepolia, Scroll Sepolia).

### 5.2 Update Flow

1. Fetch VAA from Hermes: `https://hermes.pyth.network/api/latest_vaas?ids[]=<feedId>`
2. Compute update fee via `IPyth.getUpdateFee`.
3. Call `updateAndGetPrice(...)` with sufficient `value`.
4. Read stored price via `getStoredPrice(feedId)`.

### 5.3 Scripts

Convenience commands (from `contracts/`):

```bash
npm run deploy:pyth:sepolia
npm run update:feed:sepolia
npm run update:all
```

### 5.4 Common Feed IDs

- ETH/USD: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- BTC/USD: `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43`
- USDC/USD: `0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a`

---

## 6. AI Agents (n8n Workflows – `ai-agents/`)

Self-hosted **n8n** instance (docker-compose) powering autonomous tool execution.

### 6.1 Workflow Versioning

`ai-agents/workflows/` contains version folders (`v1/`, `v2/`) with JSON exports.

### 6.2 Workflow Roles (Examples)

| Workflow                 | Role                                                     |
| ------------------------ | -------------------------------------------------------- |
| `AgentFi Agent.json`     | Orchestrator; routes intents to specialized tools        |
| `Information Agent.json` | Educational / explanatory responses                      |
| `Pyth Agent.json`        | Fetch/update oracle prices; explain price feed mechanics |
| `1inch Agent.json`       | Retrieve quotes; select optimal swap path                |
| `1inch Swap tool.json`   | Build and return executable swap transaction data        |

### 6.3 Webhook Integration

Frontend Chatbot posts audio/text to n8n webhook (`VITE_WEBHOOK_URL`). Response parsed for `assistantMessage` (robust extraction logic with fallbacks & regex scanning).

### 6.4 Best Practices

Documented in `ai-agents/workflows/README.md`: Export after meaningful changes, avoid credentials in JSON, maintain descriptive filenames.

---

## 7. Frontend (React + Vite)

### 7.1 Tech Stack

- React + SWC (`@vitejs/plugin-react-swc`)
- Tailwind / utility classes
- Lucide icons, animated UI components

### 7.2 Chatbot Modal (`ChatbotModal.tsx`)

Features:

- Token-gated rendering (hides if JWT expired or missing).
- Automatic JWT expiration checks with grace window.
- Text & audio input (15s max recording with live audio level visualization).
- Multi-language UI (English / Spanish auto toggling).
- Rich assistant message formatting (paragraph + line break handling).

### 7.3 Authentication

`loginWithBackend` stores `auth_token` in `sessionStorage`; global event dispatch on set; Chatbot listens for expiry and forces redirect on invalid token.

### 7.4 Environment Variables (see `src/vite-env.d.ts`)

| Variable               | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `VITE_BACKEND_API_URL` | Base URL for backend API requests           |
| `VITE_WEBHOOK_URL`     | n8n webhook endpoint for agent/chat         |
| `VITE_CDP_PROJECT_ID`  | (Reserved) External project integration id  |
| `VITE_JWT_EXP_GRACE`   | Seconds grace before JWT treated as expired |

### 7.5 Placeholder Deployment URL

Frontend (to be updated later): `https://app.agentfi.dev` (invented placeholder).

---

## 8. Authentication & Security Model

- **JWT issuance**: Minimal payload includes expiry (`exp`).
- **Client storage**: Session-based; cleared on expiry detection.
- **Guards**: Role + auth guards around Pyth & 1inch modules.
- **Input validation**: DTOs + global `ValidationPipe` eliminate extraneous fields.
- **Token grace**: Configurable via `VITE_JWT_EXP_GRACE` to allow proactive refresh.

---

## 9. Environment Configuration

### Backend (example `.env` keys – adjust as needed)

```
PORT=3000
NODE_ENV=development
ONEINCH_API_KEY=your_1inch_api_key_here
DATABASE_URL=postgres://user:pass@host:5432/db
PYTH_DEFAULT_NETWORK=sepolia
JWT_SECRET=supersecret
```

### Contracts

See `contracts/.env.example` for RPC URLs, private key, feed and contract addresses.

### AI Agents (n8n)

`.env` for webhook security, encryption key, host settings.

### Frontend

`.env` containing `VITE_*` prefixed variables for Vite exposure.

---

## 10. Local Development & Docker

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose

### Commands

```bash
# Install root dependencies (if any meta dependencies are used)


# Backend
cd backend
npm install
npm run start:dev

# Frontend
cd ../frontend
npm install
npm run dev

# Contracts
cd ../contracts
npm install
npm run compile

# n8n (AI Agents)
cd ../ai-agents
docker compose up -d
```

### Swagger Access

Visit: `http://146.190.119.62:3000/api`

---

## 11. Operational Flows

### Price Update (Pyth)

1. User/agent requests `/pyth/price?feedKey=ETH_USD&mode=update`.
2. Backend fetches VAA from Hermes & submits transaction.
3. Reads stored price; returns structured response with `txHash` + decimal price.

### Swap Build (1inch)

1. Agent calls `/oneinch/tx/simple` with `{ fromSymbol, toSymbol, amountDecimal, slippage }`.
2. Backend resolves token addresses & network, retrieves route quote.
3. Returns signed transaction data (to be broadcast by wallet/agent).

### Chatbot Interaction

1. User records audio or sends text.
2. Frontend sends FormData payload → n8n webhook.
3. Workflow processes intent (may call backend endpoints).
4. Returns `assistantMessage`; frontend renders formatted response.

---

## 12. Assets & Media

Images stored in `public/`:

- `logo.png` – Branding
- `cover.jpg` – Hero banner
- `Frontend View.png` – UI screenshot
- `API Documentation.png` – Swagger preview
- `chatbot view.png` – Chat interface

Use relative paths for portability in GitHub and deployment docs.

---

## 13. Roadmap & Future Work

- Add predictive analytics for slippage optimization.
- Integrate additional DEX aggregators (e.g., 0x, ParaSwap).
- Expand contract suite: position management, portfolio tracking.
- Add refresh token flow & silent renewal.
- Multi-network balance aggregation & historical price caching.
- Enhanced agent reasoning (tool result memory & context windows).

---

## 14. Troubleshooting & Support

| Issue                  | Cause                                 | Resolution                                  |
| ---------------------- | ------------------------------------- | ------------------------------------------- |
| JWT expires quickly    | Grace too small                       | Increase `VITE_JWT_EXP_GRACE`               |
| 1inch quote fails      | Missing API key or unsupported symbol | Verify `ONEINCH_API_KEY` & symbol mapping   |
| Pyth update gas error  | Insufficient fee / outdated VAA       | Refresh Hermes payload; recompute fee       |
| Webhook empty response | Workflow inactive or wrong URL        | Activate in n8n; confirm `VITE_WEBHOOK_URL` |
| Audio not recorded     | Browser permission denied             | Enable microphone permissions               |

---

## 15. Disclaimer

This platform operates primarily on **test networks** for educational purposes. Not audited; do **not** use with significant funds. Swap building and oracle updates are examples for learning, not financial advice. Production hardening (monitoring, rate limiting, audits) required before mainnet deployment.

---

## Placeholder Frontend URL

Will be updated later: `https://app.agentfi.dev`

---

## Contributions

Internal hackathon project. Formal contribution guidelines & licensing pending.

---

## Quick Reference

| Component | Path         | Notes                     |
| --------- | ------------ | ------------------------- |
| Backend   | `backend/`   | NestJS API + Swagger      |
| Frontend  | `frontend/`  | React/Vite UI & Chatbot   |
| Agents    | `ai-agents/` | n8n workflows (versioned) |
| Contracts | `contracts/` | Hardhat + Pyth consumer   |
| Images    | `public/`    | Documentation media       |

---

Enjoy exploring AgentFi 🚀
