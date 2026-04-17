import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import type { DashboardStats, UserStats, AuditLog } from "./types";

const baseURL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

export const authClient = createAuthClient({
    baseURL,
    plugins: [adminClient(), organizationClient({
        teams: {
            enabled: true,
        },
    })],
});

interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    cookies?: string;
}

export class APIError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        message: string,
        public body?: unknown
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export async function fetchAPI<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, cookies: cookieHeader } = options;

    const response = await fetch(`${baseURL}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        credentials: "include",
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
        let errorBody: unknown;
        try {
            errorBody = await response.json();
        } catch {
            try {
                errorBody = await response.text();
            } catch {
                errorBody = undefined;
            }
        }

        const message = typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody
            ? (errorBody as { message: string }).message
            : typeof errorBody === 'string'
            ? errorBody
            : `HTTP ${response.status}: ${response.statusText}`;

        throw new APIError(response.status, response.statusText, message, errorBody);
    }

    return response.json();
}

export const adminApi = {
    listUsers: (options?: {
        limit?: number;
        offset?: number;
        searchField?: "email" | "name";
        searchValue?: string;
        searchOperator?: "contains" | "starts_with" | "ends_with";
        sortBy?: string;
        sortDirection?: "asc" | "desc";
        filterField?: string;
        filterValue?: string;
        filterOperator?: "eq" | "ne" | "contains";
    }) => authClient.admin.listUsers({ query: options || {} }),

    banUser: (userId: string, banReason?: string, banExpiresIn?: number) =>
        authClient.admin.banUser({ userId, banReason, banExpiresIn }),

    unbanUser: (userId: string) => authClient.admin.unbanUser({ userId }),

    setRole: (userId: string, role: "user" | "admin") =>
        authClient.admin.setRole({ userId, role }),

    setPassword: (userId: string, newPassword: string) =>
        authClient.admin.setUserPassword({ userId, newPassword }),

    removeUser: (userId: string) => authClient.admin.removeUser({ userId }),

    impersonateUser: (userId: string) => authClient.admin.impersonateUser({ userId }),

    stopImpersonating: () => authClient.admin.stopImpersonating(),

    listUserSessions: (userId: string) => authClient.admin.listUserSessions({ userId }),

    revokeSession: (sessionToken: string) => authClient.admin.revokeUserSession({ sessionToken }),

    revokeAllSessions: (userId: string) => authClient.admin.revokeUserSessions({ userId }),

    getDashboardStats: () => fetchAPI<DashboardStats>("/api/admin/stats/dashboard"),

    getUserStats: () => fetchAPI<UserStats>("/api/admin/stats/users"),

    createUser: (data: {
        email: string;
        name: string;
        role?: "user" | "admin";
        forcePasswordChange?: boolean;
    }) => fetchAPI("/api/admin/create-user", { method: "POST", body: data }),
};

interface AuditListOptions {
    limit?: number;
    offset?: number;
    userId?: string;
    userIds?: string;
    action?: string;
    actions?: string;
    resourceType?: string;
    resourceTypes?: string;
    resourceId?: string;
    organizationId?: string;
    sessionId?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
    [key: string]: string | number | boolean | undefined;
}

function buildSearchParams(options: AuditListOptions): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options)) {
        if (value !== undefined) {
            params.set(key, String(value));
        }
    }
    return params.toString();
}

interface AuditLogsResponse {
    logs: AuditLog[];
    total: number;
    limit: number;
    offset: number;
}

interface AuditStatsResponse {
    total: number;
    success: number;
    failed: number;
    today: number;
    thisWeek: number;
}

export const auditApi = {
    listLogs: (options?: AuditListOptions) =>
        fetchAPI<AuditLogsResponse>(
            `/api/audit/logs${options ? `?${buildSearchParams(options)}` : ""}`
        ),

    getUserLogs: (userId: string, options?: { limit?: number; offset?: number }) =>
        fetchAPI<AuditLogsResponse>(
            `/api/audit/logs/user/${userId}${options ? `?${buildSearchParams(options)}` : ""}`
        ),

    getOrgLogs: (orgId: string, options?: { limit?: number; offset?: number }) =>
        fetchAPI<AuditLogsResponse>(
            `/api/audit/logs/org/${orgId}${options ? `?${buildSearchParams(options)}` : ""}`
        ),

    getLogsByAction: (action: string, options?: { limit?: number; offset?: number }) =>
        fetchAPI<AuditLogsResponse>(
            `/api/audit/logs/action/${action}${options ? `?${buildSearchParams(options)}` : ""}`
        ),

    getLog: (logId: string) => fetchAPI<AuditLog>(`/api/audit/logs/${logId}`),

    getStats: () => fetchAPI<AuditStatsResponse>('/api/audit/stats'),
};
