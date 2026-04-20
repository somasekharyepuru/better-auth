"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/ui/otp-input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/components/auth-layout";
import { Shield, Info } from "lucide-react";

type Verify2FAFormData = { code: string };

function Verify2FAContent() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const validateRedirectUrl = (url: string | null): string => {
    if (!url) return "/dashboard";
    if (url.startsWith('/') && !url.startsWith('//') && !url.includes(':')) {
      return url;
    }
    return "/dashboard";
  };

  const callbackURL = validateRedirectUrl(searchParams.get("callbackURL"));

  const {
    register,
    setValue,
    watch,
    reset,
  } = useForm<Verify2FAFormData>({
    mode: "onChange",
    defaultValues: { code: "" },
  });

  const codeValue = watch("code");

  // Derived validity — avoids stale zodResolver when mode switches
  const isFormValid = useBackupCode
    ? (codeValue ?? "").trim().length > 0
    : (codeValue ?? "").length === 6 && /^\d{6}$/.test(codeValue)

  const handleModeSwitch = () => {
    reset({ code: "" });
    setError("");
    setUseBackupCode((prev) => !prev);
  };

  const onSubmit = async () => {
    const code = (codeValue ?? "").trim()

    // Client-side guard (button is disabled anyway, but belt-and-suspenders)
    if (useBackupCode) {
      if (!code) return
    } else {
      if (code.length !== 6 || !/^\d{6}$/.test(code)) return
    }

    setIsVerifying(true);
    setError("");

    try {
      let result;

      if (useBackupCode) {
        result = await authClient.twoFactor.verifyBackupCode({
          code,
          trustDevice: true,
        });
      } else {
        result = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice: true,
        });
      }

      if (result.error) {
        setError(
          useBackupCode
            ? "Invalid backup code. Please try again."
            : "Invalid verification code. Please try again."
        );
        return;
      }

      toast.success("Welcome back!", { duration: 3000 });
      router.push(callbackURL);
    } catch (err) {
      setError("Verification failed. Please try again.");
      console.error("2FA verification error:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AuthLayout
      title="Two-factor authentication"
      subtitle={
        useBackupCode
          ? "Enter one of your backup codes to continue."
          : "Enter the 6-digit code from your authenticator app."
      }
      backLink={{ href: "/login", label: "Back to sign in" }}
    >
      <div className="space-y-6">

        <div className="flex justify-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="space-y-4"
        >
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="code" className="block text-center text-sm font-medium">
              {useBackupCode ? "Backup code" : "Verification code"}
            </Label>

            {useBackupCode ? (
              <Input
                {...register("code")}
                id="code"
                placeholder="Enter backup code"
                maxLength={20}
                className="text-center text-lg tracking-widest font-mono"
                autoComplete="off"
                autoFocus
              />
            ) : (
              <div className="flex justify-center">
                <OtpInput
                  key="totp"
                  length={6}
                  value={codeValue}
                  onChange={(val) => setValue("code", val, { shouldValidate: true })}
                  autoFocus
                  ariaLabel="6-digit authenticator code"
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!isFormValid || isVerifying}
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleModeSwitch}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {useBackupCode
              ? "Use authenticator app instead"
              : "Use backup code instead"}
          </button>
        </div>

        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-foreground">
                Security tip
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {useBackupCode
                  ? "Each backup code can only be used once. Keep your remaining codes safe."
                  : "Open your authenticator app and enter the 6-digit code. Codes refresh every 30 seconds."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Two-factor authentication">
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        </AuthLayout>
      }
    >
      <Verify2FAContent />
    </Suspense>
  );
}
