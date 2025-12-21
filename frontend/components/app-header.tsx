"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Wrench } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useSettings } from "@/lib/settings-context";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

export function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useSettings();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = await authClient.getSession();
        if (sessionData?.data?.user) {
          setUser(sessionData.data.user);
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth();
  }, []);

  const isProfilePage = pathname === "/profile" || pathname.startsWith("/profile/");
  const isToolsPage = pathname === "/tools" || pathname.startsWith("/tools/");
  const isDashboard = pathname === "/dashboard";
  const showToolsLink = settings.toolsTabEnabled && (settings.pomodoroEnabled || settings.eisenhowerEnabled || settings.decisionLogEnabled);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {isProfilePage || isToolsPage ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
            ) : (
              <Link href="/dashboard">
                <Logo size="sm" />
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {isDashboard && showToolsLink && (
              <button
                onClick={() => router.push("/tools")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Wrench className="w-4 h-4" />
                Tools
              </button>
            )}
            {isDashboard && user && (
              <>
                <span className="text-sm text-gray-500">
                  {user.name}
                </span>
                <button
                  onClick={() => router.push("/profile")}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              </>
            )}
            {(isProfilePage || isToolsPage) && (
              <Link href="/dashboard">
                <Logo size="sm" showText={false} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
