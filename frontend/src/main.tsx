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

const config = {
  projectId: CDP_PROJECT_ID,
};

createRoot(document.getElementById("root")!).render(
  <CDPReactProvider config={config}>
    <App />
  </CDPReactProvider>
);
