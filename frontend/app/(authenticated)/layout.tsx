"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UnifiedHeader } from "@/components/unified-header";
import { SessionProvider, useSession } from "@/components/session-provider";
import { Spinner } from "@/components/ui/spinner";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { SettingsProvider } from "@/lib/settings-context";
import { LifeAreasProvider } from "@/lib/life-areas-context";
import { FocusProvider } from "@/lib/focus-context";
import { TimeBlockTypesProvider } from "@/lib/time-block-types-context";
import { FloatingFocusTimer } from "@/components/focus/floating-focus-timer";
import { ThemeSyncer } from "@/components/theme-syncer";
import { cn } from "@/lib/utils";

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const isOrgDashboard = pathname?.startsWith("/organizations/") && pathname.split("/").length > 2;
    const isFullWidth = isOrgDashboard;

    return (
        <SettingsProvider>
            <ThemeSyncer />
            <TimeBlockTypesProvider>
                <LifeAreasProvider>
                    <FocusProvider>
                        <ImpersonationBanner />
                        <UnifiedHeader />
                        <main className={cn(
                            "pt-16 min-h-screen",
                            isFullWidth ? "p-0" : "px-4 py-6 max-w-6xl mx-auto"
                        )}>
                            {children}
                        </main>
                        <FloatingFocusTimer />
                    </FocusProvider>
                </LifeAreasProvider>
            </TimeBlockTypesProvider>
        </SettingsProvider>
    );
}

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <AuthenticatedContent>{children}</AuthenticatedContent>
        </SessionProvider>
    );
}
