import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, StopCircle, Image as ImageIcon, X } from "lucide-react";
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
  image?: string;
  timestamp: Date;
}

export const ChatbotModal = ({
  open,
  onOpenChange,
  language,
}: ChatbotModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const content = {
    en: {
      title: "AgentFi Assistant",
      placeholder: "Type your message...",
      send: "Send",
      recording: "Recording",
      selectImage: "Select image",
      maxTime: "Max 15s",
    },
    es: {
      title: "Asistente AgentFi",
      placeholder: "Escribe tu mensaje...",
      send: "Enviar",
      recording: "Grabando",
      selectImage: "Seleccionar imagen",
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

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        // Here you would process the audio
        sendMessage(
          "🎤 " + (language === "en" ? "Audio message" : "Mensaje de audio")
        );
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
  const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL as string;

  // Enviar datos al webhook
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendToWebhook = async (payload: any) => {
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Error enviando al webhook:", error);
    }
  };

  const sendMessage = async (text: string, image?: string) => {
    if (!text.trim() && !image) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      image,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setSelectedImage(null);

    // Enviar al webhook
    await sendToWebhook({
      text,
      image,
      timestamp: newMessage.timestamp,
    });

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          language === "en"
            ? "I'm processing your request..."
            : "Estoy procesando tu solicitud...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue, selectedImage || undefined);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 rounded-3xl bg-background border border-border/60 shadow-2xl">
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
                  "max-w-[80%] rounded-2xl px-4 py-3 space-y-2",
                  message.type === "user"
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md"
                    : "bg-muted text-foreground border border-border/60 shadow-sm"
                )}
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Uploaded image for the assistant"
                    className="rounded-lg max-w-full h-auto"
                  />
                )}
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-border/60 bg-background/95 space-y-3">
          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="relative inline-block">
              <img
                src={selectedImage}
                alt="Selected"
                className="h-20 w-20 object-cover rounded-lg border-2 border-primary"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-muted hover:text-primary"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "hover:bg-muted",
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
              size="icon"
              disabled={!inputValue.trim() && !selectedImage}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
