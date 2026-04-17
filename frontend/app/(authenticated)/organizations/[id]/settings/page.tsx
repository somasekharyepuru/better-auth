"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Trash2, ArrowRightLeft, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import {
    useOrganizationDetail,
    useOrganizationMembers,
    useSessionQuery,
    useInvalidateOrgQueries,
} from "@/hooks/use-organization-queries";

const settingsSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface Member {
    id: string;
    userId: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface PendingTransfer {
    id: string;
    toUser: {
        id: string;
        name: string | null;
        email: string;
    };
    expiresAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

export default function OrganizationSettingsPage() {
    const params = useParams<{ id: string }>();
    const [isSaving, setIsSaving] = useState(false);
    const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [isTransferring, setIsTransferring] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const router = useRouter();

    const { data: organization, isLoading: orgLoading } = useOrganizationDetail(params.id);
    const { data: cachedMembers = [], isLoading: membersLoading } = useOrganizationMembers(params.id);
    const { data: session } = useSessionQuery();
    const { invalidateDetail } = useInvalidateOrgQueries();

    const members = cachedMembers as Member[];
    const currentUserId = session?.user?.id;
    const currentMember = members.find((m) => m.userId === currentUserId);
    const currentUserRole = currentMember?.role || "";
    const isLoading = orgLoading || membersLoading;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsForm>({
        resolver: zodResolver(settingsSchema),
    });

    useEffect(() => {
        if (organization) {
            reset({
                name: organization.name,
                slug: organization.slug,
            });
        }
    }, [organization, reset]);

    useEffect(() => {
        const fetchTransfer = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/organizations/${params.id}/transfer`, {
                    credentials: "include",
                });
                if (response.ok) {
                    const transfer = await response.json();
                    if (transfer) {
                        setPendingTransfer(transfer);
                    }
                } else {
                    setPendingTransfer(null);
                }
            } catch (e) {
                console.error("Failed to check pending transfer:", e);
                setPendingTransfer(null);
            }
        };
        fetchTransfer();
    }, [params.id]);

    const onUpdate = async (data: SettingsForm) => {
        setIsSaving(true);
        try {
            // @ts-ignore
            const { error } = await authClient.organization.update({
                organizationId: params.id,
                data: {
                    name: data.name,
                    slug: data.slug,
                },
            });

            if (error) {
                toast.error(error.message || "Failed to update organization");
                return;
            }

            toast.success("Organization updated successfully");
            invalidateDetail(params.id);
            router.refresh();
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await authClient.organization.delete({
                organizationId: params.id,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Organization deleted");
            router.push("/organizations");
        } catch (error) {
            toast.error("Failed to delete organization");
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setDeleteConfirmation("");
        }
    };

    const handleTransferOwnership = async () => {
        if (!selectedMemberId) {
            toast.error("Please select a member to transfer ownership to");
            return;
        }

        const selectedMember = members.find(m => m.id === selectedMemberId);
        if (!selectedMember) return;

        setIsTransferring(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/${params.id}/transfer`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newOwnerId: selectedMember.userId }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.message || "Failed to initiate transfer");
                return;
            }

            toast.success(result.message);
            setIsTransferDialogOpen(false);
            setSelectedMemberId("");

            // Refresh pending transfer
            const transferResponse = await fetch(`${API_BASE}/api/organizations/${params.id}/transfer`, {
                credentials: "include",
            });
            if (transferResponse.ok) {
                const transfer = await transferResponse.json();
                setPendingTransfer(transfer);
            }
        } catch (error) {
            toast.error("Failed to initiate transfer");
        } finally {
            setIsTransferring(false);
        }
    };

    const handleCancelTransfer = async () => {
        if (!pendingTransfer) return;

        try {
            const response = await fetch(`${API_BASE}/api/organizations/transfer/${pendingTransfer.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const result = await response.json();
                toast.error(result.message || "Failed to cancel transfer");
                return;
            }

            toast.success("Transfer cancelled");
            setPendingTransfer(null);
        } catch (error) {
            toast.error("Failed to cancel transfer");
        }
    };

    const isOwner = currentUserRole === "owner";
    const eligibleMembers = members.filter(m => m.role !== "owner");

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your organization profile and preferences
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                        Update your organization's name and identifier.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                placeholder="Acme Corp"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                placeholder="acme-corp"
                                {...register("slug")}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                The unique identifier used in your organization's URL.
                            </p>
                            {errors.slug && (
                                <p className="text-sm text-destructive">{errors.slug.message}</p>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Ownership Transfer Section - Only visible to owners */}
            {isOwner && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Ownership Transfer
                        </CardTitle>
                        <CardDescription>
                            Transfer ownership of this organization to another member.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingTransfer ? (
                            <div className="p-4 border rounded-lg bg-warning/10 border-warning/30">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className="bg-warning/20 text-warning">
                                                Pending Transfer
                                            </Badge>
                                        </div>
                                        <p className="text-sm">
                                            Ownership transfer to{" "}
                                            <strong>
                                                {pendingTransfer.toUser?.name || pendingTransfer.toUser?.email || "Unknown user"}
                                            </strong>{" "}
                                            is pending confirmation.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Expires: {new Date(pendingTransfer.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleCancelTransfer}>
                                        Cancel Transfer
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <div className="font-medium flex items-center gap-2">
                                        <ArrowRightLeft className="h-4 w-4" />
                                        Transfer Ownership
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Hand over ownership to another member. You will be demoted to admin.
                                    </div>
                                </div>
                                <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" disabled={eligibleMembers.length === 0}>
                                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                                            Transfer
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Transfer Organization Ownership</DialogTitle>
                                            <DialogDescription>
                                                Select a member to become the new owner. They will receive an email to confirm.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Select New Owner</Label>
                                                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose a member..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {eligibleMembers.map((member) => (
                                                            <SelectItem key={member.id} value={member.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                                    <span>{member.user.name || member.user.email}</span>
                                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                                        {member.role}
                                                                    </Badge>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="p-3 bg-muted rounded-md text-sm">
                                                <p className="font-medium mb-1">What happens after transfer?</p>
                                                <ul className="text-muted-foreground space-y-1">
                                                    <li>• The new owner will receive an email to confirm</li>
                                                    <li>• Once confirmed, you will be demoted to admin</li>
                                                    <li>• The transfer expires after 7 days if not confirmed</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleTransferOwnership} disabled={isTransferring || !selectedMemberId}>
                                                {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Initiate Transfer
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                        {eligibleMembers.length === 0 && !pendingTransfer && (
                            <p className="text-sm text-muted-foreground">
                                Add members to your organization before transferring ownership.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="border-destructive/20">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions for your organization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div>
                            <div className="font-medium">Delete Organization</div>
                            <div className="text-sm text-muted-foreground">
                                Permanently remove this organization and all its data.
                            </div>
                        </div>
                        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setDeleteConfirmation("");
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Organization
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="text-destructive">Delete Organization</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete the organization and all associated data.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                        <p className="text-sm text-destructive font-medium">Warning: This will delete:</p>
                                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                                            <li>• All organization members and their roles</li>
                                            <li>• All teams and team assignments</li>
                                            <li>• All organization settings and data</li>
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="delete-confirm">Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
                                        <Input
                                            id="delete-confirm"
                                            placeholder="Type DELETE to confirm"
                                            value={deleteConfirmation}
                                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={isDeleting || deleteConfirmation !== "DELETE"}
                                    >
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Forever
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
