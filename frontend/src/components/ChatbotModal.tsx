import { useState, useRef, useEffect } from "react";
// Minimal env typing to silence TS without relying on vite types
interface ImportMetaEnv {
  VITE_WEBHOOK_URL?: string;
}
interface ImportMeta {
  env: ImportMetaEnv;
}
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
}

export const ChatbotModal = ({
  open,
  onOpenChange,
  language,
}: ChatbotModalProps) => {
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
      const grace = Number((import.meta as any)?.env?.VITE_JWT_EXP_GRACE || 30);
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

        const assistant = await sendToWebhook("audio", audioBlob);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content:
            assistant ||
            (language === "en" ? "Processing audio..." : "Procesando audio..."),
          timestamp: new Date(),
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
  const WEBHOOK_URL = (import.meta as any)?.env?.VITE_WEBHOOK_URL || "";

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

  // Enviar datos al webhook (audio o texto) y devolver el assistantMessage
  const sendToWebhook = async (
    type: "text" | "audio",
    content: string | Blob
  ): Promise<string | null> => {
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
      return assistant;
    } catch (error) {
      console.error("Error enviando al webhook:", error);
      return null;
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

    const assistant = await sendToWebhook("text", text);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      content:
        assistant ||
        (language === "en"
          ? "I'm processing your request..."
          : "Estoy procesando tu solicitud..."),
      timestamp: new Date(),
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
                <>
                  {line}
                  {i < parts.length - 1 && <br />}
                </>
              ))}
            </p>
          );
        })}
      </>
    );
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
