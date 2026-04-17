"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Settings,
    Briefcase,
    Building2,
    Loader2,
    ShieldOff,
    AlertTriangle,
    ArrowLeft,
    Ban,
    CheckCircle2,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganization, ROLE_INFO } from "@/lib/hooks/use-organization";

interface Tab {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
    { name: "Overview", href: "", icon: LayoutDashboard },
    { name: "Members", href: "members", icon: Users },
    { name: "Teams", href: "teams", icon: Briefcase },
    { name: "Roles", href: "roles", icon: Shield },
    { name: "Settings", href: "settings", icon: Settings },
];

export default function AdminOrganizationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams<{ id: string }>();
    const pathname = usePathname();
    const { organization, isLoading } = useOrganization();

    const basePath = `/organizations/${params.id}`;
    const isActiveTab = (tabHref: string) => {
        const fullPath = tabHref ? `${basePath}/${tabHref}` : basePath;
        // Use exact match for all tabs
        return pathname === fullPath;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/organizations">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold truncate">{organization?.name}</h1>
                                {organization?.banned ? (
                                    <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1 flex-shrink-0">
                                        <Ban className="w-3 h-3" />
                                        Banned
                                    </Badge>
                                ) : (
                                    <Badge className="bg-chart-1/20 text-chart-1 border-chart-1/30 gap-1 flex-shrink-0">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Active
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{organization?.slug}</p>
                        </div>
                    </div>
                </div>
            </div>

            {organization?.banned && (
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <ShieldOff className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium text-destructive">This organization is banned</p>
                                {organization.banReason && (
                                    <div className="flex items-start gap-2 mt-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-destructive/80">{organization.banReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="border-b">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = isActiveTab(tab.href);
                        const href = tab.href ? `${basePath}/${tab.href}` : basePath;
                        return (
                            <Link
                                key={tab.name}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                    active
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="min-h-[400px]">{children}</div>
        </div>
    );
}
