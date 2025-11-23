import { useState, useRef, useEffect } from "react";
import { useIsSignedIn, useEvmAddress, useSendEvmTransaction, useIsInitialized } from "@coinbase/cdp-hooks";
import { SendEvmTransactionButton } from "@coinbase/cdp-react";
import { parseEther } from "viem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: "en" | "es";
}

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  meta?: {
    action?: string;
    tx?: {
      to: string;
      data: string;
      value?: string;
      chainId?: number;
    };
  };
}

export const ChatbotModal = ({
  open,
  onOpenChange,
  language,
}: ChatbotModalProps) => {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { sendEvmTransaction } = useSendEvmTransaction();
  const { isInitialized } = useIsInitialized();
  const [lastSendMethod, setLastSendMethod] = useState<string | null>(null);
  const [lastProviderUsed, setLastProviderUsed] = useState<string | null>(null);
  // Note: do not import useCDP here — some builds of @coinbase/cdp-react
  // may not export that hook. Provider detection falls back to window checks.
  // Token gating: do not render chatbot if user lacks auth token
  const authToken =
    typeof window !== "undefined" ? sessionStorage.getItem("auth_token") : null;
  // Helper para validar expiración del JWT y cerrar modal si expiró
  const isJwtExpired = (token: string | null) => {
    if (!token) return true;
    try {
      const [_, payload] = token.split(".");
      const data = JSON.parse(atob(payload));
      const exp = data.exp; // segundos
      if (!exp) return true;
      const now = Math.floor(Date.now() / 1000);
      const grace = Number(import.meta.env.VITE_JWT_EXP_GRACE || 30);
      return exp - grace <= now;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const check = () => {
      const token = sessionStorage.getItem("auth_token");
      if (isJwtExpired(token)) {
        sessionStorage.removeItem("auth_token");
        if (open) onOpenChange(false);
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    };
    const id = setInterval(check, 15000);
    check();
    return () => clearInterval(id);
  }, [open, onOpenChange]);
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  useEffect(() => {
    setIsTokenChecked(true);
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [signingTxId, setSigningTxId] = useState<string | null>(null);
  const signingTimeoutRef = useRef<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const content = {
    en: {
      title: "AgentFi Assistant",
      placeholder: "Type your message...",
      send: "Send",
      recording: "Recording",
      maxTime: "Max 15s",
    },
    es: {
      title: "Asistente AgentFi",
      placeholder: "Escribe tu mensaje...",
      send: "Enviar",
      recording: "Grabando",
      maxTime: "Máx 15s",
    },
  };

  const t = content[language];

  // Map common chainIds to CDP network identifiers used by SendEvmTransactionButton
  const CHAIN_ID_TO_NETWORK: Record<number, string> = {
    84532: "base-sepolia",
    8453: "base",
    1: "ethereum",
    11155111: "ethereum-sepolia",
    43114: "avalanche",
    137: "polygon",
    10: "optimism",
    42161: "arbitrum",
    7777777: "zora",
    56: "bnb",
  };

  const getNetworkName = (chainId?: number | null) => {
    if (!chainId) return undefined;
    return CHAIN_ID_TO_NETWORK[Number(chainId)] || undefined;
  };

  // Wallet detection summary for quick debugging in UI (copyable)
  const win = typeof window !== "undefined" ? (window as any) : null;
  const hasCdp = !!win?.cdp;
  const hasEmbeddedWallet = !!win?.cdp?.embeddedWallet;
  const embeddedWalletHasProvider = !!win?.cdp?.embeddedWallet?.provider;
  const embeddedWalletHasRequest = typeof win?.cdp?.embeddedWallet?.request === "function";
  const coinbaseWalletProvider = !!win?.coinbaseWallet?.provider;
  const hasWindowEthereum = !!win?.ethereum;
  const exposedEmbeddedWallet = !!win?.__AGENTFI_EMBEDDED_WALLET;
  const detectedProviderName = (() => {
    try {
      if (win?.__AGENTFI_EMBEDDED_WALLET) {
        if (win.__AGENTFI_EMBEDDED_WALLET === win.ethereum) return "MetaMask (exposed)";
        return "Exposed Embedded Wallet";
      }
      if (win?.cdp?.embeddedWallet) return "CDP Embedded Wallet";
      if (win?.coinbaseWallet?.provider) return "coinbaseWallet.provider";
      if (win?.ethereum) return "MetaMask / window.ethereum";
    } catch (_) {
      return "unknown";
    }
    return "none";
  })();
  const hasSendButton = typeof SendEvmTransactionButton !== "undefined";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Start visualization
      visualizeAudio();

      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        const userAudioMessage: Message = {
          id: Date.now().toString(),
          type: "user",
          content:
            "🎤 " + (language === "en" ? "Audio message" : "Mensaje de audio"),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userAudioMessage]);

        const { assistant, meta } = await sendToWebhook("audio", audioBlob);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content:
            assistant ||
            (language === "en" ? "Processing audio..." : "Procesando audio..."),
          timestamp: new Date(),
          meta,
        };
        setMessages((prev) => [...prev, botMessage]);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 15) {
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setAudioLevel(0);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  // URL de tu webhook de n8n
  const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || "";

  // Extraer assistantMessage del response
  const extractAssistantMessage = (data: any): string | null => {
    try {
      // Caso 1: Array directo (ejemplo proporcionado)
      if (Array.isArray(data) && data.length > 0) {
        // Variaciones posibles dentro del array: item.output.assistantMessage, item.json.output.assistantMessage
        for (const item of data) {
          const direct = item?.output?.assistantMessage;
          if (typeof direct === "string" && direct.trim()) return direct;
          const nested = item?.json?.output?.assistantMessage;
          if (typeof nested === "string" && nested.trim()) return nested;
        }
      }
      // Caso 2: Objeto con output directo
      if (data?.output?.assistantMessage) {
        const msg = data.output.assistantMessage;
        if (typeof msg === "string" && msg.trim()) return msg;
      }
      // Caso 3: Objeto con json.output
      if (data?.json?.output?.assistantMessage) {
        const msg2 = data.json.output.assistantMessage;
        if (typeof msg2 === "string" && msg2.trim()) return msg2;
      }
    } catch (_) {
      return null;
    }
    return null;
  };

  // Extraer meta (incluye action/tx) del response
  const extractMeta = (data: any): any | null => {
    try {
      if (Array.isArray(data) && data.length > 0) {
        for (const item of data) {
          const directMeta = item?.output?.meta;
          if (directMeta) return directMeta;
          const nestedMeta = item?.json?.output?.meta;
          if (nestedMeta) return nestedMeta;
        }
      }

      if (data?.output?.meta) return data.output.meta;
      if (data?.json?.output?.meta) return data.json.output.meta;
    } catch (_) {
      return null;
    }
    return null;
  };

  // Enviar datos al webhook (audio o texto) y devolver assistantMessage + meta
  const sendToWebhook = async (
    type: "text" | "audio",
    content: string | Blob
  ): Promise<{ assistant: string | null; meta: any | null }> => {
    try {
      const token = sessionStorage.getItem("auth_token");
      const formData = new FormData();

      formData.append("type", type);

      if (type === "audio" && content instanceof Blob) {
        formData.append("audio", content, `audio_${Date.now()}.webm`);
      } else if (type === "text" && typeof content === "string") {
        formData.append("text", content);
      }

      if (token) {
        formData.append("token", token);
      }

      formData.append("timestamp", new Date().toISOString());

      // Debug detallado antes de enviar
      try {
        const debugEntries: Record<string, any> = {};
        formData.forEach((v, k) => {
          debugEntries[k] =
            v instanceof Blob ? `Blob(${(v as Blob).size} bytes)` : v;
        });
        console.log("[Webhook][DEBUG] URL=", WEBHOOK_URL || "<VACÍO>");
        console.log("[Webhook][DEBUG] Payload=", debugEntries);
      } catch (e) {
        console.warn("[Webhook][DEBUG] No se pudo inspeccionar FormData", e);
      }
      if (!WEBHOOK_URL) {
        console.error(
          "[Webhook][ERROR] WEBHOOK_URL está vacío. Revisa .env y prefijo VITE_"
        );
        return { assistant: null, meta: null };
      }

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
        // Accept header para solicitar JSON si el workflow lo soporta
        headers: {
          Accept: "application/json, text/plain, */*",
        },
      });

      const status = response.status;
      let rawBody: string | null = null;
      try {
        rawBody = await response.text();
      } catch {
        rawBody = null;
      }
      // Intentar parsear JSON si hay cuerpo
      let parsed: any = null;
      if (rawBody && rawBody.trim()) {
        try {
          parsed = JSON.parse(rawBody);
        } catch (e) {
          console.warn(
            "Respuesta no es JSON válido, cuerpo recibido:",
            rawBody
          );
        }
      }
      console.log("[Webhook] status=", status, "parsed=", parsed);
      let assistant = extractAssistantMessage(parsed);
      let meta = parsed ? extractMeta(parsed) : null;
      if (!assistant && rawBody) {
        // Fallback: intentar extraer con regex desde el cuerpo bruto si no se pudo parsear JSON correctamente
        const regexes = [
          /"assistantMessage"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/, // captura cadena con posibles escapes
          /assistantMessage\\":\\"([^"\\]+)\\"/, // formato doblemente escapado
        ];
        for (const r of regexes) {
          const m = rawBody.match(r);
          if (m && m[1]) {
            // Reemplazar secuencias de escape comunes (\n) por saltos reales
            assistant = m[1].replace(/\\n/g, "\n").trim();
            break;
          }
        }
      }
      if (!assistant) {
        console.log(
          "[Webhook] assistantMessage no encontrado tras parse y regex, cuerpo bruto=",
          rawBody
        );
      }
      return { assistant, meta };
    } catch (error) {
      console.error("Error enviando al webhook:", error);
      return { assistant: null, meta: null };
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    const { assistant, meta } = await sendToWebhook("text", text);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      content:
        assistant ||
        (language === "en"
          ? "I'm processing your request..."
          : "Estoy procesando tu solicitud..."),
      timestamp: new Date(),
      meta,
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Format message content: paragraphs for \n\n, line breaks for single \n
  const formatContent = (content: string) => {
    const paragraphs = content.split(/\n\n+/);
    return (
      <>
        {paragraphs.map((p, idx) => {
          const parts = p.split(/\n/);
          return (
            <p
              key={idx}
              className="text-sm leading-relaxed break-words whitespace-pre-wrap"
            >
              {parts.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < parts.length - 1 && <br />}
                </span>
              ))}
            </p>
          );
        })}
      </>
    );
  };

  // Manejar la firma del swap usando provider EIP-1193 (Coinbase Embedded Wallet / fallback a window.ethereum)
  const handleSignSwap = async (
    tx: {
      to: string;
      data: string;
      value?: string;
      chainId?: number;
    },
    messageId?: string
  ) => {
    console.log("handleSignSwap called", { tx, messageId });
    // If the CDP hook is available, use it — this uses the CDP React context
    // and will open the Coinbase Embedded Wallet UI for signing instead of
    // falling back to injected providers like MetaMask.
    if (typeof sendEvmTransaction === "function") {
      try {
        if (messageId) {
          setSigningTxId(messageId);
          if (signingTimeoutRef.current) window.clearTimeout(signingTimeoutRef.current);
          signingTimeoutRef.current = window.setTimeout(() => {
            setSigningTxId(null);
            alert(
              language === "en"
                ? "Signing appears to be stuck. You can retry the transaction."
                : "La firma parece estar bloqueada. Puedes reintentar la transacción."
            );
          }, 2 * 60 * 1000);
        }

        if (!isSignedIn || !evmAddress) {
          alert(
            language === "en"
              ? "Please connect your Coinbase Embedded Wallet first."
              : "Conecta primero la billetera embebida de Coinbase."
          );
          return;
        }

        const network = getNetworkName(tx.chainId);
        if (!network) {
          alert(
            language === "en"
              ? "Cannot sign: unknown network for this transaction."
              : "No se puede firmar: la red del transaction no está mapeada."
          );
          return;
        }

        // Prepare transaction payload according to CDP hooks API
        const transaction: any = {
          to: tx.to,
          data: tx.data,
          chainId: tx.chainId,
          type: "eip1559",
        };
        if (tx.value) {
          try {
            const v = tx.value as any;
            if (typeof v === "bigint") transaction.value = v;
            else if (typeof v === "number") transaction.value = BigInt(v);
            else if (typeof v === "string") {
              // hex string in wei
              if (/^0x[0-9a-fA-F]+$/.test(v)) transaction.value = BigInt(v);
              // integer string in wei
              else if (/^[0-9]+$/.test(v)) transaction.value = BigInt(v);
              else {
                // decimal ether string like "0.01" -> parse to wei
                try {
                  transaction.value = parseEther(v) as any;
                } catch (_) {
                  const n = Number(v);
                  if (Number.isFinite(n)) transaction.value = BigInt(Math.round(n * 1e18));
                }
              }
            }
          } catch (e) {
            console.warn("Invalid tx.value format", tx.value, e);
          }
        }

        setLastSendMethod("sendEvmTransaction");
        console.log("Invoking sendEvmTransaction with:", { transaction, evmAccount: evmAddress, network });
        const sendStart = Date.now();
        const result = await sendEvmTransaction({
          transaction,
          evmAccount: evmAddress,
          network,
        } as any);
        console.log("sendEvmTransaction result (took ms):", Date.now() - sendStart, result);

        const txHash = result?.transactionHash || (result as any)?.transaction?.transactionHash || (result as any)?.transactionHash;

        const providerSource = "CDP Hook (sendEvmTransaction)";
        const explorerBaseForChain = (chainId?: number | null) => {
          switch (chainId) {
            case 1:
              return "https://etherscan.io/tx/";
            case 11155111:
              return "https://sepolia.etherscan.io/tx/";
            case 84532:
              return "https://sepolia.basescan.org/tx/";
            case 8453:
              return "https://basescan.org/tx/";
            case 137:
              return "https://polygonscan.com/tx/";
            case 10:
              return "https://optimistic.etherscan.io/tx/";
            case 42161:
              return "https://arbiscan.io/tx/";
            case 43114:
              return "https://snowtrace.io/tx/";
            case 56:
              return "https://bscscan.com/tx/";
            default:
              return undefined;
          }
        };

        const explorerBase = explorerBaseForChain(tx.chainId);
        const explorerUrl = explorerBase && txHash ? `${explorerBase}${txHash}` : undefined;

        if (txHash) {
          if (explorerUrl) {
            alert(
              language === "en"
                ? `Transaction sent: ${txHash}\nProvider: ${providerSource}\nView: ${explorerUrl}`
                : `Transacción enviada: ${txHash}\nProveedor: ${providerSource}\nVer: ${explorerUrl}`
            );
          } else {
            alert(
              language === "en"
                ? `Transaction sent: ${txHash}\nProvider: ${providerSource}`
                : `Transacción enviada: ${txHash}\nProveedor: ${providerSource}`
            );
          }
          setLastProviderUsed(providerSource);
        }

        // If the hook didn't open a UI, record raw result for debugging
        if (!txHash) {
          console.warn("sendEvmTransaction returned without tx hash", result);
        }

        return;
      } catch (err: any) {
        console.error("Error sending transaction via CDP hook:", err);
        alert(
          language === "en"
            ? `Transaction failed: ${err?.message || err}`
            : `Transacción fallida: ${err?.message || err}`
        );
      } finally {
        if (signingTimeoutRef.current) {
          window.clearTimeout(signingTimeoutRef.current);
          signingTimeoutRef.current = null;
        }
        setSigningTxId(null);
      }
    }

    // Helper to call provider.request with a timeout to avoid hanging forever
    const callProvider = (prov: any, payload: any, timeout = 30000) => {
      return new Promise<any>((resolve, reject) => {
        let finished = false;
        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            reject(new Error("provider.request timeout"));
          }
        }, timeout);

        try {
          const res = prov.request(payload);
          // If provider.request returns a promise
          if (res && typeof res.then === "function") {
            res
              .then((r: any) => {
                if (!finished) {
                  finished = true;
                  clearTimeout(timer);
                  resolve(r);
                }
              })
              .catch((err: any) => {
                if (!finished) {
                  finished = true;
                  clearTimeout(timer);
                  reject(err);
                }
              });
          } else {
            // Synchronous result
            if (!finished) {
              finished = true;
              clearTimeout(timer);
              resolve(res);
            }
          }
        } catch (err) {
          if (!finished) {
            finished = true;
            clearTimeout(timer);
            reject(err);
          }
        }
      });
    };

    try {
      if (messageId) {
        setSigningTxId(messageId);
        // Fallback UI timeout: allow user to manually cancel after 2 minutes
        if (signingTimeoutRef.current) window.clearTimeout(signingTimeoutRef.current);
        signingTimeoutRef.current = window.setTimeout(() => {
          setSigningTxId(null);
          alert(
            language === "en"
              ? "Signing appears to be stuck. You can retry the transaction."
              : "La firma parece estar bloqueada. Puedes reintentar la transacción."
          );
        }, 2 * 60 * 1000); // 2 minutes
      }

      // Intentar detectar provider específico de Coinbase CDP, si existe
      const win = window as any;
      // Detect provider from known globals
      let provider =
        // Developer-exposed temporary hook (set by wallet connector)
        win.__AGENTFI_EMBEDDED_WALLET ||
        (win.cdp && win.cdp.embeddedWallet && win.cdp.embeddedWallet.provider) ||
        // Some integrations expose the embeddedWallet itself as provider
        (win.cdp && win.cdp.embeddedWallet && typeof win.cdp.embeddedWallet.request === "function" ? win.cdp.embeddedWallet : null) ||
        win.coinbaseWallet?.provider;

      // Some CDP SDKs expose getProvider as async factory
      try {
        const maybeGet = win.cdp?.embeddedWallet?.getProvider;
        if (!provider && typeof maybeGet === "function") {
          const p = maybeGet();
          // if returns promise, await it safely with timeout
          if (p && typeof p.then === "function") {
            provider = await Promise.race([
              p,
              new Promise((_, rej) => setTimeout(() => rej(new Error("getProvider timeout")), 5000)),
            ]);
          } else {
            provider = p;
          }
        }
      } catch (e) {
        console.warn("getProvider failed:", e);
      }

      console.log("Detected provider:", provider);
      try {
        console.dir && console.dir(provider);
      } catch (_) {}

      if (!provider) {
        // If user is signed in, wait a short period for the CDP embedded wallet to be available
        if (isSignedIn) {
          const waitForEmbedded = async (timeout = 8000) => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
              // prefer actual CDP embeddedWallet (not window.ethereum)
              if (win?.cdp?.embeddedWallet && typeof win.cdp.embeddedWallet.request === "function") return win.cdp.embeddedWallet;
              if (win?.__AGENTFI_EMBEDDED_WALLET && win.__AGENTFI_EMBEDDED_WALLET !== win.ethereum) return win.__AGENTFI_EMBEDDED_WALLET;
              await new Promise((r) => setTimeout(r, 500));
            }
            return null;
          };

          const maybe = await waitForEmbedded(8000);
          if (maybe) {
            provider = maybe;
          }
        }

        if (!provider) {
          alert(
            language === "en"
              ? "Wallet provider not found"
              : "No se encontró el proveedor de la billetera"
          );
          return;
        }
      }

      // If the detected provider is window.ethereum, inform user that Coinbase provider isn't exposed
      if (provider === win.ethereum) {
        alert(
          language === "en"
            ? "Detected provider is window.ethereum (MetaMask). If you intended to use Coinbase Embedded Wallet, open the Wallet Connector and click 'Expose Provider' or re-connect your Coinbase session."
            : "Se detectó window.ethereum (MetaMask). Si quieres usar Coinbase Embedded Wallet, abre el conector de wallet y haz click en 'Expose Provider' o reconecta tu sesión de Coinbase."
        );
        // continue — MetaMask may still sign if user accepts
      }

      // Ensure user is signed in via Coinbase CDP and has an EVM address
      if (!isSignedIn || !evmAddress) {
        alert(
          language === "en"
            ? "Please connect your Coinbase Embedded Wallet first."
            : "Conecta primero la billetera embebida de Coinbase."
        );
        return;
      }

      if (typeof provider.request !== "function") {
        console.error("Provider has no request method", provider);
        alert(
          language === "en"
            ? "Wallet provider does not support request()"
            : "El proveedor de la billetera no soporta request()"
        );
        return;
      }

      // Solicitar cuenta con timeout
      const accounts = await callProvider(provider, { method: "eth_requestAccounts" }, 20000);
      const from = Array.isArray(accounts) ? accounts[0] : accounts;

      const txRequest: any = {
        from,
        to: tx.to,
        data: tx.data,
      };

      if (tx.value) {
        try {
          txRequest.value = `0x${BigInt(tx.value).toString(16)}`;
        } catch (e) {
          console.warn("Invalid tx.value format", tx.value, e);
        }
      }
      if (tx.chainId) {
        txRequest.chainId = tx.chainId;
      }

      console.log("Sending txRequest:", txRequest);

      // Send tx with timeout
      const txHash = await callProvider(provider, { method: "eth_sendTransaction", params: [txRequest] }, 120000);

      console.log("Swap transaction sent:", txHash);
      // Record fallback send method and provider
      setLastSendMethod("provider.request");
      try {
        const win = window as any;
        if (provider === win.ethereum) setLastProviderUsed("MetaMask / window.ethereum");
        else setLastProviderUsed("External provider");
      } catch (_) {
        setLastProviderUsed("unknown");
      }
    } catch (e) {
      console.error("Error sending swap transaction:", e);
      alert(
        language === "en"
          ? `Error sending transaction: ${e?.message || e}`
          : `Error enviando la transacción: ${e?.message || e}`
      );
    } finally {
      // Always clear signing state to avoid stuck button
      if (signingTimeoutRef.current) {
        window.clearTimeout(signingTimeoutRef.current);
        signingTimeoutRef.current = null;
      }
      setSigningTxId(null);
    }
  };

  // Early return if token not present (after check)
  if (isTokenChecked && !authToken) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Increased width ~30% on sm/md breakpoints */}
      <DialogContent className="w-full sm:max-w-[884px] md:max-w-[988px] h-[80vh] flex flex-col p-0 gap-0 rounded-3xl bg-background border border-border/60 shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-background/95 backdrop-blur">
          <DialogTitle className="text-2xl font-bold text-gradient">
            {t.title}
          </DialogTitle>
          <div className="mt-2 text-xs text-muted-foreground">
            <div>
              <strong>Wallet:</strong> SignedIn: {String(isSignedIn)} · EVM: {evmAddress ?? "—"}
            </div>
            <div className="mt-1 break-words">
              <strong>Detection:</strong>
              {` hasCdp:${String(hasCdp)} embeddedWallet:${String(hasEmbeddedWallet)} embeddedWallet.request:${String(embeddedWalletHasRequest)} embeddedWallet.provider:${String(embeddedWalletHasProvider)} exposed:${String(exposedEmbeddedWallet)} coinbaseWallet.provider:${String(coinbaseWalletProvider)} window.ethereum:${String(hasWindowEthereum)} detected:${detectedProviderName} sendButton:${String(hasSendButton)}`}
            </div>
            <div className="mt-1">
              <strong>CDP Initialized:</strong> {String(isInitialized)} · <strong>Last send:</strong> {lastSendMethod ?? "-"} · <strong>Last provider:</strong> {lastProviderUsed ?? "-"}
            </div>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                {language === "en"
                  ? "Start a conversation with AgentFi"
                  : "Inicia una conversación con AgentFi"}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  // Wider bubbles (+30%) with full responsive wrapping
                  "w-full max-w-[95%] md:max-w-[90%] rounded-2xl px-5 py-4",
                  message.type === "user"
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md"
                    : "bg-muted text-foreground border border-border/60 shadow-sm"
                )}
              >
                <div className="space-y-2 overflow-hidden break-words whitespace-pre-wrap">
                  {formatContent(message.content)}

                  {message.type === "bot" &&
                    message.meta?.action === "SIGN_SWAP" &&
                    message.meta.tx && (
                      <div className="mt-3">
                        {isSignedIn && evmAddress ? (
                          (() => {
                            const network = getNetworkName(message.meta.tx.chainId);
                            if (!network) {
                              return (
                                <div className="text-sm text-destructive">
                                  {language === "en"
                                    ? "Cannot sign: unknown network for this transaction."
                                    : "No se puede firmar: la red del transaction no está mapeada."}
                                </div>
                              );
                            }
                            const toAddr = message.meta.tx.to as string | undefined;
                            const isHexAddress = (addr?: string) => {
                              if (!addr) return false;
                              return /^0x[0-9a-fA-F]{40}$/.test(addr);
                            };

                            if (!isHexAddress(toAddr)) {
                              return (
                                <div className="text-sm text-destructive">
                                  {language === "en" ? (
                                    <>
                                      <div>Cannot sign: invalid `to` address in transaction payload.</div>
                                      <div className="mt-1">Address: <code>{String(toAddr)}</code></div>
                                      <div className="mt-1">- Address must be 20 bytes (40 hex chars) prefixed with 0x.</div>
                                      <div>- Ensure the agent/backend returns a checksummed or valid hex address.</div>
                                    </>
                                  ) : (
                                    <>
                                      <div>No se puede firmar: la dirección `to` en el payload es inválida.</div>
                                      <div className="mt-1">Dirección: <code>{String(toAddr)}</code></div>
                                      <div className="mt-1">- La dirección debe ser 20 bytes (40 caracteres hex) con prefijo 0x.</div>
                                      <div>- Asegúrate de que el agente/backend devuelve una dirección hex válida con checksum.</div>
                                    </>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <SendEvmTransactionButton
                                account={evmAddress}
                                network={network as any}
                                transaction={{
                                  to: message.meta.tx.to as any,
                                  data: message.meta.tx.data as any,
                                  value: (() => {
                                    const v = (message.meta.tx as any).value;
                                    try {
                                      if (v == null) return undefined;
                                      if (typeof v === "bigint") return v as any;
                                      if (typeof v === "number") return BigInt(v) as any;
                                      if (typeof v === "string") {
                                        if (/^0x[0-9a-fA-F]+$/.test(v)) return BigInt(v) as any;
                                        if (/^[0-9]+$/.test(v)) return BigInt(v) as any;
                                        try {
                                          return parseEther(v) as any;
                                        } catch (_) {
                                          const n = Number(v);
                                          if (Number.isFinite(n)) return BigInt(Math.round(n * 1e18)) as any;
                                        }
                                      }
                                    } catch (e) {
                                      console.warn("Failed to parse tx value", v, e);
                                    }
                                    return undefined;
                                  })(),
                                  chainId: message.meta.tx.chainId,
                                  type: "eip1559",
                                } as any}
                                onSuccess={(hash: any) => {
                                  // Determine provider source at send time
                                  const win = window as any;
                                  const providerSource = (() => {
                                    try {
                                      if (win?.cdp?.embeddedWallet) return "CDP Embedded Wallet";
                                      if (win?.__AGENTFI_EMBEDDED_WALLET && win.__AGENTFI_EMBEDDED_WALLET !== win.ethereum) return "Exposed Embedded Wallet";
                                      if (win?.ethereum) return "MetaMask / window.ethereum";
                                    } catch (_) {}
                                    return "unknown";
                                  })();

                                  // Explorer mapping
                                  const explorerBaseForChain = (chainId?: number | null) => {
                                    switch (chainId) {
                                      case 1:
                                        return "https://etherscan.io/tx/";
                                      case 11155111:
                                        return "https://sepolia.etherscan.io/tx/";
                                      case 84532:
                                        return "https://sepolia.basescan.org/tx/";
                                      case 8453:
                                        return "https://basescan.org/tx/";
                                      case 137:
                                        return "https://polygonscan.com/tx/";
                                      case 10:
                                        return "https://optimistic.etherscan.io/tx/";
                                      case 42161:
                                        return "https://arbiscan.io/tx/";
                                      case 43114:
                                        return "https://snowtrace.io/tx/";
                                      case 56:
                                        return "https://bscscan.com/tx/";
                                      default:
                                        return undefined;
                                    }
                                  };

                                  const explorerBase = explorerBaseForChain(message.meta.tx.chainId);
                                  const explorerUrl = explorerBase ? `${explorerBase}${hash}` : undefined;

                                  if (explorerUrl) {
                                    alert(
                                      language === "en"
                                        ? `Transaction sent: ${hash}\nProvider: ${providerSource}\nView: ${explorerUrl}`
                                        : `Transacción enviada: ${hash}\nProveedor: ${providerSource}\nVer: ${explorerUrl}`
                                    );
                                  } else {
                                    alert(
                                      language === "en"
                                        ? `Transaction sent: ${hash}\nProvider: ${providerSource}`
                                        : `Transacción enviada: ${hash}\nProveedor: ${providerSource}`
                                    );
                                  }
                                  // record send method/provider
                                  setLastSendMethod("SendEvmTransactionButton");
                                  setLastProviderUsed(providerSource);
                                }}
                                onError={(err: any) => {
                                  alert(
                                    language === "en"
                                      ? `Transaction failed: ${err?.message || err}`
                                      : `Transacción fallida: ${err?.message || err}`
                                  );
                                }}
                              >
                                <Button size="sm" disabled={signingTxId === message.id}>
                                  {language === "en" ? "Sign swap" : "Firmar swap"}
                                </Button>
                              </SendEvmTransactionButton>
                            );
                          })()
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSignSwap(message.meta!.tx, message.id)}
                            disabled={signingTxId === message.id || !isSignedIn || !evmAddress}
                          >
                            {signingTxId === message.id
                              ? language === "en"
                                ? "Signing..."
                                : "Firmando..."
                              : language === "en"
                              ? "Sign swap"
                              : "Firmar swap"}
                          </Button>
                        )}
                        {signingTxId === message.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-2"
                            onClick={() => {
                              setSigningTxId(null);
                              if (signingTimeoutRef.current) {
                                window.clearTimeout(signingTimeoutRef.current);
                                signingTimeoutRef.current = null;
                              }
                            }}
                          >
                            {language === "en" ? "Cancel" : "Cancelar"}
                          </Button>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-border/60 bg-background/95 space-y-3">
          {/* Recording Visualization */}
          {isRecording && (
            <div className="rounded-lg p-4 space-y-2 bg-muted border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">
                  {t.recording}
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  {recordingTime}s / 15s
                </span>
              </div>
              <div className="flex items-center gap-1 h-12">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-primary to-secondary rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(20, (audioLevel / 255) * 100 * (0.5 + Math.random() * 0.5))}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "hover:bg-muted p-2 rounded-full",
                isRecording
                  ? "text-destructive hover:text-destructive"
                  : "hover:text-primary"
              )}
            >
              {isRecording ? (
                <StopCircle className="w-5 h-5 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 bg-background border-border focus-visible:ring-primary/40"
            />

            <Button
              type="submit"
              disabled={!inputValue.trim()}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md disabled:opacity-50 p-2 rounded-full"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
