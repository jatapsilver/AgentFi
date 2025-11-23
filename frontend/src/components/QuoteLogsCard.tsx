import React, { useEffect, useState } from "react";
import { fetchQuoteLogs } from "@/serve/quoteLogs";

const LANG = {
  en: {
    connect: "Connect your wallet",
    title: "Latest Quote Logs",
    loading: "Loading logs...",
    empty: "No logs found.",
  },
  es: {
    connect: "Conecta tu wallet",
    title: "Últimos logs de cotización",
    loading: "Cargando logs...",
    empty: "No se encontraron logs.",
  },
};

export const QuoteLogsCard: React.FC<{ lang?: "en" | "es" }> = ({
  lang = "en",
}) => {
  const [logs, setLogs] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLogs() {
      const token = sessionStorage.getItem("auth_token");
      console.log("QuoteLogsCard: token", token);
      if (!token) {
        setError(LANG[lang].connect);
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await fetchQuoteLogs();
      console.log("QuoteLogsCard: logs result", result);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setLogs(result);
      setLoading(false);
    }
    loadLogs();
    function handleStorageChange(e: StorageEvent) {
      if (e.key === "auth_token") {
        console.log("QuoteLogsCard: storage event", e);
        loadLogs();
      }
    }
    function handleTokenSet() {
      console.log("QuoteLogsCard: custom event auth_token_set");
      loadLogs();
    }
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth_token_set", handleTokenSet);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth_token_set", handleTokenSet);
    };
  }, [lang]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 mt-4">
      <h2 className="text-lg font-bold mb-2">{LANG[lang].title}</h2>
      {loading ? (
        <p>{LANG[lang].loading}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : logs.length === 0 ? (
        <p>{LANG[lang].empty}</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log, idx) => (
            <li key={idx} className="border-b pb-2">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(log, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
