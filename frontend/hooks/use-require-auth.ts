"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
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

interface UseRequireAuthResult {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useRequireAuth(): UseRequireAuthResult {
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
        router.replace("/login");
      } else {
        setUser(data.user as User);
        setSession(data.session as Session);
      }
    } catch (error) {
      console.error("Failed to fetch session", error);
      setUser(null);
      setSession(null);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return { user, session, isLoading, refetch: fetchSession };
}
