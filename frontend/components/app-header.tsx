"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { APP_CONFIG } from "@/config/app.constants";

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

  const getBackButton = () => {
    if (pathname === "/profile" || pathname.startsWith("/profile/")) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      );
    }
    return null;
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {getBackButton()}
            {pathname === "/dashboard" && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {APP_CONFIG.shortName}
                  </span>
                </div>
                <span className="text-xl font-semibold">{APP_CONFIG.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {pathname !== "/dashboard" && (
              <>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {APP_CONFIG.shortName}
                  </span>
                </div>
                <span className="text-xl font-semibold">{APP_CONFIG.name}</span>
              </>
            )}
            {pathname === "/dashboard" && user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.name}
                </span>
                <Button
                  onClick={() => router.push("/profile")}
                  variant="ghost"
                  size="sm"
                >
                  Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
