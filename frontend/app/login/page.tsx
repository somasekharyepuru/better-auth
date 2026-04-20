"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, AlertCircle, Mail, Lock, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { AuthLayout } from "@/components/auth-layout"
import { LoadingButton } from "@/components/ui/loading-button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { SocialAuthButtons } from "@/components/social-auth-buttons"
import { authClient } from "@/lib/auth-client"
import { useAuthCheck } from "@/hooks/use-auth-check"
import { cn } from "@/lib/utils"

const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

type SignInForm = z.infer<typeof signInSchema>

function validateRedirectUrl(url: string | null): string {
  if (!url) return "/dashboard"
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes(":")) {
    return url
  }
  return "/dashboard"
}

const loginAuthShellClassName = ""

function LoginPageLoadingShell() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      className={loginAuthShellClassName}
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

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectUrl = searchParams.get("redirect")
  const safeRedirectUrl = validateRedirectUrl(redirectUrl)

  const { isChecking } = useAuthCheck({ redirectIfAuthenticated: true, redirectTo: safeRedirectUrl })

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  })

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          const verifyUrl = `/verify-email?email=${encodeURIComponent(data.email)}${redirectUrl ? `&redirect=${encodeURIComponent(safeRedirectUrl)}` : ""}`
          router.push(verifyUrl)
          return
        }
        setError(result.error.message || "Invalid email or password")
        return
      }

      if (
        result.data &&
        "twoFactorRedirect" in result.data &&
        result.data.twoFactorRedirect
      ) {
        router.push(`/verify-2fa?callbackURL=${encodeURIComponent(safeRedirectUrl)}`)
        return
      }

      toast.success("Welcome back!", { duration: 3000 })
      router.push(safeRedirectUrl)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Sign in error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      className={loginAuthShellClassName}
    >
      {isChecking ? (
        <div
          className="flex min-h-[22rem] items-center justify-center py-2"
          aria-busy="true"
          aria-label="Checking session"
        >
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-6">
            <div className="min-w-0 flex-1 space-y-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {error && (
                    <Alert variant="destructive" className="animate-shake border-destructive/50 bg-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
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
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium">Password</FormLabel>
                            <Link
                              href="/forgot-password"
                              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                disabled={isLoading}
                                autoComplete="current-password"
                                className={cn(
                                  "pl-10 pr-10 h-11 transition-all duration-200",
                                  "border-border/60 hover:border-border focus:border-primary/50",
                                  "bg-background/50 dark:bg-background/30"
                                )}
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
                        </FormItem>
                      )}
                    />
                  </div>

                  <LoadingButton
                    type="submit"
                    className="w-full h-11 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    disabled={!form.formState.isValid || isLoading}
                  >
                    <span className="flex items-center gap-2">
                      Sign in
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
              aria-label="Sign in with a social account"
            >
              <SocialAuthButtons mode="signin" />
            </div>
          </div>

          <div className="text-center text-sm pt-1">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link
              href="/signup"
              className="text-primary font-semibold hover:text-primary/80 transition-colors hover:underline underline-offset-4"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoadingShell />}>
      <LoginPageContent />
    </Suspense>
  )
}
