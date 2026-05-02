"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Settings,
    Briefcase,
    Building2,
    Loader2,
    LogOut,
    Menu,
    ShieldOff,
    AlertTriangle,
    Shield,
    Key,
    Activity,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetTrigger
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    useBanStatusQuery,
    useOrganizationDetail,
    useCurrentUserRole,
} from "@/hooks/use-organization-queries";

interface OrganizationError {
    code?: string;
    message?: string;
}

function isOrganizationError(error: unknown): error is OrganizationError {
    return (
        typeof error === "object" &&
        error !== null &&
        ("code" in error || "message" in error)
    );
}

const ROLE_INFO: Record<string, { label: string; color: string }> = {
    owner: { label: "Owner", color: "bg-warning/20 text-warning border-warning/30" },
    admin: { label: "Admin", color: "bg-primary/20 text-primary border-primary/30" },
    manager: { label: "Manager", color: "bg-accent/20 text-accent-foreground border-accent/30" },
    member: { label: "Member", color: "bg-success/20 text-success border-success/30" },
    viewer: { label: "Viewer", color: "bg-muted text-muted-foreground border-border" },
};

export default function OrganizationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams<{ id: string }>();
    const pathname = usePathname();
    const router = useRouter();

    const { data: banStatus, isLoading: banLoading } = useBanStatusQuery(params.id);
    const isBanned = banStatus?.banned === true;

    const { data: organization, isLoading: orgLoading, error: orgError } = useOrganizationDetail(
        params.id,
        !isBanned && !banLoading
    );

    const { currentUserRole, isLoading: roleLoading } = useCurrentUserRole(params.id);

    const isLoading = banLoading || (!isBanned && (orgLoading || roleLoading));

    if (isOrganizationError(orgError) && orgError.code === "ORGANIZATION_BANNED") {
        return <BannedView banReason={orgError.message ?? null} />;
    }

    if (!isLoading && !organization && !isBanned) {
        return null; // Will redirect via useEffect
    }

    const canAccessSettings = currentUserRole === "owner" || currentUserRole === "admin";

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isBanned) {
        return <BannedView banReason={banStatus?.banReason || null} />;
    }

    const navigation = [
        { name: "Dashboard", href: `/organizations/${params.id}`, icon: LayoutDashboard, show: true },
        { name: "Members", href: `/organizations/${params.id}/members`, icon: Users, show: true },
        { name: "Teams", href: `/organizations/${params.id}/teams`, icon: Briefcase, show: true },
        { name: "Roles", href: `/organizations/${params.id}/roles`, icon: Key, show: canAccessSettings },
        { name: "Settings", href: `/organizations/${params.id}/settings`, icon: Settings, show: canAccessSettings },
        { name: "Billing", href: `/organizations/${params.id}/settings/billing`, icon: CreditCard, show: canAccessSettings },
    ].filter(item => item.show);

    const roleInfo = currentUserRole ? ROLE_INFO[currentUserRole] : null;

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 lg:p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        {organization?.logo ? (
                            <img src={organization.logo} alt={organization.name} className="h-8 w-8 object-cover rounded" />
                        ) : (
                            <Building2 className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-sm">
                            {organization?.name}
                        </div>
                        {roleInfo && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                                    {roleInfo.label}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground truncate font-mono">
                                    {organization?.slug}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 py-2 px-3 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = item.href === `/organizations/${params.id}`
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t bg-muted/20">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm h-9"
                    onClick={() => router.push("/organizations")}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Switch Organization
                </Button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 border-r bg-background shrink-0">
                <div className="sticky top-16 h-[calc(100vh-4rem)]">
                    <SidebarContent />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header (only visible on small screens) */}
                <div className="lg:hidden h-14 border-b flex items-center px-4 bg-background sticky top-16 z-30">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate text-sm">{organization?.name}</span>
                        {roleInfo && (
                            <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${roleInfo.color}`}>
                                {roleInfo.label}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

function BannedView({ banReason }: { banReason: string | null }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <Card className="max-w-lg w-full border-destructive/30 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <ShieldOff className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl text-destructive">
                        Organization Suspended
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <p className="text-muted-foreground">
                        This organization has been suspended by an administrator and is currently unavailable.
                    </p>

                    {banReason && (
                        <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-destructive">Reason</p>
                                    <p className="text-sm text-destructive/80">{banReason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pt-4">
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button variant="outline" asChild>
                                <Link href="/organizations">
                                    <Building2 className="mr-2 h-4 w-4" />
                                    Switch Organization
                                </Link>
                            </Button>
                            <Button variant="ghost" asChild>
                                <Link href="/profile">
                                    Go to Profile
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
