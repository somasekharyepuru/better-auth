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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { useAuthCheck } from "@/hooks/use-auth-check"
import { cn } from "@/lib/utils"

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

type SignInForm = z.infer<typeof signInSchema>

function LoginPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Validate redirect URL to prevent open redirect attacks
  const validateRedirectUrl = (url: string | null): string => {
    if (!url) return "/dashboard"
    // Only allow relative paths, reject absolute URLs or protocol-relative URLs
    if (url.startsWith('/') && !url.startsWith('//') && !url.includes(':')) {
      return url
    }
    return "/dashboard"
  }

  const redirectUrl = searchParams.get("redirect")
  const safeRedirectUrl = validateRedirectUrl(redirectUrl)

  const { isChecking } = useAuthCheck({ redirectIfAuthenticated: true, redirectTo: safeRedirectUrl })

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  })

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true)
    setError("")

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
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

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      <div className="space-y-5">
        <SocialAuthButtons mode="signin" />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="rememberMe"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </FormControl>
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Keep me signed in for 30 days
                  </Label>
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              className="w-full h-11 font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
              size="lg"
              isLoading={isLoading}
              loadingText="Signing in..."
            >
              <span className="flex items-center gap-2">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </span>
            </LoadingButton>
          </form>
        </Form>

        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link
            href="/signup"
            className="text-primary font-semibold hover:text-primary/80 transition-colors hover:underline underline-offset-4"
          >
            Create account
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Spinner size="lg" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
