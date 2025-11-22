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
  console.log(
    "🎬 [Wallet] ==================== COMPONENTE RENDERIZANDO ===================="
  );

  const { isSignedIn } = useIsSignedIn();
  console.log(
    "🔑 [Wallet] useIsSignedIn() retornó:",
    isSignedIn,
    "(tipo:",
    typeof isSignedIn,
    ")"
  );

  const evmAddressResult = useEvmAddress();
  console.log(
    "💼 [Wallet] useEvmAddress() resultado completo:",
    evmAddressResult
  );
  const { evmAddress } = evmAddressResult;
  console.log("💼 [Wallet] evmAddress extraído:", evmAddress);

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
  useEffect(() => {
    console.log("👀 [useEffect] evmAddress cambió a:", evmAddress);
    console.log("👀 [useEffect] isSignedIn actual:", isSignedIn);
  }, [evmAddress, isSignedIn]);

  // Logs de estado
  console.log("📊 [Wallet] ========== ESTADO ACTUAL ==========");
  console.log("📊 [Wallet] isSignedIn:", isSignedIn);
  console.log("📊 [Wallet] evmAddress:", evmAddress);
  console.log("📊 [Wallet] =====================================");

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
    console.log("📧 [Email] Iniciando envío de código");
    console.log("📧 [Email] Email ingresado:", email);

    if (!email || !email.includes("@")) {
      console.log("❌ [Email] Email inválido");
      setError(t.errorInvalidEmail);
      return;
    }

    setIsLoading(true);
    setError("");
    console.log("⏳ [Email] setIsLoading(true)");

    try {
      console.log("📤 [Email] Llamando signInWithEmail...");
      const result = await signInWithEmail({ email });
      console.log("✅ [Email] Respuesta de signInWithEmail:", result);
      console.log("🔑 [Email] flowId recibido:", result?.flowId);

      if (result?.flowId) {
        setFlowId(result.flowId);
        setStep("otp");
        setError(t.codeSent);
        console.log("✅ [Email] Cambiando a paso OTP");
      } else {
        console.log("⚠️ [Email] No se recibió flowId en la respuesta");
      }
    } catch (err) {
      console.error("❌ [Email] Error sending code:", err);
      setError(t.errorSendingCode);
    } finally {
      setIsLoading(false);
      console.log("⏹️ [Email] setIsLoading(false)");
    }
  };

  const handleVerifyOTP = async () => {
    console.log("🔐 [OTP] Iniciando verificación de OTP");
    console.log("🔐 [OTP] OTP ingresado:", otp);
    console.log("🔐 [OTP] flowId actual:", flowId);
    console.log("🔐 [OTP] Longitud OTP:", otp.length);

    if (!otp || otp.length !== 6) {
      console.log("❌ [OTP] OTP inválido (debe ser 6 dígitos)");
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");
    console.log("⏳ [OTP] setIsLoading(true)");

    try {
      console.log("📤 [OTP] Llamando verifyEmailOTP con:", { otp, flowId });
      const result = await verifyEmailOTP({ otp, flowId });
      console.log("✅ [OTP] Respuesta de verifyEmailOTP:", result);
      console.log("✅ [OTP] Verificación exitosa!");

      console.log("🚪 [OTP] Cerrando dialog...");
      setIsDialogOpen(false);

      console.log("🧹 [OTP] Reseteando formulario...");
      resetForm();

      console.log(
        "✅ [OTP] Proceso completado - esperando actualización de isSignedIn"
      );
    } catch (err) {
      console.error("❌ [OTP] Error verifying OTP:", err);
      console.error("❌ [OTP] Error completo:", JSON.stringify(err, null, 2));
      setError(t.errorVerifying);
    } finally {
      setIsLoading(false);
      console.log("⏹️ [OTP] setIsLoading(false)");
    }
  };

  const resetForm = () => {
    console.log("🧹 [Reset] Reseteando formulario");
    setEmail("");
    setOtp("");
    setFlowId("");
    setStep("email");
    setError("");
    console.log("🧹 [Reset] Formulario reseteado");
  };

  const handleDialogClose = () => {
    console.log("🚪 [Dialog] Cerrando dialog");
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
      console.error("Error signing out:", error);
    }
  };
  const handleCopyAddress = () => {
    if (evmAddress) {
      navigator.clipboard.writeText(evmAddress);
    }
  };

  // Evaluar condición de conexión
  console.log("🧪 [Wallet] Evaluando condición: !isSignedIn =", !isSignedIn);
  console.log(
    "🧪 [Wallet] Valores: isSignedIn=",
    isSignedIn,
    "| !isSignedIn=",
    !isSignedIn
  );

  useEffect(() => {
    if (isSignedIn && evmAddress === null) {
      console.log("🆕 [Wallet] Creando wallet EOA para usuario...");
      createEvmEoaAccount();
    }
  }, [isSignedIn, evmAddress, createEvmEoaAccount]);

  if (!isSignedIn) {
    console.log("🔓 [Wallet] ✅ ENTRANDO al bloque de botón CONNECT WALLET");
    console.log("🔓 [Wallet] Retornando JSX del botón de conectar");
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
                        placeholder={t.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-sm text-destructive">{error}</p>
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

  console.log("✅ [Wallet] ✅ Usuario CONECTADO - Mostrando wallet address");
  console.log(
    "✅ [Wallet] Retornando JSX de wallet conectada con dirección:",
    evmAddress
  );
  console.log("✅ [Wallet] evmAddress es null?:", evmAddress === null);
  console.log(
    "✅ [Wallet] evmAddress es undefined?:",
    evmAddress === undefined
  );

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
