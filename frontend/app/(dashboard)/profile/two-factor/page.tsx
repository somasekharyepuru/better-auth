"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Shield,
  Smartphone,
  Key,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  ChevronRight,
} from "lucide-react";
import { QRCodeComponent } from "@/components/ui/qr-code";

const verifyTotpSchema = z.object({
  code: z
    .string()
    .min(6, "Code must be 6 digits")
    .max(6, "Code must be 6 digits"),
});

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type VerifyTotpFormData = z.infer<typeof verifyTotpSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface TwoFactorStatus {
  enabled: boolean;
  backupCodes?: string[];
}

export default function TwoFactorPage() {
  const [user, setUser] = useState<any>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
    enabled: false,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordAction, setPasswordAction] = useState<"enable" | "disable">("enable");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerifyTotpFormData>({
    resolver: zodResolver(verifyTotpSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const checkAuthAndTwoFactor = async () => {
      try {
        const sessionData = await authClient.getSession();

        if (!sessionData?.data) {
          router.push("/login");
          return;
        }

        const userData = sessionData.data.user;
        setUser(userData);
        setTwoFactorStatus({
          enabled: userData.twoFactorEnabled || false,
        });
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndTwoFactor();
  }, [router]);

  const handleEnableTwoFactor = () => {
    setPasswordAction("enable");
    setShowPasswordPrompt(true);
    setError("");
  };

  const handleEnableTwoFactorWithPassword = async (data: PasswordFormData) => {
    setIsEnabling(true);
    setError("");

    try {
      const result = await authClient.twoFactor.enable({
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to enable two-factor authentication");
        return;
      }

      if (result.data) {
        setQrCodeUrl(result.data.totpURI);
        const secretMatch = result.data.totpURI.match(/secret=([^&]+)/);
        setSecret(secretMatch ? secretMatch[1] : "");
        setBackupCodes(result.data.backupCodes || []);
        setShowSetup(true);
        setShowPasswordPrompt(false);
        setShowPassword(false);
        resetPassword();
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Two-factor setup error:", error);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerifyAndEnable = async (data: VerifyTotpFormData) => {
    setError("");

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: data.code,
        trustDevice: true,
      });

      if (result.error) {
        setError(result.error.message || "Invalid verification code");
        return;
      }

      setTwoFactorStatus({ enabled: true });
      setShowSetup(false);
      reset();

      addToast({
        type: "success",
        title: "Two-factor authentication enabled",
        duration: 3000,
      });
    } catch (error) {
      setError("Verification failed. Please try again.");
      console.error("Two-factor verification error:", error);
    }
  };

  const handleDisableTwoFactor = () => {
    setPasswordAction("disable");
    setShowPasswordPrompt(true);
    setError("");
  };

  const handleDisableTwoFactorWithPassword = async (data: PasswordFormData) => {
    setIsDisabling(true);
    setError("");

    try {
      const result = await authClient.twoFactor.disable({
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to disable two-factor authentication");
        return;
      }

      setTwoFactorStatus({ enabled: false });
      setBackupCodes([]);
      setShowPasswordPrompt(false);
      setShowPassword(false);
      resetPassword();

      addToast({
        type: "success",
        title: "Two-factor authentication disabled",
        duration: 3000,
      });
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Two-factor disable error:", error);
    } finally {
      setIsDisabling(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    addToast({
      type: "success",
      title: "Backup codes copied",
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-500 mt-2">
            Add an extra layer of security to your account
          </p>
        </div>

        {/* Status Section */}
        <section className="mb-8">
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {twoFactorStatus.enabled ? (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {twoFactorStatus.enabled ? "Enabled" : "Not enabled"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {twoFactorStatus.enabled
                      ? "Your account is protected"
                      : "Your account is less secure"}
                  </p>
                </div>
              </div>
              <Button
                onClick={twoFactorStatus.enabled ? handleDisableTwoFactor : handleEnableTwoFactor}
                variant={twoFactorStatus.enabled ? "outline" : "default"}
                disabled={isEnabling || isDisabling}
              >
                {isEnabling || isDisabling ? (
                  <Spinner size="sm" />
                ) : twoFactorStatus.enabled ? (
                  "Disable"
                ) : (
                  "Enable"
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Password Prompt */}
        {showPasswordPrompt && (
          <section className="mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-medium text-gray-900 mb-4">
                Confirm your password
              </h3>
              <form
                onSubmit={handleSubmitPassword(
                  passwordAction === "enable"
                    ? handleEnableTwoFactorWithPassword
                    : handleDisableTwoFactorWithPassword
                )}
                className="space-y-4"
              >
                {error && (
                  <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                    {error}
                  </div>
                )}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...registerPassword("password")}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  {passwordErrors.password && (
                    <p className="mt-2 text-sm text-red-500">
                      {passwordErrors.password.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={isEnabling || isDisabling}>
                    {isEnabling || isDisabling ? "Processing..." : "Continue"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPasswordPrompt(false);
                      setShowPassword(false);
                      setError("");
                      resetPassword();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Setup Process */}
        {showSetup && (
          <section className="mb-8 space-y-6">
            {/* QR Code */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Scan QR Code</h3>
                  <p className="text-sm text-gray-500">Use your authenticator app</p>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="flex justify-center p-6 bg-white rounded-xl mb-4">
                  <QRCodeComponent value={qrCodeUrl} size={180} className="w-44 h-44" />
                </div>
              )}

              <div className="bg-white rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">Manual entry key:</p>
                <code className="text-sm font-mono break-all text-gray-900">{secret}</code>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-medium text-gray-900 mb-4">Enter verification code</h3>
              <form onSubmit={handleSubmit(handleVerifyAndEnable)} className="space-y-4">
                {error && (
                  <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                    {error}
                  </div>
                )}
                <Input
                  {...register("code")}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code.message}</p>
                )}
                <Button type="submit" className="w-full">
                  Verify and enable
                </Button>
              </form>
            </div>
          </section>
        )}

        {/* Backup Codes */}
        {backupCodes.length > 0 && (
          <section className="mb-8">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <Key className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900">Save your backup codes</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Store these codes safely. You can use them if you lose access to your authenticator.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white/60 p-3 rounded-xl">
                    <code className="text-sm font-mono">{code}</code>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={copyBackupCodes} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy all codes
              </Button>
            </div>
          </section>
        )}

        {/* How it works */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            How it works
          </h2>
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-200">
            {[
              { step: "1", text: "Install an authenticator app like Google Authenticator or Authy" },
              { step: "2", text: "Scan the QR code or enter the setup key manually" },
              { step: "3", text: "Enter the 6-digit code when signing in" },
              { step: "4", text: "Keep your backup codes safe for emergencies" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-medium">{item.step}</span>
                </div>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
