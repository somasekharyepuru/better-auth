"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, ShieldCheck, Mail, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingButton } from "@/components/ui/loading-button";
import { Logo } from "@/components/ui/logo";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

/** Light-theme-only field styles (avoid semantic bg-background + dark: which follow OS dark mode). */
const loginInputClass =
    "pl-10 h-11 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm " +
    "placeholder:text-slate-400 hover:border-slate-300 " +
    "focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-400/25 focus-visible:ring-offset-0 " +
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-100";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
        mode: "onChange",
    });

    const [emailVal, passwordVal] = watch(["email", "password"]);
    const hasRequiredInput =
        typeof emailVal === "string" &&
        emailVal.trim().length > 0 &&
        typeof passwordVal === "string" &&
        passwordVal.length > 0;

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError("");

        try {
            const result = await authClient.signIn.email({
                email: data.email,
                password: data.password,
            });

            if (result.error) {
                setError(result.error.message || "Invalid credentials");
                return;
            }

            const session = await authClient.getSession();
            if (session?.data?.user?.role !== "admin") {
                setError("Access denied. Admin privileges required.");
                await authClient.signOut();
                return;
            }

            router.push("/");
        } catch (err) {
            setError("An unexpected error occurred");
            console.error("Admin sign in error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 relative overflow-hidden bg-slate-100 text-slate-600">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-100/90 via-white to-indigo-50/80 pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-200/40 rounded-full blur-3xl motion-reduce:opacity-80 pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-200/35 rounded-full blur-3xl motion-reduce:opacity-80 pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-purple-200/30 rounded-full blur-3xl motion-reduce:opacity-80 pointer-events-none" />
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.35]"
                style={{
                    backgroundImage: `linear-gradient(to right, rgb(148 163 184 / 0.22) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.22) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="w-full max-w-[420px] relative z-10">
                <div className="flex flex-col items-center mb-7 sm:mb-8 gap-2">
                    <Logo size="lg" palette="light" className="gap-3" />
                    <p className="text-xs font-medium uppercase tracking-wider text-violet-800/80">
                        Admin console
                    </p>
                </div>

                <Card className="shadow-xl shadow-slate-300/40 border-slate-200/90 bg-white/95 backdrop-blur-xl">
                    <CardHeader className="space-y-2 pb-2 pt-7 sm:pt-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 tracking-tight">
                            Admin Login
                        </h1>
                        <p className="text-slate-600 text-sm text-center leading-relaxed px-1">
                            Sign in to access the admin dashboard
                        </p>
                    </CardHeader>
                    <CardContent className="pb-7 sm:pb-8 pt-1">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {error && (
                                <Alert
                                    variant="destructive"
                                    className="border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-700 *:[data-slot=alert-description]:text-red-800"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="admin-email" className="text-sm font-medium text-slate-800">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <Input
                                        id="admin-email"
                                        {...register("email")}
                                        type="email"
                                        placeholder="name@example.com"
                                        disabled={isLoading}
                                        autoComplete="email"
                                        className={cn(loginInputClass)}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="admin-password" className="text-sm font-medium text-slate-800">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                    <Input
                                        id="admin-password"
                                        {...register("password")}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                        className={cn(loginInputClass, "pr-10")}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            <LoadingButton
                                type="submit"
                                className="w-full h-11 rounded-full font-medium shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200"
                                size="lg"
                                isLoading={isLoading}
                                loadingText="Signing in..."
                                disabled={!hasRequiredInput}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Sign In
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            </LoadingButton>
                        </form>
                    </CardContent>
                </Card>

                <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-slate-200/90 shadow-sm">
                        <Lock className="h-3 w-3 shrink-0 text-slate-500" />
                        <span>Secured connection — admin access only</span>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] sm:text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 shrink-0" />
                        <span>Role-restricted dashboard</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
