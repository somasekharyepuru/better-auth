"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Shield,
  Smartphone,
  Key,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { QRCodeComponent } from "@/components/ui/qr-code";
import { APP_CONFIG } from "@/config/app.constants";

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
  const [passwordAction, setPasswordAction] = useState<"enable" | "disable">(
    "enable"
  );
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
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

        // Check two-factor status from user data
        setTwoFactorStatus({
          enabled: userData.twoFactorEnabled || false,
        });
      } catch (error) {
        console.error("Auth check error:", error);
        addToast({
          type: "error",
          title: "Authentication Error",
          description: "Please sign in again to continue.",
        });
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndTwoFactor();
  }, [router, addToast]);

  const handleEnableTwoFactor = () => {
    setPasswordAction("enable");
    setShowPasswordPrompt(true);
  };

  const handleEnableTwoFactorWithPassword = async (data: PasswordFormData) => {
    setIsEnabling(true);
    try {
      // Use Better Auth's built-in 2FA enable method
      const result = await authClient.twoFactor.enable({
        password: data.password,
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Failed to enable two-factor authentication"
        );
      }

      if (result.data) {
        // Better Auth returns the TOTP URI and backup codes
        setQrCodeUrl(result.data.totpURI);
        // Extract secret from TOTP URI for manual entry
        const secretMatch = result.data.totpURI.match(/secret=([^&]+)/);
        setSecret(secretMatch ? secretMatch[1] : "");
        setBackupCodes(result.data.backupCodes || []);
        setShowSetup(true);
        setShowPasswordPrompt(false);
        setShowPassword(false);
        resetPassword();

        addToast({
          type: "success",
          title: "2FA Setup Started",
          description:
            "Scan the QR code with your authenticator app and enter the verification code.",
        });
      }
    } catch (error) {
      console.error("Two-factor setup error:", error);
      addToast({
        type: "error",
        title: "Setup Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error setting up two-factor authentication. Please try again.",
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerifyAndEnable = async (data: VerifyTotpFormData) => {
    try {
      // Use Better Auth's built-in TOTP verification
      const result = await authClient.twoFactor.verifyTotp({
        code: data.code,
        trustDevice: true,
      });

      if (result.error) {
        throw new Error(result.error.message || "Invalid verification code");
      }

      setTwoFactorStatus({ enabled: true });
      setShowSetup(false);
      reset();

      addToast({
        type: "success",
        title: "Two-Factor Authentication Enabled",
        description:
          "Your account is now protected with two-factor authentication.",
      });
    } catch (error) {
      console.error("Two-factor verification error:", error);
      addToast({
        type: "error",
        title: "Verification Failed",
        description:
          error instanceof Error
            ? error.message
            : "Invalid verification code. Please try again.",
      });
    }
  };

  const handleDisableTwoFactor = () => {
    setPasswordAction("disable");
    setShowPasswordPrompt(true);
  };

  const handleDisableTwoFactorWithPassword = async (data: PasswordFormData) => {
    setIsDisabling(true);
    try {
      // Use Better Auth's built-in 2FA disable method
      const result = await authClient.twoFactor.disable({
        password: data.password,
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Failed to disable two-factor authentication"
        );
      }

      setTwoFactorStatus({ enabled: false });
      setBackupCodes([]);
      setShowPasswordPrompt(false);
      setShowPassword(false);
      resetPassword();

      addToast({
        type: "success",
        title: "Two-Factor Authentication Disabled",
        description:
          "Two-factor authentication has been disabled for your account.",
      });
    } catch (error) {
      console.error("Two-factor disable error:", error);
      addToast({
        type: "error",
        title: "Disable Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error disabling two-factor authentication. Please try again.",
      });
    } finally {
      setIsDisabling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/profile")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Profile</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {APP_CONFIG.shortName}
                </span>
              </div>
              <span className="text-xl font-semibold">{APP_CONFIG.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Two-Factor Authentication
            </h1>
            <p className="text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {twoFactorStatus.enabled ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      Two-Factor Authentication is{" "}
                      {twoFactorStatus.enabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {twoFactorStatus.enabled
                        ? "Your account is protected with two-factor authentication"
                        : "Enable two-factor authentication to secure your account"}
                    </p>
                  </div>
                </div>
                <div>
                  {twoFactorStatus.enabled ? (
                    <Button
                      variant="outline"
                      onClick={handleDisableTwoFactor}
                      disabled={isDisabling}
                    >
                      {isDisabling ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Disabling...
                        </>
                      ) : (
                        "Disable"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEnableTwoFactor}
                      disabled={isEnabling}
                    >
                      {isEnabling ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Setting up...
                        </>
                      ) : (
                        "Enable 2FA"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Prompt */}
          {showPasswordPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>
                    {passwordAction === "enable" ? "Enable" : "Disable"}{" "}
                    Two-Factor Authentication
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitPassword(
                    passwordAction === "enable"
                      ? handleEnableTwoFactorWithPassword
                      : handleDisableTwoFactorWithPassword
                  )}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Enter your password to {passwordAction} two-factor
                      authentication
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...registerPassword("password")}
                        placeholder="Enter your password"
                        className={
                          passwordErrors.password
                            ? "border-red-500 pr-12"
                            : "pr-12"
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.password && (
                      <p className="text-red-600 text-sm mt-1">
                        {passwordErrors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      disabled={isEnabling || isDisabling}
                      className="flex-1"
                    >
                      {isEnabling || isDisabling ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          {passwordAction === "enable"
                            ? "Enabling..."
                            : "Disabling..."}
                        </>
                      ) : (
                        `${
                          passwordAction === "enable" ? "Enable" : "Disable"
                        } 2FA`
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordPrompt(false);
                        setShowPassword(false);
                        resetPassword();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Setup Process */}
          {showSetup && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5" />
                  <span>Set Up Two-Factor Authentication</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* QR Code */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      1. Scan QR Code
                    </h3>
                    <p className="text-sm text-gray-600">
                      Use your authenticator app (Google Authenticator, Authy,
                      etc.) to scan this QR code:
                    </p>
                    {qrCodeUrl && (
                      <div className="flex justify-center p-4 bg-white border rounded-lg">
                        <QRCodeComponent
                          value={qrCodeUrl}
                          size={200}
                          className="w-48 h-48"
                        />
                      </div>
                    )}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">
                        Manual entry key:
                      </p>
                      <code className="text-xs font-mono break-all">
                        {secret}
                      </code>
                    </div>
                  </div>

                  {/* Verification */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      2. Enter Verification Code
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enter the 6-digit code from your authenticator app:
                    </p>
                    <form
                      onSubmit={handleSubmit(handleVerifyAndEnable)}
                      className="space-y-4"
                    >
                      <div>
                        <Input
                          {...register("code")}
                          placeholder="000000"
                          maxLength={6}
                          className={`text-center text-lg tracking-widest ${
                            errors.code ? "border-red-500" : ""
                          }`}
                        />
                        {errors.code && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.code.message}
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full">
                        Verify and Enable
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Backup Codes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-900">
                          Important: Save These Backup Codes
                        </h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Store these codes in a safe place. You can use them to
                          access your account if you lose your authenticator
                          device.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <code className="text-sm font-mono">{code}</code>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const codesText = backupCodes.join("\n");
                      navigator.clipboard.writeText(codesText);
                      addToast({
                        type: "success",
                        title: "Copied",
                        description: "Backup codes copied to clipboard",
                      });
                    }}
                  >
                    Copy All Codes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information */}
          <Card>
            <CardHeader>
              <CardTitle>How Two-Factor Authentication Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-linear-to-br from-blue-600 via-purple-600 to-blue-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white font-medium text-xs">1</span>
                  </div>
                  <p>
                    Install an authenticator app like Google Authenticator,
                    Authy, or 1Password on your phone
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-linear-to-br from-blue-600 via-purple-600 to-blue-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white font-medium text-xs">2</span>
                  </div>
                  <p>
                    Scan the QR code or manually enter the setup key into your
                    authenticator app
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-linear-to-br from-blue-600 via-purple-600 to-blue-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white font-medium text-xs">3</span>
                  </div>
                  <p>
                    When signing in, you'll be asked for both your password and
                    a 6-digit code from your authenticator app
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-linear-to-br from-blue-600 via-purple-600 to-blue-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white font-medium text-xs">4</span>
                  </div>
                  <p>
                    Keep your backup codes safe - they can be used to access
                    your account if you lose your phone
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
