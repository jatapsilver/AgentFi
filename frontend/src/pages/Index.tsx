import { useState, useEffect } from "react";
import { Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic } from "lucide-react";
import { MessageCircle } from "lucide-react";
import { ReactMic } from "react-mic";
import AgentFiWalletConnector from "@/components/AgentFiWalletConnector";
import React, { useRef } from "react";
import { AgentFiWalletConnectorHandle } from "@/components/AgentFiWalletConnector";

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const examplePrompts = React.useMemo(
    () =>
      language === "es"
        ? [
            "Compra 10 USDC",
            "¿Cuál es mi balance?",
            "¿Qué puedo hacer?",
            "Envía 5 USDT a 0x...",
            "Muéstrame mi historial de transacciones",
          ]
        : [
            "Buy 10 USDC",
            "What is my balance?",
            "What can I do?",
            "Send 5 USDT to 0x...",
            "Show me my transaction history",
          ],
    [language]
  );
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    const currentPrompt = examplePrompts[promptIndex];
    if (!isDeleting && displayedText.length < currentPrompt.length) {
      typingTimeout = setTimeout(() => {
        setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
      }, 60);
    } else if (!isDeleting && displayedText.length === currentPrompt.length) {
      typingTimeout = setTimeout(() => setIsDeleting(true), 1200);
    } else if (isDeleting && displayedText.length > 0) {
      typingTimeout = setTimeout(() => {
        setDisplayedText(currentPrompt.slice(0, displayedText.length - 1));
      }, 40);
    } else if (isDeleting && displayedText.length === 0) {
      typingTimeout = setTimeout(() => {
        setIsDeleting(false);
        setPromptIndex((prev) => (prev + 1) % examplePrompts.length);
      }, 400);
    }
    return () => clearTimeout(typingTimeout);
  }, [displayedText, isDeleting, promptIndex, examplePrompts]);
  const walletConnectorRef = useRef<AgentFiWalletConnectorHandle>(null);
  const [isDark, setIsDark] = useState(true);

  // Initialize theme on mount
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Toggle theme
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  // Content in both languages
  const content = {
    en: {
      title: "Welcome to AgentFi",
      subtitle: "Your AI-Powered DeFi Agent",
      description:
        "Learn DeFi, chat with an intelligent agent, and execute on-chain actions — all in one place.",
      cta: "Get Started",
      features: ["Learn", "Simulate", "Execute"],
    },
    es: {
      title: "Bienvenido a AgentFi",
      subtitle: "Tu agente DeFi impulsado por IA",
      description:
        "Aprende DeFi, chatea con un agente inteligente y ejecuta acciones on-chain, todo en un solo lugar.",
      cta: "Comenzar",
      features: ["Aprender", "Simular", "Ejecutar"],
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Controls in top-right */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        {/* Wallet Connector, con ref */}
        <AgentFiWalletConnector ref={walletConnectorRef} language={language} />

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="glass-intense px-4 py-2 rounded-full flex items-center gap-2 hover:bg-card/60 transition-all duration-300 group"
          aria-label="Toggle language"
        >
          <Globe className="w-4 h-4 text-primary transition-transform group-hover:rotate-12" />
          <span className="text-sm font-medium text-foreground">
            {language === "en" ? "EN" : "ES"}
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="glass-intense p-3 rounded-full hover:bg-card/60 transition-all duration-300 group"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-primary transition-transform group-hover:rotate-12" />
          ) : (
            <Moon className="w-5 h-5 text-primary transition-transform group-hover:-rotate-12" />
          )}
        </button>
      </div>

      {/* Main content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Glass card container */}
          <div className="glass-intense rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            {/* Decorative gradient border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 pointer-events-none" />

            <div className="relative z-10 text-center space-y-6 sm:space-y-8">
              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gradient animate-fade-in">{t.title}</span>
              </h1>

              {/* Subtitle */}
              <p
                className="text-xl sm:text-2xl font-medium text-foreground/90 animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                {t.subtitle}
              </p>

              {/* Description */}
              <p
                className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                {t.description}
              </p>

              {/* Feature badges */}
              <div
                className="flex flex-wrap justify-center gap-3 pt-4 animate-fade-in"
                style={{ animationDelay: "0.3s" }}
              >
                {t.features.map((feature, index) => (
                  <span
                    key={feature}
                    className="glass px-4 py-2 rounded-full text-sm font-medium text-foreground border border-primary/30"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* CTA Button */}
              <div
                className="pt-6 animate-fade-in"
                style={{ animationDelay: "0.5s" }}
              >
                <Button
                  size="lg"
                  onClick={() => walletConnectorRef.current?.startSession()}
                  className="w-full sm:w-auto px-12 py-6 text-lg font-semibold rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105 border-0"
                >
                  {t.cta}
                </Button>
              </div>

              {/* Subtle glow effect at bottom */}
              <div className="mt-8 text-center">
                {/* Botón flotante para abrir el chat modal en la esquina inferior derecha */}
                <div className="fixed bottom-8 right-8 z-50">
                  <Button
                    size="icon"
                    className="rounded-full bg-primary text-white shadow-lg w-14 h-14 flex items-center justify-center hover:bg-primary/80"
                    onClick={() => setIsChatOpen(true)}
                    aria-label={language === "en" ? "Open Chat" : "Abrir Chat"}
                  >
                    <MessageCircle className="w-7 h-7" />
                  </Button>
                </div>

                {/* Modal de chat */}
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                  <DialogContent className="max-w-lg">
                    <div className="flex flex-col gap-4">
                      <div className="bg-muted rounded-lg p-4 min-h-[120px] text-muted-foreground">
                        {/* Mensajes del chat aparecerán aquí */}
                        <span className="italic opacity-60">
                          {language === "en"
                            ? "Chat history will appear here."
                            : "El historial del chat aparecerá aquí."}
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={examplePrompts[promptIndex]}
                          className="flex-1 px-4 py-2 rounded-lg border border-muted focus:outline-none text-black"
                        />

                        <Button
                          size="sm"
                          className="rounded-full px-4"
                          onClick={() => {
                            /* Aquí se enviaría el mensaje al agente */ setChatInput(
                              ""
                            );
                          }}
                        >
                          {language === "en" ? "Send" : "Enviar"}
                        </Button>
                        <Button
                          size="sm"
                          variant={isRecording ? "default" : "outline"}
                          className={`rounded-full px-2 ${isRecording ? "bg-red-500 text-white" : ""}`}
                          onClick={() => setIsRecording((rec) => !rec)}
                        >
                          <Mic className="w-5 h-5" />
                        </Button>
                        <ReactMic
                          record={isRecording}
                          className="hidden"
                          onStop={(recordedData) => {
                            setAudioBlob(recordedData.blob);
                            setIsRecording(false);
                            // Aquí podrías enviar el audioBlob al agente
                          }}
                          mimeType="audio/webm"
                          strokeColor="#000000"
                          backgroundColor="#fff"
                        />
                      </div>
                      {/* Aquí se mostrarían los mensajes del chat */}
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="inline-block glass px-6 py-3 rounded-full min-h-[2rem]">
                  <span className="text-sm text-muted-foreground font-mono">
                    {displayedText}
                    <span className="animate-pulse">|</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
