"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Building2,
    ShieldOff,
    Trash2,
    Loader2,
    AlertTriangle,
    Ban,
    CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useOrganization } from "@/lib/hooks/use-organization";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

export default function AdminOrganizationSettingsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { organization, isLoading, fetchOrg } = useOrganization();

    const [actionLoading, setActionLoading] = useState(false);
    const [orgName, setOrgName] = useState(organization?.name || "");
    const [orgSlug, setOrgSlug] = useState(organization?.slug || "");
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [banReason, setBanReason] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");

    const hasChanges = orgName !== organization?.name || orgSlug !== organization?.slug;

    const handleUpdateSettings = async () => {
        if (!orgName.trim() || !orgSlug.trim()) {
            toast.error("Name and slug are required");
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/organizations/${params.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: orgName, slug: orgSlug }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to update organization");
            }

            toast.success("Organization updated");
            fetchOrg();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update organization";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBan = async () => {
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/organizations/${params.id}/ban`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: banReason || undefined }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to ban organization");
            }

            toast.success(`Organization "${organization?.name}" has been banned`);
            setBanDialogOpen(false);
            setBanReason("");
            fetchOrg();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to ban organization";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnban = async () => {
        setActionLoading(true);
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
            fetchOrg();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to unban organization";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm !== "DELETE") {
            toast.error('Please type "DELETE" to confirm');
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/organizations/${params.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete organization");
            }

            toast.success(`Organization "${organization?.name}" deleted`);
            router.push("/organizations");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to delete organization";
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage settings for {organization?.name}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        General Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input
                            id="org-name"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="Organization name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="org-slug">Slug</Label>
                        <Input
                            id="org-slug"
                            value={orgSlug}
                            onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                            placeholder="organization-slug"
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Used in URLs. Only lowercase letters, numbers, and hyphens.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <Button onClick={handleUpdateSettings} disabled={!hasChanges || actionLoading}>
                            {actionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                        {hasChanges && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setOrgName(organization?.name || "");
                                    setOrgSlug(organization?.slug || "");
                                }}
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Organization Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                            {organization?.banned ? (
                                <Ban className="h-8 w-8 text-destructive" />
                            ) : (
                                <CheckCircle2 className="h-8 w-8 text-success" />
                            )}
                            <div>
                                <p className="font-medium">{organization?.banned ? "Banned" : "Active"}</p>
                                <p className="text-sm text-muted-foreground">
                                    {organization?.banned
                                        ? `Banned on ${organization.bannedAt ? new Date(organization.bannedAt).toLocaleDateString() : "unknown date"}`
                                        : "Organization is fully operational"}
                                </p>
                            </div>
                        </div>
                        <Badge
                            className={
                                organization?.banned
                                    ? "bg-destructive/20 text-destructive border-destructive/30"
                                    : "bg-success/20 text-success border-success/30"
                            }
                        >
                            {organization?.banned ? "Banned" : "Active"}
                        </Badge>
                    </div>
                    {organization?.banned && organization.banReason && (
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-destructive">Ban Reason</p>
                                    <p className="text-sm text-destructive/80 mt-1">{organization.banReason}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Admin Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div>
                            <p className="font-medium">Ban Organization</p>
                            <p className="text-sm text-muted-foreground">
                                Prevent all members from accessing this organization
                            </p>
                        </div>
                        {organization?.banned ? (
                            <Button variant="outline" onClick={handleUnban} disabled={actionLoading} className="gap-2">
                                <ShieldOff className="h-4 w-4" />
                                Unban
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => setBanDialogOpen(true)} className="gap-2">
                                <Ban className="h-4 w-4" />
                                Ban
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                        <div>
                            <p className="font-medium text-destructive">Delete Organization</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete this organization and all its data
                            </p>
                        </div>
                        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Ban className="h-5 w-5 text-destructive" />
                            Ban Organization
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Banning <strong>{organization?.name}</strong> will prevent all members from accessing the organization.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="ban-reason">Reason (optional)</Label>
                            <Input
                                id="ban-reason"
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Reason for banning this organization..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleBan} disabled={actionLoading}>
                            {actionLoading ? "Banning..." : "Ban Organization"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Delete Organization
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            This action <strong className="text-destructive">cannot be undone</strong>. This will permanently delete{" "}
                            <strong>{organization?.name}</strong> and remove all members.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-destructive">Warning</p>
                                    <p className="text-sm text-destructive/80 mt-1">
                                        All teams, invitations, and member associations will be permanently deleted.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="delete-confirm">
                                Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">DELETE</span> to confirm
                            </Label>
                            <Input
                                id="delete-confirm"
                                value={deleteConfirm}
                                onChange={(e) => setDeleteConfirm(e.target.value)}
                                placeholder="DELETE"
                                className="font-mono"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false);
                                setDeleteConfirm("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={actionLoading || deleteConfirm !== "DELETE"}
                        >
                            {actionLoading ? "Deleting..." : "Delete Organization"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
