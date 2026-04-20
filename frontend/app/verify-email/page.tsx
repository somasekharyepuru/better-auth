"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle, CheckCircle, Mail } from "lucide-react"
import { toast } from "sonner"

import { AuthLayout } from "@/components/auth-layout"
import { LoadingButton } from "@/components/ui/loading-button"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { OtpInput } from "@/components/ui/otp-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

const otpSchema = z.object({
  otp: z.string().length(8, "Code must be 8 digits").regex(/^\d+$/, "Code must contain only digits"),
})

type OTPForm = z.infer<typeof otpSchema>

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")

  const form = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
    mode: "onChange",
  })

  const hasAutoSent = useRef(false)

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam && !hasAutoSent.current) {
      setEmail(emailParam)
      const sendOTP = async () => {
        try {
          await authClient.emailOtp.sendVerificationOtp({
            email: emailParam,
            type: "email-verification",
          })
          hasAutoSent.current = true
        } catch (error) {
          console.error("Failed to auto-send verification OTP:", error)
        }
      }
      sendOTP()
    }
  }, [searchParams])

  const onSubmit = async (data: OTPForm) => {
    if (!email) {
      setError("Email address is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await authClient.emailOtp.verifyEmail({
        email,
        otp: data.otp,
      })

      if (result.error) {
        setError(result.error.message || "Invalid code")
        return
      }

      setSuccess(true)
      const loginUrl = redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"
      setTimeout(() => {
        router.push(loginUrl)
      }, 2000)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Email verification error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) {
      setError("Email address is required")
      return
    }

    setIsResending(true)
    setError("")

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      })

      if (result.error) {
        setError(result.error.message || "Failed to resend code")
        return
      }

      toast.success("Code sent", { duration: 3000 })
    } catch (err) {
      setError("Failed to resend code. Please try again.")
      console.error("Resend OTP error:", err)
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Email verified!">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <p className="text-muted-foreground">
            Your email has been verified. Redirecting you to sign in...
          </p>
          <Button onClick={() => router.push(redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login")} className="w-full" size="lg">
            Continue to sign in
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Verify your email" backLink={{ href: "/signup", label: "Back" }}>
      <div className="space-y-6">

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">We sent a verification code to:</p>
            <p className="font-medium text-foreground">{email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Verification code</FormLabel>
                  <FormControl>
                    <div className="flex justify-center">
                      <OtpInput
                        length={8}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        autoFocus
                        ariaLabel="8-digit email verification code"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              loadingText="Verifying..."
              disabled={!form.formState.isValid || isLoading}
            >
              Verify email
            </LoadingButton>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Didn't receive the code? </span>
          <button
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-foreground font-medium hover:underline disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend"}
          </button>
        </div>
      </div>
    </AuthLayout>
  )
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
  )
}
