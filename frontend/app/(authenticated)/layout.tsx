"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "@/components/session-provider";
import { Spinner } from "@/components/ui/spinner";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { PlanProvider } from "@/contexts/plan-context";

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useSession();
    const router = useRouter();

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

    return <AuthenticatedShell>{children}</AuthenticatedShell>;
}

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <PlanProvider>
                <AuthenticatedContent>{children}</AuthenticatedContent>
            </PlanProvider>
        </SessionProvider>
    );
}
