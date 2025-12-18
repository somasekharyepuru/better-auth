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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const callbackURL = searchParams.get("callbackURL") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<Verify2FAFormData>({
    resolver: zodResolver(verify2FASchema),
  });

  const onSubmit = async (data: Verify2FAFormData) => {
    setIsVerifying(true);
    try {
      let result;

      if (useBackupCode) {
        // Verify backup code
        result = await authClient.twoFactor.verifyBackupCode({
          code: data.code,
          trustDevice: true,
        });
      } else {
        // Verify TOTP code
        result = await authClient.twoFactor.verifyTotp({
          code: data.code,
          trustDevice: true,
        });
      }

      if (result.error) {
        setError("code", {
          type: "manual",
          message: useBackupCode
            ? "Invalid backup code. Please try again."
            : "Invalid verification code. Please try again.",
        });
        addToast({
          type: "error",
          title: "Verification Failed",
          description:
            result.error.message || "Invalid code. Please try again.",
        });
        return;
      }

      // Successful verification
      addToast({
        type: "success",
        title: "Verification Successful",
        description: "You have been successfully signed in.",
      });

      router.push(callbackURL);
    } catch (error) {
      console.error("2FA verification error:", error);
      setError("code", {
        type: "manual",
        message: "Verification failed. Please try again.",
      });
      addToast({
        type: "error",
        title: "Verification Failed",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AuthLayout
      title="Two-Factor Authentication"
      subtitle="Enter the verification code from your authenticator app"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {useBackupCode ? "Backup Code" : "Verification Code"}
            </label>
            <Input
              id="code"
              {...register("code")}
              placeholder={useBackupCode ? "Enter backup code" : "000000"}
              maxLength={useBackupCode ? 10 : 6}
              className={`text-center text-lg tracking-widest ${
                errors.code ? "border-red-500" : ""
              }`}
              autoComplete="off"
              autoFocus
            />
            {errors.code && (
              <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-12" disabled={isVerifying}>
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

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setUseBackupCode(!useBackupCode)}
            className="w-full text-sm text-blue-600 hover:text-blue-700"
          >
            {useBackupCode
              ? "Use authenticator app code"
              : "Use backup code instead"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-gray-600 hover:text-gray-700 inline-flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to sign in</span>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                Security Tip
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {useBackupCode
                  ? "Each backup code can only be used once. Make sure to keep your remaining codes safe."
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
        <AuthLayout title="Two-Factor Authentication" subtitle="Loading...">
          <div className="flex justify-center">
            <Spinner size="lg" />
          </div>
        </AuthLayout>
      }
    >
      <Verify2FAContent />
    </Suspense>
  );
}
