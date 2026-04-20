"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertCircle, Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { AuthLayout } from "@/components/auth-layout"
import { LoadingButton } from "@/components/ui/loading-button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { SocialAuthButtons } from "@/components/social-auth-buttons"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import { authClient } from "@/lib/auth-client"
import { useAuthCheck } from "@/hooks/use-auth-check"
import { cn } from "@/lib/utils"

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
})

type SignUpForm = z.infer<typeof signUpSchema>

const signupAuthShellClassName = ""

function SignUpPageLoadingShell() {
  return (
    <AuthLayout
      title="Create an account"
      subtitle="Enter your details below to get started"
      className={signupAuthShellClassName}
    >
      <div
        className="flex min-h-[22rem] items-center justify-center py-2"
        aria-busy="true"
        aria-label="Checking session"
      >
        <Spinner size="lg" />
      </div>
    </AuthLayout>
  )
}

function SignUpPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")

  const { isChecking } = useAuthCheck({ redirectIfAuthenticated: true, redirectTo: redirectUrl ?? "/dashboard" })

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onChange",
  })

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      })

      if (result.error) {
        setError(result.error.message || "An error occurred during sign up")
        return
      }

      toast.success("Check your email", {
        description: "We sent you a verification code.",
        duration: 4000,
      })

      const verifyUrl = `/verify-email?email=${encodeURIComponent(data.email)}${redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ""}`
      router.push(verifyUrl)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Sign up error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <AuthLayout
        title="Create an account"
        subtitle="Enter your details below to get started"
        className={signupAuthShellClassName}
      >
        <div
          className="flex min-h-[22rem] items-center justify-center py-2"
          aria-busy="true"
          aria-label="Checking session"
        >
          <Spinner size="lg" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Enter your details below to get started"
      className={signupAuthShellClassName}
    >
      <div className="space-y-6">
        <div className="space-y-6">
          <div className="min-w-0 flex-1 space-y-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                {error && (
                  <Alert variant="destructive" className="animate-shake border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              placeholder="John Doe"
                              disabled={isLoading}
                              autoComplete="name"
                              className={cn(
                                "pl-10 h-11 transition-all duration-200",
                                "border-border/60 hover:border-border focus:border-primary/50",
                                "bg-background/50 dark:bg-background/30"
                              )}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="name@example.com"
                              disabled={isLoading}
                              autoComplete="email"
                              className={cn(
                                "pl-10 h-11 transition-all duration-200",
                                "border-border/60 hover:border-border focus:border-primary/50",
                                "bg-background/50 dark:bg-background/30"
                              )}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              disabled={isLoading}
                              autoComplete="new-password"
                              className={cn(
                                "pl-10 pr-10 h-11 transition-all duration-200",
                                "border-border/60 hover:border-border focus:border-primary/50",
                                "bg-background/50 dark:bg-background/30"
                              )}
                              onChange={(e) => {
                                field.onChange(e)
                                setPassword(e.target.value)
                              }}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/50"
                              onClick={() => setShowPassword(!showPassword)}
                              tabIndex={-1}
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
                </div>

                <LoadingButton
                  type="submit"
                  className="w-full h-11 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 mt-2"
                  size="lg"
                  isLoading={isLoading}
                  loadingText="Creating account..."
                  disabled={!form.formState.isValid || isLoading}
                >
                  <span className="flex items-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </LoadingButton>
              </form>
            </Form>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-card px-3 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div
            className="w-full"
            aria-label="Sign up with a social account"
          >
            <SocialAuthButtons mode="signup" />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground transition-colors font-medium">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors font-medium">
            Privacy Policy
          </Link>
        </p>

        <div className="text-center text-sm pt-1">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link
            href="/login"
            className="text-primary font-semibold hover:text-primary/80 transition-colors hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpPageLoadingShell />}>
      <SignUpPageContent />
    </Suspense>
  )
}
