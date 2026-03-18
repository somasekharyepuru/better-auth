import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

export interface Member {
    id: string;
    userId: string;
    role: string;
    createdAt: string | Date;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
}

export interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string | Date;
}

export interface Team {
    id: string;
    name: string;
    createdAt: string | Date;
    members?: { id: string; userId: string }[];
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: string | Date;
    memberCount: number;
    members: Member[];
    invitations: Invitation[];
    teams: Team[];
    stats?: {
        memberCount: number;
        teamCount: number;
        pendingInvites: number;
    };
    banned: boolean;
    banReason?: string | null;
    bannedAt?: string | Date;
}

export const ROLE_INFO: Record<string, { label: string; color: string }> = {
    owner: { label: "Owner", color: "bg-warning/20 text-warning border-warning/30" },
    admin: { label: "Admin", color: "bg-primary/20 text-primary border-primary/30" },
    manager: { label: "Manager", color: "bg-accent/20 text-accent-foreground border-accent/30" },
    member: { label: "Member", color: "bg-success/20 text-success border-success/30" },
    viewer: { label: "Viewer", color: "bg-muted text-muted-foreground border-border" },
};

const CUSTOM_ROLE_STYLE = {
    color: "bg-violet-500/20 text-violet-700 border-violet-500/30 dark:text-violet-400",
};

function formatRoleName(role: string): string {
    return role
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export function getRoleInfo(role: string): { label: string; color: string } {
    if (ROLE_INFO[role]) return ROLE_INFO[role];
    return {
        label: formatRoleName(role),
        ...CUSTOM_ROLE_STYLE,
    };
}

export function useOrganization(refetchOnMount = true) {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrg = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/organizations/${params.id}`, {
                credentials: "include",
            });

            if (!response.ok) {
                router.push("/organizations");
                return null;
            }

            const data = await response.json();
            setOrganization(data);
            return data;
        } catch (error) {
            console.error("Failed to fetch organization:", error);
            toast.error("Failed to load organization");
            router.push("/organizations");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [params.id, router]);

    useEffect(() => {
        if (refetchOnMount) {
            fetchOrg();
        }
    }, [fetchOrg, refetchOnMount]);

    return { organization, isLoading, fetchOrg, orgId: params.id };
}

export function useOrganizationActions(orgId: string, onSuccess?: () => void) {
    const [actionLoading, setActionLoading] = useState(false);

    const cancelInvitation = async (invitationId: string) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/invitations/${invitationId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to cancel invitation");
            }

            toast.success("Invitation cancelled");
            onSuccess?.();
            return true;
        } catch (error) {
            console.error("Failed to cancel invitation:", error);
            toast.error("Failed to cancel invitation");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    const resendInvitation = async (invitationId: string) => {
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/organizations/invitations/${invitationId}/resend`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Failed to resend invitation");
            }

            toast.success("Invitation resent");
            return true;
        } catch (error) {
            console.error("Failed to resend invitation:", error);
            toast.error("Failed to resend invitation");
            return false;
        } finally {
            setActionLoading(false);
        }
    };

    return { actionLoading, cancelInvitation, resendInvitation };
}
