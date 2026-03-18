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
