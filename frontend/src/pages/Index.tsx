import { useState, useEffect } from "react";
import { Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentFiWalletConnector from "@/components/AgentFiWalletConnector";

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [language, setLanguage] = useState<"en" | "es">("en");

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
        {/* Wallet Connector */}
        <AgentFiWalletConnector language={language} />

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
                  onClick={() => console.log("Get Started clicked")}
                  className="w-full sm:w-auto px-12 py-6 text-lg font-semibold rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105 border-0"
                >
                  {t.cta}
                </Button>
              </div>
            </div>
          </div>

          {/* Subtle glow effect at bottom */}
          <div className="mt-8 text-center">
            <div className="inline-block glass px-6 py-3 rounded-full">
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "Powered by AI" : "Impulsado por IA"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
