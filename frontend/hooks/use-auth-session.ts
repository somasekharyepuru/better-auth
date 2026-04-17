"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { User } from "@/lib/types";

interface UseAuthSessionOptions {
    redirectTo?: string;
    requireAuth?: boolean;
}

interface UseAuthSessionReturn {
    user: User | null;
    isLoading: boolean;
    isError: boolean;
}

/**
 * Hook to manage authentication session across the app.
 * Handles session checking, loading states, and redirects.
 *
 * @example
 * const { user, isLoading } = useAuthSession({ requireAuth: true });
 */
export function useAuthSession(options: UseAuthSessionOptions = {}): UseAuthSessionReturn {
    const { redirectTo = "/login", requireAuth = false } = options;
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await authClient.getSession();

                if (response.data?.user) {
                    setUser(response.data.user as User);
                } else if (requireAuth) {
                    router.replace(redirectTo);
                }
            } catch {
                setIsError(true);
                if (requireAuth) {
                    router.replace(redirectTo);
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, [router, pathname, requireAuth, redirectTo]);

    return { user, isLoading, isError };
}
