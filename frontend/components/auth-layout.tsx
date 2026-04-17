"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle?: string;
    className?: string;
}

const FOOTER_LINKS = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Help", href: "/" },
] as const;

export function AuthLayout({ children, title, subtitle, className }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
            {/* Animated background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-purple-500/5 dark:from-primary/5 dark:via-background dark:to-purple-500/3" />

            {/* Floating orbs */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl animate-pulse-subtle" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-3xl animate-pulse-subtle delay-700" />
            <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-3xl animate-pulse-subtle delay-300" />

            {/* Decorative grid */}
            <div className="absolute inset-0 decorative-grid opacity-20 dark:opacity-10" />


            {/* Main content */}
            <div className={cn("w-full max-w-md relative z-10", className)}>
                {/* Logo centered above card */}
                <div className="flex justify-center mb-6 animate-fade-in-down">
                    <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
                        <Logo size="lg" />
                    </Link>
                </div>

                {/* Auth card with enhanced glass effect */}
                <Card className="animate-fade-in-up delay-100 shadow-2xl shadow-primary/5 border-border/50 bg-card/80 backdrop-blur-xl dark:bg-card/60">
                    <CardHeader className="space-y-1.5 pb-4 pt-6">
                        <h1 className="text-2xl sm:text-3xl font-bold text-center text-foreground tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-muted-foreground text-sm text-center">
                                {subtitle}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="pb-6">{children}</CardContent>
                </Card>

                {/* Security badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground animate-fade-in delay-400">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 dark:bg-muted/30 border border-border/50">
                        <Lock className="h-3 w-3" />
                        <span>Secured with 256-bit SSL encryption</span>
                    </div>
                </div>

                {/* Footer links */}
                <div className="mt-6 text-center animate-fade-in delay-500">
                    <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                        {FOOTER_LINKS.map((link, index) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="hover:text-foreground transition-colors hover:underline underline-offset-4"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Trust indicators */}
                <div className="mt-8 flex items-center justify-center gap-4 animate-fade-in delay-700">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground/60">
                        <ShieldCheck className="h-3 w-3" />
                        <span>GDPR Compliant</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
