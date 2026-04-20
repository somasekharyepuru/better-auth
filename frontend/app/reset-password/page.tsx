"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle, CheckCircle, Eye, EyeOff, Mail } from "lucide-react"

import { AuthLayout } from "@/components/auth-layout"
import { LoadingButton } from "@/components/ui/loading-button"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { OtpInput } from "@/components/ui/otp-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"

const resetPasswordSchema = z
  .object({
    otp: z.string().length(8, "Code must be 8 digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

function ResetPasswordContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: "", password: "", confirmPassword: "" },
    mode: "onChange",
  })

  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleResendCode = async () => {
    if (!email) return

    setIsResending(true)
    setError("")

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      })

      if (result.error) {
        setError(result.error.message || "Failed to resend code")
        return
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.")
      console.error("Resend code error:", err)
    } finally {
      setIsResending(false)
    }
  }

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!email) {
      setError("Email address is required. Please start over.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await authClient.emailOtp.resetPassword({
        email,
        otp: data.otp,
        password: data.password,
      })

      if (result.error) {
        setError(result.error.message || "Failed to reset password")
        return
      }

      // Password reset successful
      setSuccess(true)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Reset password error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Password updated">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <p className="text-muted-foreground">
            Your password has been reset successfully.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full" size="lg">
            Sign in with new password
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset your password" backLink={{ href: "/forgot-password", label: "Back" }}>
      <div className="space-y-6">

        {email && (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Code sent to</p>
              <p className="text-sm font-medium text-foreground truncate">{email}</p>
            </div>
          </div>
        )}

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
                        ariaLabel="8-digit password reset code"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-center" />
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending || !email}
                    className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors w-full text-center"
                  >
                    {isResending ? "Sending..." : "Didn't receive code? Resend"}
                  </button>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a new password"
                        disabled={isLoading}
                        className="pr-10"
                        autoComplete="new-password"
                        onChange={(e) => {
                          field.onChange(e)
                          setPassword(e.target.value)
                        }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <PasswordStrengthMeter password={password} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              loadingText="Resetting..."
              disabled={!form.formState.isValid || isLoading}
            >
              Reset password
            </LoadingButton>
          </form>
        </Form>
      </div>
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Reset your password">
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        </AuthLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
