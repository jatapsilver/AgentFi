import { useState, useEffect } from "react";
import { Wallet, LogOut, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface AgentFiWalletConnectorProps {
  language?: "en" | "es";
}

const AgentFiWalletConnector = ({
  language = "en",
}: AgentFiWalletConnectorProps) => {
  const { isSignedIn } = useIsSignedIn();

  const evmAddressResult = useEvmAddress();
  const { evmAddress } = evmAddressResult;

  const { signOut: performSignOut } = useSignOut();
  const { signInWithEmail } = useSignInWithEmail();
  const { verifyEmailOTP } = useVerifyEmailOTP();
  const { createEvmEoaAccount } = useCreateEvmEoaAccount();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [flowId, setFlowId] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Evaluar condición de conexión

  useEffect(() => {
    if (isSignedIn && evmAddress === null) {
      console.log("🆕 [Wallet] Creando wallet EOA para usuario...");
      createEvmEoaAccount();
    }
  }, [isSignedIn, evmAddress, createEvmEoaAccount]);

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
    </div>
  );
};

export default AgentFiWalletConnector;
