import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import { Wallet, LogOut, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithBackend } from "../serve/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useIsSignedIn,
  useEvmAddress,
  useSignOut,
  useSignInWithEmail,
  useVerifyEmailOTP,
  useCreateEvmEoaAccount,
} from "@coinbase/cdp-hooks";

export interface AgentFiWalletConnectorHandle {
  startSession: () => void;
}

interface AgentFiWalletConnectorProps {
  language?: "en" | "es";
  autoOpen?: boolean;
}

const AgentFiWalletConnector = forwardRef<
  AgentFiWalletConnectorHandle,
  AgentFiWalletConnectorProps
>(({ language = "en", autoOpen = false }, ref) => {
  const { isSignedIn } = useIsSignedIn();

  const evmAddressResult = useEvmAddress();
  const { evmAddress } = evmAddressResult;

  const { signOut: performSignOut } = useSignOut();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { createEvmEoaAccount } = useCreateEvmEoaAccount();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendError, setBackendError] = useState("");

  // Monitor cambios en evmAddress
  useEffect(() => {}, [evmAddress, isSignedIn]);

  const content = {
    en: {
      connectWallet: "Connect Wallet",
      disconnect: "Disconnect",
      dialogTitle: "Connect your Wallet",
      dialogDescription: "Enter your email to receive a verification code",
      emailPlaceholder: "your@email.com",
      otpPlaceholder: "Enter 6-digit code",
      sendCode: "Send Code",
      verify: "Verify & Connect",
      resendCode: "Resend Code",
      sending: "Sending...",
      verifying: "Verifying...",
      errorInvalidEmail: "Please enter a valid email",
      errorSendingCode: "Error sending code. Please try again.",
      errorVerifying: "Invalid code. Please try again.",
      codeSent: "Code sent! Check your email.",
    },
    es: {
      connectWallet: "Conectar Wallet",
      disconnect: "Desconectar",
      dialogTitle: "Conecta tu Billetera",
      dialogDescription:
        "Ingresa tu email para recibir un código de verificación",
      emailPlaceholder: "tu@email.com",
      otpPlaceholder: "Código de 6 dígitos",
      sendCode: "Enviar Código",
      verify: "Verificar y Conectar",
      resendCode: "Reenviar Código",
      sending: "Enviando...",
      verifying: "Verificando...",
      errorInvalidEmail: "Por favor ingresa un email válido",
      errorSendingCode: "Error al enviar código. Intenta de nuevo.",
      errorVerifying: "Código inválido. Intenta de nuevo.",
      codeSent: "¡Código enviado! Revisa tu email.",
    },
  };

  const t = content[language];

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setError(t.errorInvalidEmail);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithEmail({ email });

      if (result?.flowId) {
        setFlowId(result.flowId);
        setStep("otp");
        setError(t.codeSent);
      }
    } catch (err) {
      setError(t.errorSendingCode);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await verifyEmailOTP({ otp, flowId });
      setVerifiedEmail(email); // Guardar email verificado
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(t.errorVerifying);
    } finally {
      setIsLoading(false);
      console.log("⏹️ [OTP] setIsLoading(false)");
    }
  };

  const resetForm = () => {
    setEmail("");
    setOtp("");
    setFlowId("");
    setStep("email");
    setError("");
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSignOut = async () => {
    // Solo intentar cerrar sesión si realmente está conectado
    if (!isSignedIn) return;

    // Limpiar todo el sessionStorage al desconectar la wallet
    sessionStorage.clear();

    try {
      await performSignOut();
    } catch (error) {
      // Silenciar errores de autenticación (401) que son normales
      if (
        error instanceof Error &&
        error.message?.includes("not authenticated")
      ) {
        return; // Ignorar silenciosamente
      }
    }
  };
  const handleCopyAddress = () => {
    if (evmAddress) {
      navigator.clipboard.writeText(evmAddress);
    }
  };

  // Dev helper: detect a provider-like object on window and expose it for debugging/testing
  const handleExposeProvider = () => {
    const win = window as any;
    const candidates: Array<{ key: string; obj: any }> = [];

    // Known slots to check
    if (win.cdp && win.cdp.embeddedWallet) candidates.push({ key: "cdp.embeddedWallet", obj: win.cdp.embeddedWallet });
    if (win.coinbaseWallet && win.coinbaseWallet.provider) candidates.push({ key: "coinbaseWallet.provider", obj: win.coinbaseWallet.provider });
    if (win.__AGENTFI_EMBEDDED_WALLET) candidates.push({ key: "__AGENTFI_EMBEDDED_WALLET", obj: win.__AGENTFI_EMBEDDED_WALLET });
    if (win.ethereum) candidates.push({ key: "ethereum", obj: win.ethereum });

    // Generic scan: find any window prop that looks like a provider (has request function)
    try {
      for (const k of Object.keys(win)) {
        try {
          const v = win[k];
          if (v && typeof v.request === "function") {
            // Avoid re-adding known ethereum (MetaMask) unless no other candidate
            if (k === "ethereum" && candidates.length > 0) continue;
            candidates.push({ key: k, obj: v });
          }
        } catch (_) {
          // ignore property access errors
        }
      }
    } catch (_) {
      // ignore
    }

    // Choose first candidate that is not MetaMask if possible
    let chosen = candidates.find((c) => c.key !== "ethereum") || candidates[0];
    if (chosen && chosen.obj) {
      win.__AGENTFI_EMBEDDED_WALLET = chosen.obj;
      alert(`Exposed provider from window.${chosen.key} as __AGENTFI_EMBEDDED_WALLET`);
    } else {
      alert("No provider-like object found on window to expose.");
    }
  };

  // Debug UI: show window.cdp and provider info so user can copy without console
  const [debugOpen, setDebugOpen] = useState(false);
  const buildDebugInfo = () => {
    try {
      const win = window as any;
      const summary: any = {
        hasWindowCdp: !!win.cdp,
        cdpKeys: win.cdp ? Object.keys(win.cdp) : null,
        hasEmbeddedWallet: !!(win.cdp && win.cdp.embeddedWallet),
        embeddedWalletKeys: win.cdp?.embeddedWallet ? Object.keys(win.cdp.embeddedWallet) : null,
        embeddedWalletHasRequest: typeof win.cdp?.embeddedWallet?.request === "function",
        hasExposedAgentfi: !!win.__AGENTFI_EMBEDDED_WALLET,
        exposedAgentfiKeys: win.__AGENTFI_EMBEDDED_WALLET ? Object.keys(win.__AGENTFI_EMBEDDED_WALLET) : null,
        hasWindowEthereum: !!win.ethereum,
        ethereumHasRequest: typeof win.ethereum?.request === "function",
      };
      return JSON.stringify(summary, null, 2);
    } catch (e) {
      return `ERROR: ${String(e)}`;
    }
  };

  const handleCopyDebug = async () => {
    try {
      const txt = buildDebugInfo();
      await navigator.clipboard.writeText(txt);
      alert("Debug info copied to clipboard");
    } catch (e) {
      alert("Failed to copy debug info: " + String(e));
    }
  };

  // Evaluar condición de conexión

  useEffect(() => {
    if (isSignedIn && evmAddress === null) {
      createEvmEoaAccount();
    }
  }, [isSignedIn, evmAddress, createEvmEoaAccount]);

  // Auto-expose embedded wallet provider when CDP exposes it and the user is signed in.
  useEffect(() => {
    try {
      const win = window as any;
      if (isSignedIn && win?.cdp?.embeddedWallet) {
        // Only set if not already set or if it's a different object
        if (!win.__AGENTFI_EMBEDDED_WALLET || win.__AGENTFI_EMBEDDED_WALLET !== win.cdp.embeddedWallet) {
          win.__AGENTFI_EMBEDDED_WALLET = win.cdp.embeddedWallet;
          // no alert here to avoid spamming UI; the Chatbot modal shows detection
        }
      }
    } catch (_) {
      // ignore
    }
  }, [isSignedIn, evmAddress]);

  // Login con backend cuando el usuario está autenticado y tiene email y wallet
  useEffect(() => {
    if (isSignedIn && evmAddress && verifiedEmail) {
      loginWithBackend({ email: verifiedEmail, wallet: evmAddress }).then(
        (result) => {
          if (typeof result === "string") {
            setBackendError(""); // Login exitoso
          } else {
            setBackendError(result.error || "Backend error");
          }
        }
      );
    }
  }, [isSignedIn, evmAddress, verifiedEmail]);

  // --- JWT Expiration Handling ---
  const GRACE_SECONDS = Number(import.meta.env.VITE_JWT_EXP_GRACE || 30);

  const checkTokenExpiry = () => {
    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) return;
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Invalid JWT format");
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp; // seconds
      if (!exp) return;
      const now = Math.floor(Date.now() / 1000);
      if (exp - GRACE_SECONDS <= now) {
        // Expired or about to expire: cleanup and redirect to root
        sessionStorage.removeItem("auth_token");
        performSignOut().catch(() => {});
        // Forzar retorno a página inicial para reconectar wallet
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        } else {
          // Si ya está en inicio, refrescar estado UI
          setIsDialogOpen(false);
        }
      }
    } catch (_) {
      // Si hay error de parseo, asumir inválido y limpiar
      sessionStorage.removeItem("auth_token");
      performSignOut().catch(() => {});
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
  };

  // Intervalo periódico para validar expiración
  useEffect(() => {
    const id = setInterval(checkTokenExpiry, 15000); // cada 15s
    checkTokenExpiry(); // verificación inicial
    return () => clearInterval(id);
  }, [isSignedIn]);

  useImperativeHandle(ref, () => ({
    startSession: () => {
      setIsDialogOpen(true);
    },
  }));

  if (!isSignedIn) {
    return (
      <>
        <Button
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="glass-intense px-4 py-2 rounded-full flex items-center gap-2 hover:bg-card/60 transition-all duration-300"
        >
          <Wallet className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{t.connectWallet}</span>
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.dialogTitle}</DialogTitle>
              <DialogDescription>{t.dialogDescription}</DialogDescription>
        <button
          onClick={() => setDebugOpen((v) => !v)}
          className="ml-2 text-xs px-2 py-1 bg-muted rounded-md hover:bg-muted/80"
          title="Show provider debug info"
        >
          {debugOpen ? "Hide Debug" : "Show Debug"}
        </button>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {step === "email" ? (
                <>
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                        className="pl-10"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleSendCode}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? t.sending : t.sendCode}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={t.otpPlaceholder}
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleVerifyOTP()
                        }
                        className="pl-10"
                        disabled={isLoading}
                        maxLength={6}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sent to: {email}
                    </p>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="space-y-2">
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? t.verifying : t.verify}
                    </Button>
                    <Button
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setError("");
                      }}
                      variant="ghost"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {t.resendCode}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="glass-intense px-4 py-2 rounded-full flex items-center gap-3">
      {backendError && (
        <p className="text-sm text-destructive">{backendError}</p>
      )}
      <Wallet className="w-4 h-4 text-primary" />

      <button
        onClick={handleCopyAddress}
        className="text-sm font-mono text-foreground hover:text-primary transition-colors"
        title={evmAddress || "Loading wallet..."}
      >
        {evmAddress
          ? `${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`
          : "Loading..."}
      </button>

      <button
        onClick={handleSignOut}
        className="hover:text-destructive transition-colors"
        title={t.disconnect}
      >
        <LogOut className="w-4 h-4" />
      </button>
      <button
        onClick={handleExposeProvider}
        className="ml-2 text-xs px-2 py-1 bg-muted rounded-md hover:bg-muted/80"
        title="Expose provider on window for testing"
      >
        Expose Provider
      </button>
      <button
        onClick={() => setDebugOpen((v) => !v)}
        className="ml-2 text-xs px-2 py-1 bg-muted rounded-md hover:bg-muted/80"
        title="Show provider debug info"
      >
        {debugOpen ? "Hide Debug" : "Show Debug"}
      </button>
      {debugOpen && (
        <div className="w-full mt-2 p-3 rounded-md bg-card border border-border/60 text-xs">
          <pre className="whitespace-pre-wrap break-words max-h-48 overflow-auto">{buildDebugInfo()}</pre>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={handleCopyDebug}>Copy Debug</Button>
            <Button size="sm" variant="ghost" onClick={() => {
              try { delete (window as any).__AGENTFI_EMBEDDED_WALLET; alert('Removed __AGENTFI_EMBEDDED_WALLET'); } catch(e) { alert('Failed to remove: '+String(e)); }
            }}>Remove Exposed</Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default AgentFiWalletConnector;
