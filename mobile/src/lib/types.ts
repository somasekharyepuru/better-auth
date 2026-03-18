/**
 * Type definitions for mobile auth SDK
 * Matches frontend types for consistency
 */

import type { Session } from "better-auth/types";

export type UserRole = "owner" | "admin" | "manager" | "member" | "viewer";

export interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    twoFactorEnabled: boolean;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
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

export interface AuthError {
    message: string;
    code?: string;
    status?: number;
}

export interface SessionInfo {
    id: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    isActive: boolean;
}

export interface AuditLog {
    id: string;
    action: string;
    userId: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}

export interface TransferInfo {
    id: string;
    organization: {
        id: string;
        name: string;
        slug: string;
    };
    fromUser: {
        id: string;
        name: string | null;
        email: string;
    };
    toUser: {
        id: string;
        name: string | null;
        email: string;
    };
    status: string;
    expiresAt: string;
    isExpired: boolean;
}

export interface OrgBanStatus {
    isBanned: boolean;
    reason?: string;
}
