"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Users,
    LayoutDashboard,
    Settings,
    LogOut,
    Building,
    FileText,
    Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { authClient } from "@/lib/auth-client";

const sidebarLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "Users", icon: Users },
    { href: "/organizations", label: "Organizations", icon: Building },
    { href: "/audit", label: "Audit Logs", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
];

function AdminSidebarPanel({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        onNavigate?.();
        await authClient.signOut();
        router.push("/login");
    };

    return (
        <div className="flex h-full min-h-0 w-64 flex-col border-r bg-card md:h-screen">
            <div className="flex h-16 shrink-0 items-center border-b px-4 pr-12 md:px-6 md:pr-6">
                <Logo size="sm" showText className="min-w-0 justify-start gap-2" />
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {sidebarLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => onNavigate?.()}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="shrink-0 border-t p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground"
                    onClick={handleSignOut}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="flex h-screen min-h-0 flex-col bg-background md:flex-row">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-2 md:hidden">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label="Open navigation menu"
                    aria-expanded={mobileNavOpen}
                    aria-controls="admin-mobile-nav"
                    onClick={() => setMobileNavOpen(true)}
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <Logo size="xs" showText className="min-w-0 flex-1 justify-start gap-2" />
            </header>

            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent
                    id="admin-mobile-nav"
                    side="left"
                    className="flex w-[min(100%,16rem)] max-w-[16rem] flex-col border-r bg-card p-0 sm:max-w-[16rem] [&>button]:right-3 [&>button]:top-4"
                >
                    <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                    <AdminSidebarPanel onNavigate={() => setMobileNavOpen(false)} />
                </SheetContent>
            </Sheet>

            <div className="hidden min-h-0 md:flex md:shrink-0">
                <AdminSidebarPanel />
            </div>

            <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4 md:p-8">{children}</main>
        </div>
    );
}
