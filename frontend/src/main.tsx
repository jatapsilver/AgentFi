import { createRoot } from "react-dom/client";
import { CDPReactProvider } from "@coinbase/cdp-react";
import App from "./App.tsx";
import "./index.css";

// Coinbase CDP configuration from environment variables
const CDP_PROJECT_ID = import.meta.env.VITE_CDP_PROJECT_ID as string;

if (!CDP_PROJECT_ID) {
  throw new Error(
    "VITE_CDP_PROJECT_ID is not defined in environment variables"
  );
}

// Provide a more complete CDP config so the Embedded Wallet features are
// enabled (createOnLogin ensures an EVM account is created on login) and
// analytics are turned off for local development.
const config = {
  projectId: CDP_PROJECT_ID,
  appName: "AgentFi",
  disableAnalytics: true,
  // Enable EVM account creation on login (EOA). This encourages the SDK to
  // initialize embedded wallet functionality rather than falling back to
  // injected wallets like MetaMask.
  ethereum: {
    createOnLogin: "eoa",
  },
};

createRoot(document.getElementById("root")!).render(
  <CDPReactProvider config={config}>
    <App />
  </CDPReactProvider>
);
