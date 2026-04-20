"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    role?: string | null;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
    twoFactorEnabled?: boolean;
}

interface Session {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    activeOrganizationId?: string | null;
}

interface SessionContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    refetch: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
    user: null,
    session: null,
    isLoading: true,
    refetch: async () => { },
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchSession = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await authClient.getSession();

            if (error || !data) {
                setUser(null);
                setSession(null);
            } else {
                setUser(data.user as User);
                setSession(data.session as Session);
            }
        } catch (error) {
            console.error("Failed to fetch session", error);
            setUser(null);
            setSession(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSession();
    }, []);

    return (
        <SessionContext.Provider value={{ user, session, isLoading, refetch: fetchSession }}>
            {children}
        </SessionContext.Provider>
    );
}
