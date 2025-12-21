"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/auth-layout";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const verify2FASchema = z.object({
  code: z
    .string()
    .min(6, "Code must be 6 digits")
    .max(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only numbers"),
});

type Verify2FAFormData = z.infer<typeof verify2FASchema>;

function Verify2FAContent() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const callbackURL = searchParams.get("callbackURL") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Verify2FAFormData>({
    resolver: zodResolver(verify2FASchema),
  });

  const onSubmit = async (data: Verify2FAFormData) => {
    setIsVerifying(true);
    setError("");

    try {
      let result;

      if (useBackupCode) {
        result = await authClient.twoFactor.verifyBackupCode({
          code: data.code,
          trustDevice: true,
        });
      } else {
        result = await authClient.twoFactor.verifyTotp({
          code: data.code,
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

      // Success toast for navigation
      addToast({
        type: "success",
        title: "Welcome back!",
        duration: 3000,
      });

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
    >
      <div className="space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </Link>

        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <Input
              {...register("code")}
              placeholder={useBackupCode ? "Enter backup code" : "000000"}
              maxLength={useBackupCode ? 10 : 6}
              className="text-center text-lg tracking-widest font-mono"
              autoComplete="off"
              autoFocus
            />
            {errors.code && (
              <p className="mt-2 text-sm text-red-500">{errors.code.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setUseBackupCode(!useBackupCode)}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {useBackupCode
              ? "Use authenticator app instead"
              : "Use backup code instead"}
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Security tip
              </h4>
              <p className="text-sm text-gray-500 mt-1">
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
