"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toast";

const otpSchema = z.object({
  otp: z.string().length(6, "Code must be 6 digits"),
});

type OTPForm = z.infer<typeof otpSchema>;

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const onSubmit = async (data: OTPForm) => {
    if (!email) {
      setError("Email address is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp: data.otp,
      });

      if (result.error) {
        setError(result.error.message || "Invalid code");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Email verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError("Email address is required");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (result.error) {
        setError(result.error.message || "Failed to resend code");
        return;
      }

      // Toast for resend confirmation
      addToast({
        type: "success",
        title: "Code sent",
        duration: 3000,
      });
    } catch (err) {
      setError("Failed to resend code. Please try again.");
      console.error("Resend OTP error:", err);
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Email verified!">
        <div className="text-center space-y-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-500">
            Your email has been verified. Redirecting you to sign in...
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Continue to sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify your email">
      <div className="space-y-6">
        <Link
          href="/signup"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-gray-600" />
          </div>
          <div className="space-y-2">
            <p className="text-gray-500">We sent a verification code to:</p>
            <p className="font-medium text-gray-900">{email}</p>
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
              {...register("otp")}
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={isLoading}
              className="text-center text-lg tracking-widest font-mono"
            />
            {errors.otp && (
              <p className="mt-2 text-sm text-red-500">{errors.otp.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Verifying...
              </>
            ) : (
              "Verify email"
            )}
          </Button>
        </form>

        <div className="text-center">
          <span className="text-gray-500">Didn't receive the code? </span>
          <button
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-gray-900 font-medium hover:underline disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend"}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Verify your email">
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        </AuthLayout>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
