"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Users,
    Briefcase,
    ShieldCheck,
    Clock,
    Calendar,
    UserPlus,
    ShieldOff,
    Mail,
    X,
    RefreshCw,
    Loader2,
    Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import { useOrganization, useOrganizationActions, ROLE_INFO, type Member } from "@/lib/hooks/use-organization";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

export default function AdminOrganizationDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { organization, isLoading, fetchOrg } = useOrganization();
    const { actionLoading, cancelInvitation, resendInvitation } = useOrganizationActions(params.id, fetchOrg);
    const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);

    const stats = useMemo(() => ({
        members: organization?.stats?.memberCount || organization?.memberCount || 0,
        teams: organization?.stats?.teamCount || organization?.teams?.length || 0,
        admins: (organization?.members || []).filter((m: Member) => m.role === "admin" || m.role === "owner").length,
        invites: organization?.stats?.pendingInvites || (organization?.invitations || []).length,
    }), [organization]);

    const adminMembers = useMemo(
        () => organization?.members?.filter((m: Member) => m.role === "owner" || m.role === "admin") || [],
        [organization]
    );

    const handleUnban = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/organizations/${params.id}/unban`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to unban organization");
            }

            toast.success(`Organization "${organization?.name}" has been unbanned`);
            setUnbanDialogOpen(false);
            fetchOrg();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to unban organization";
            toast.error(message);
        }
    };

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28" />
                ))}
            </div>
        );
    }

    const statCards = [
        { title: "Total Members", value: stats.members, icon: Users, description: "Active members in organization", color: "text-primary" },
        { title: "Teams", value: stats.teams, icon: Briefcase, description: "Project teams & groups", color: "text-accent-foreground" },
        { title: "Admins", value: stats.admins, icon: ShieldCheck, description: "Users with admin privileges", color: "text-success" },
        { title: "Pending Invites", value: stats.invites, icon: Clock, description: "Invitations awaiting acceptance", color: "text-warning" },
    ];

    return (
        <div className="space-y-6">
            {organization?.banned && (
                <div className="flex justify-end">
                    <Button onClick={() => setUnbanDialogOpen(true)} className="gap-2">
                        <ShieldOff className="h-4 w-4" />
                        Unban Organization
                    </Button>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">{stat.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Organization ID</p>
                            <p className="text-xs font-mono text-muted-foreground">{organization?.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Created</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">
                                    {organization?.createdAt
                                        ? new Date(organization.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Organization Administrators</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {adminMembers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No administrators found.</p>
                        ) : (
                            <div className="space-y-3">
                                {adminMembers.map((member: Member) => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.user.image} />
                                            <AvatarFallback>{getInitials(member.user.name || member.user.email)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{member.user.name || "Unnamed"}</p>
                                            <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
                                        </div>
                                        <Badge className={ROLE_INFO[member.role]?.color || ROLE_INFO.member.color}>
                                            {ROLE_INFO[member.role]?.label || member.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        Pending Invitations ({organization?.invitations?.length || 0})
                    </CardTitle>
                    {(organization?.invitations?.length || 0) > 0 && (
                        <Button variant="outline" size="sm" onClick={fetchOrg} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {(organization?.invitations?.length || 0) === 0 ? (
                        <div className="py-8 text-center">
                            <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">No pending invitations</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {organization?.invitations.map((invitation) => (
                                <div key={invitation.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{invitation.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {ROLE_INFO[invitation.role]?.label || invitation.role}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => resendInvitation(invitation.id)}
                                            disabled={actionLoading}
                                        >
                                            Resend
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => cancelInvitation(invitation.id)}
                                            disabled={actionLoading}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-4">
                    <QuickActionButton
                        icon={UserPlus}
                        label="Invite Member"
                        description="Add new users"
                        onClick={() => router.push(`/organizations/${params.id}/members`)}
                    />
                    <QuickActionButton
                        icon={Briefcase}
                        label="Create Team"
                        description="Set up a team"
                        onClick={() => router.push(`/organizations/${params.id}/teams`)}
                    />
                    <QuickActionButton
                        icon={Users}
                        label="View Members"
                        description="Manage members"
                        onClick={() => router.push(`/organizations/${params.id}/members`)}
                    />
                    <QuickActionButton
                        icon={Shield}
                        label="Manage Roles"
                        description="Custom permissions"
                        onClick={() => router.push(`/organizations/${params.id}/roles`)}
                    />
                </CardContent>
            </Card>

            <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <ShieldOff className="h-5 w-5 text-success" />
                            Unban Organization
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Are you sure you want to unban <span className="font-semibold text-foreground">{organization?.name}</span>?
                            This will restore full access to all organization members.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnbanDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUnban} disabled={actionLoading}>
                            {actionLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Unbanning...</> : "Unban Organization"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function QuickActionButton({
    icon: Icon,
    label,
    description,
    onClick,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer flex items-center gap-3 text-left"
        >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
            </div>
        </button>
    );
}
