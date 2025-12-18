"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toast";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type OTPForm = z.infer<typeof otpSchema>;

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
        const errorMessage = result.error.message || "Invalid OTP";
        setError(errorMessage);
        addToast({
          type: "error",
          title: "Verification Failed",
          description: errorMessage,
        });
        return;
      }

      setSuccess("Email verified successfully!");
      addToast({
        type: "success",
        title: "Email Verified!",
        description:
          "Your email has been successfully verified. You can now sign in.",
      });
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Verification Failed",
        description: errorMessage,
      });
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
        const errorMessage = result.error.message || "Failed to resend OTP";
        setError(errorMessage);
        addToast({
          type: "error",
          title: "Resend Failed",
          description: errorMessage,
        });
        return;
      }

      setSuccess("OTP sent successfully!");
      addToast({
        type: "success",
        title: "Code Sent",
        description: "A new verification code has been sent to your email.",
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage = "Failed to resend OTP. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Resend Failed",
        description: errorMessage,
      });
      console.error("Resend OTP error:", err);
    } finally {
      setIsResending(false);
    }
  };

  if (success && success.includes("verified")) {
    return (
      <AuthLayout title="Your email was confirmed!">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-gray-600">Return to the app to continue.</p>
          <Button onClick={() => router.push("/login")} className="w-full h-12">
            Or, continue here instead
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="We sent you an email">
      <div className="space-y-6">
        <Link
          href="/signup"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          back
        </Link>

        <div className="text-center space-y-2">
          <p className="text-gray-600">A confirmation link has been sent to:</p>
          <p className="font-medium text-gray-900">{email}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {success && !success.includes("verified") && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
              {success}
            </div>
          )}

          <div>
            <Input
              {...register("otp")}
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={isLoading}
              className="text-center text-lg tracking-widest"
            />
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
        </form>

        <div className="text-center">
          <span className="text-gray-600">Didn't receive it? </span>
          <button
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend link"}
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
        <AuthLayout title="Confirming your email address">
          <div className="flex justify-center">
            <Spinner size="lg" />
          </div>
        </AuthLayout>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
