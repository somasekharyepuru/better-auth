"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ADMIN_ROLE } from "@/lib/types";
import type { User } from "@/lib/types";

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
            <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}

function isAdminUser(user: User): boolean {
    return user.role === ADMIN_ROLE;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Auth check timed out")), 5000)
                );

                const sessionPromise = authClient.getSession();

                const session = await Promise.race([sessionPromise, timeoutPromise]) as any;

                if (!session?.data?.user || !isAdminUser(session.data.user)) {
                    console.log("No valid session or not admin, redirecting to login");
                    await authClient.signOut();
                    router.replace("/login");
                    return;
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                router.replace("/login");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return <>{children}</>;
}
