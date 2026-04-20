"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { LandingPage } from "@/components/landing/landing-page";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { AuthenticatedShell } from "@/components/authenticated-shell";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Restore cached user only after mount so the first client paint matches SSR
  // (reading localStorage during render causes hydration mismatches).
  useEffect(() => {
    try {
      const cached = localStorage.getItem("auth_user");
      if (cached) {
        setUser(JSON.parse(cached) as User);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.data?.user) {
          const userData = session.data.user as User;
          setUser(userData);
          // Cache the user to prevent flash on next load
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_user', JSON.stringify(userData));
          }
        } else {
          setUser(null);
          // Clear cache if not authenticated
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        // User is not authenticated
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_user');
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Same initial shell on server and first client paint; cache applies after mount via useEffect.
  if (isCheckingAuth && user === null) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" />
    );
  }

  // Same shell as (authenticated) routes: UnifiedHeader, padding, TimeBlockTypes, etc.
  if (user) {
    return (
      <AuthenticatedShell>
        <DashboardContent user={user} />
      </AuthenticatedShell>
    );
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}
