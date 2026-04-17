export type UserRole = "owner" | "admin" | "manager" | "member" | "viewer";

export const ADMIN_ROLE = "admin" as const;

export interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    twoFactorEnabled?: boolean;
    role?: UserRole | string | null;
    createdAt: Date;
    updatedAt: Date;
    banned?: boolean | null;
    banReason?: string | null;
    banExpires?: Date | null;
}

export interface AuthSession {
    user: User;
    session: {
        id: string;
        activeOrganizationId: string | null;
        expiresAt: Date;
        token: string;
        userId: string;
    } | null;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    metadata?: string | null;
    createdAt: Date;
}

export interface OrganizationWithDetails extends Organization {
    members?: Member[];
    invitations?: Invitation[];
    teams?: Team[];
}

export interface Member {
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
}

export interface Invitation {
    id: string;
    email: string;
    role: string;
    status: "pending" | "accepted" | "rejected" | "canceled";
    createdAt: Date;
    expiresAt: Date;
}

export interface Team {
    id: string;
    name: string;
    organizationId: string;
    createdAt: Date;
    members?: { id: string; teamId: string; userId: string; createdAt: Date }[];
}

export interface DashboardStats {
    totalUsers: number;
    adminUsers: number;
    bannedUsers: number;
    newThisWeek: number;
}

export interface UserStats {
    totalUsers: number;
    adminUsers: number;
    bannedUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    activeUsers: number;
    newThisMonth: number;
}

export interface AuditLog {
    id: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    userId: string;
    organizationId?: string;
    sessionId?: string;
    details?: Record<string, unknown>;
    errorMessage?: string;
    user?: { id: string; name: string | null; email: string };
}
