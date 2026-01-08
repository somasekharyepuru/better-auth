"use client";

import { useEffect, useState, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { LandingPage } from "@/components/landing/landing-page";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { AppHeader } from "@/components/app-header";
import { SettingsProvider } from "@/lib/settings-context";
import { LifeAreasProvider } from "@/lib/life-areas-context";
import { FocusProvider } from "@/lib/focus-context";
import { FloatingFocusTimer } from "@/components/focus/floating-focus-timer";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Try to get cached auth state from localStorage to prevent flash
  const cachedAuth = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('auth_user');
      if (cached) {
        return JSON.parse(cached) as User;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);

  // Initialize with cached user if available
  useEffect(() => {
    if (cachedAuth) {
      setUser(cachedAuth);
    }
  }, [cachedAuth]);

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

  // If we have cached user, show dashboard immediately (no flash)
  // Otherwise show minimal loading
  if (isCheckingAuth && !cachedAuth) {
    return (
      <div className="min-h-screen bg-white" />
    );
  }

  // If authenticated, show dashboard with providers
  if (user) {
    return (
      <SettingsProvider>
        <LifeAreasProvider>
          <FocusProvider>
            <AppHeader />
            <div className="pt-16">
              <DashboardContent user={user} />
            </div>
            <FloatingFocusTimer />
          </FocusProvider>
        </LifeAreasProvider>
      </SettingsProvider>
    );
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}
