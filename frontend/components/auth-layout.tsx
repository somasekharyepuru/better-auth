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
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 relative overflow-hidden">
            {/* Background — static gradient + soft blobs (no pulse: reads as flicker on large blurs) */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-purple-500/5 dark:from-primary/5 dark:via-background dark:to-purple-500/3" />

            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/16 rounded-full blur-3xl motion-reduce:opacity-80" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/12 rounded-full blur-3xl motion-reduce:opacity-80" />
            <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-3xl motion-reduce:opacity-80" />

            <div className="absolute inset-0 decorative-grid opacity-20 dark:opacity-10" />

            <div
                className={cn(
                    "w-full max-w-md sm:max-w-lg relative z-10",
                    className
                )}
            >
                <div className="flex justify-center mb-7 sm:mb-8">
                    <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
                        <Logo size="lg" />
                    </Link>
                </div>

                <Card className="shadow-2xl shadow-primary/5 border-border/50 bg-card/80 backdrop-blur-xl dark:bg-card/60">
                    <CardHeader className="space-y-2 pb-2 pt-7 sm:pt-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-center text-foreground tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-muted-foreground text-sm text-center leading-relaxed px-1">
                                {subtitle}
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="pb-7 sm:pb-8 pt-1">{children}</CardContent>
                </Card>

                <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 dark:bg-muted/30 border border-border/50">
                        <Lock className="h-3 w-3 shrink-0" />
                        <span>Secured with 256-bit SSL encryption</span>
                    </div>
                </div>

                <div className="mt-5 text-center">
                    <div className="flex items-center justify-center gap-5 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                        {FOOTER_LINKS.map((link) => (
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

                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] sm:text-xs text-muted-foreground/60">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 shrink-0" />
                        <span>GDPR Compliant</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
