"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  Wrench,
  Calendar,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Shield,
  MonitorPlay,
  History,
  KeyRound,
  Search,
  Home,
  Clock,
  Target,
  HelpCircle,
  ChevronDown,
  Plus,
  Building2,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useSettings } from "@/lib/settings-context";
import { CALENDAR_UI_ENABLED } from "@/lib/feature-flags";
import { HeaderCalendarWidget } from "@/components/calendar/header-calendar-widget";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn, getAvatarFallback } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string | null;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

export function UnifiedHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
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

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const runCommand = (command: () => void) => {
    setIsCommandOpen(false);
    command();
  };

  const isCalendarPage =
    CALENDAR_UI_ENABLED &&
    (pathname === "/calendar" || pathname.startsWith("/calendar/"));
  const isDashboard = pathname === "/";
  const isToolsPage = pathname === "/tools" || pathname.startsWith("/tools/");
  const showToolsLink = settings.toolsTabEnabled && (settings.pomodoroEnabled || settings.eisenhowerEnabled || settings.decisionLogEnabled);
  const userInitials = getAvatarFallback(user?.name, user?.email);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16 min-w-0">
            {/* Logo + desktop date strip when calendar is enabled */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link href="/" className="transition-opacity hover:opacity-80">
                <Logo size="sm" />
              </Link>
              {CALENDAR_UI_ENABLED && (
                <div className="hidden sm:block">
                  <HeaderCalendarWidget variant="full" />
                </div>
              )}
            </div>

            {/* Single command palette trigger — was duplicated on mobile (center + mobile-only row) */}
            <div className="flex flex-1 justify-center min-w-0 px-1 sm:px-2">
              <button
                type="button"
                onClick={() => setIsCommandOpen(true)}
                className={cn(
                  "flex h-9 w-full max-w-[15rem] min-[480px]:max-w-xs sm:max-w-sm md:max-w-md items-center gap-2 rounded-full border border-transparent px-3 text-sm transition-colors",
                  "bg-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-100/80 hover:text-gray-900",
                  "dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800/80 dark:hover:text-gray-200",
                  "sm:justify-center sm:px-4",
                  "justify-start",
                )}
              >
                <Search className="h-4 w-4 shrink-0 opacity-70" />
                <span className="hidden min-[400px]:inline sm:inline truncate text-left">Search…</span>
                <kbd className="ml-auto inline-flex h-5 shrink-0 items-center gap-1 rounded border border-gray-200 bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Trailing actions — Tools lives in the hamburger on small screens to reduce crowding */}
            <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
              {showToolsLink && (
                <button
                  type="button"
                  onClick={() => router.push("/tools")}
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors lg:px-3",
                    isToolsPage
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200",
                  )}
                >
                  <Wrench className="h-4 w-4" />
                  <span className="hidden lg:inline">Tools</span>
                </button>
              )}

              <ThemeSwitcher />

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 gap-1.5 px-1.5 hover:bg-muted sm:px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden max-w-[7rem] truncate text-sm font-medium md:inline-block">
                        {user.name || user.email}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground max-md:hidden" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <div className="flex items-center sm:hidden">
                  {CALENDAR_UI_ENABLED && <HeaderCalendarWidget variant="compact" />}
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    aria-expanded={isMobileMenuOpen}
                    aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </button>
              </div>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden py-3 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { router.push("/"); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                    isDashboard
                      ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </button>
                {CALENDAR_UI_ENABLED && (
                  <button
                    type="button"
                    onClick={() => {
                      router.push("/calendar");
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                      isCalendarPage
                        ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800",
                    )}
                  >
                    <Calendar className="w-5 h-5" />
                    Calendar
                  </button>
                )}
                {showToolsLink && (
                  <button
                    type="button"
                    onClick={() => { router.push("/tools"); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                      isToolsPage
                        ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800",
                    )}
                  >
                    <Wrench className="w-5 h-5" />
                    Tools
                  </button>
                )}
                <button
                  onClick={() => { router.push("/organizations"); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Building2 className="w-5 h-5" />
                  Organizations
                </button>
                <button
                  onClick={() => { router.push("/help"); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                  Help
                </button>
                <div className="px-1 py-2 border-t border-gray-100 dark:border-gray-800 mt-1">
                  <ThemeSwitcher variant="dropdown" />
                </div>
                {user && (
                  <>
                    <button
                      onClick={() => { router.push("/profile"); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </button>
                    <button
                      onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

      {/* Command Palette Dialog */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Daymark Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            {CALENDAR_UI_ENABLED && (
              <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Calendar</span>
                <CommandShortcut>⌘C</CommandShortcut>
              </CommandItem>
            )}
            <CommandItem onSelect={() => runCommand(() => router.push("/tools"))}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Tools</span>
              <CommandShortcut>⌘T</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/help"))}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Productivity Tools */}
          <CommandGroup heading="Productivity Tools">
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/matrix"))}>
              <Target className="mr-2 h-4 w-4" />
              <span>Eisenhower Matrix</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/pomodoro"))}>
              <Clock className="mr-2 h-4 w-4" />
              <span>Pomodoro Timer</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tools/decisions"))}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Decision Log</span>
            </CommandItem>
            {CALENDAR_UI_ENABLED && (
              <CommandItem onSelect={() => runCommand(() => router.push("/settings/calendars"))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Calendar Settings</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* Auth-Service: Organizations */}
          <CommandGroup heading="Organizations">
            <CommandItem onSelect={() => runCommand(() => router.push("/organizations"))}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>My Organizations</span>
              <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/organizations/create"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create Organization</span>
            </CommandItem>
          </CommandGroup>

          {user && (
            <>
              <CommandSeparator />

              {/* Account & Security */}
              <CommandGroup heading="Account & Security">
                <CommandItem onSelect={() => runCommand(() => router.push("/profile"))}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile & Preferences</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/profile/two-factor"))}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Two-Factor Auth</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/profile/sessions"))}>
                  <MonitorPlay className="mr-2 h-4 w-4" />
                  <span>Active Sessions</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/profile/activity"))}>
                  <History className="mr-2 h-4 w-4" />
                  <span>Security Activity</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/profile/change-password"))}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Change Password</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Account">
                <CommandItem
                  onSelect={() => runCommand(handleSignOut)}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                  <CommandShortcut>⌘Q</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {!user && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem onSelect={() => runCommand(() => router.push("/login"))}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Sign in</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/signup"))}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create account</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
