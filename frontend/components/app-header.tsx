"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  ArrowLeft,
  Wrench,
  Calendar,
  Menu,
  X,
  User,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useSettings } from "@/lib/settings-context";
import { CALENDAR_UI_ENABLED } from "@/lib/feature-flags";
import { HeaderCalendarWidget } from "@/components/calendar/header-calendar-widget";
import { ThemeSwitcher } from "@/components/theme-switcher";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  twoFactorEnabled?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

export function AppHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isProfilePage =
    pathname === "/profile" || pathname.startsWith("/profile/");
  const isToolsPage = pathname === "/tools" || pathname.startsWith("/tools/");
  const isCalendarPage =
    CALENDAR_UI_ENABLED &&
    (pathname === "/calendar" || pathname.startsWith("/calendar/"));
  const isDashboard = pathname === "/";
  const showToolsLink =
    settings.toolsTabEnabled &&
    (settings.pomodoroEnabled ||
      settings.eisenhowerEnabled ||
      settings.decisionLogEnabled);
  const showNavLinks = isDashboard || isCalendarPage;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {isProfilePage || isToolsPage || isCalendarPage ? (
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">
                  Back
                </span>
              </button>
            ) : (
              <Link href="/">
                <Logo size="sm" />
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-3">
            {CALENDAR_UI_ENABLED && showNavLinks && (
              <HeaderCalendarWidget variant="full" />
            )}
            {showNavLinks && showToolsLink && (
              <button
                onClick={() => router.push("/tools")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Wrench className="w-4 h-4" />
                Tools
              </button>
            )}
            {/* Theme Switcher - before profile */}
            {showNavLinks && <ThemeSwitcher />}
            {showNavLinks && user && (
              <div
                ref={profileDropdownRef}
                className="relative"
                onMouseEnter={() => setIsProfileDropdownOpen(true)}
                onMouseLeave={() => setIsProfileDropdownOpen(false)}
              >
                <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors">
                  {user.name.charAt(0).toUpperCase()}
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full pt-1">
                    <div className="w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => {
                          router.push("/profile");
                          setIsProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button
                        onClick={async () => {
                          await authClient.signOut();
                          router.push("/login");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(isProfilePage || isToolsPage) && (
              <Link href="/">
                <Logo size="sm" showText={false} />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center gap-2">
            {/* Mobile Calendar Widget (compact) */}
            {CALENDAR_UI_ENABLED && showNavLinks && (
              <HeaderCalendarWidget variant="compact" />
            )}
            {showNavLinks && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}
            {(isProfilePage || isToolsPage || isCalendarPage) && (
              <Link href="/">
                <Logo size="sm" showText={false} />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && showNavLinks && (
          <div className="sm:hidden py-3 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {CALENDAR_UI_ENABLED && (
                <button
                  type="button"
                  onClick={() => router.push("/calendar")}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                    isCalendarPage
                      ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  Full Calendar View
                </button>
              )}
              {showToolsLink && (
                <button
                  onClick={() => router.push("/tools")}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Wrench className="w-5 h-5" />
                  Tools
                </button>
              )}
              {/* Mobile Theme Switcher */}
              <div className="px-1 py-2 border-t border-gray-100 dark:border-gray-800 mt-1">
                <ThemeSwitcher variant="dropdown" />
              </div>
              {user && (
                <>
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </button>
                  <button
                    onClick={async () => {
                      await authClient.signOut();
                      router.push("/login");
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
