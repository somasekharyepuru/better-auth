"use client";

import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Check, Wifi, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calendarApi, CalendarConnection } from "@/lib/daymark-api";

interface SyncStatusBannerProps {
    connections: CalendarConnection[];
    onRetrySync: (connectionId: string) => Promise<void>;
    onRefreshConnections: () => Promise<void>;
}

type SyncStatus = "connected" | "syncing" | "error" | "disconnected";

function getConnectionStatus(connection: CalendarConnection): SyncStatus {
    if (connection.status === "ACTIVE") {
        return "connected";
    }
    if (connection.status === "SYNCING" || connection.status === "INITIAL_SYNC") {
        return "syncing";
    }
    if (connection.status === "ERROR" || connection.status === "TOKEN_EXPIRED") {
        return "error";
    }
    return "disconnected";
}

function formatLastSync(date: string | undefined): string {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

export function SyncStatusBanner({
    connections,
    onRetrySync,
    onRefreshConnections,
}: SyncStatusBannerProps) {
    const [isRetrying, setIsRetrying] = useState<string | null>(null);

    const errorConnections = connections.filter(
        c => c.status === "ERROR" || c.status === "TOKEN_EXPIRED"
    );
    const disconnectedConnections = connections.filter(
        c => c.status === "DISCONNECTED"
    );

    const hasIssues = errorConnections.length > 0 || disconnectedConnections.length > 0;

    if (!hasIssues && connections.length === 0) {
        // No connections at all - show setup prompt
        return (
            <div className="mx-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                        <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                            Connect your calendars
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Sync Google, Microsoft, or Apple calendars to see all your events in one place.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.location.href = "/settings/calendars"}
                    >
                        Connect Calendar
                    </Button>
                </div>
            </div>
        );
    }

    if (!hasIssues) {
        return null; // All good, no banner needed
    }

    const handleRetry = async (connectionId: string) => {
        setIsRetrying(connectionId);
        try {
            await onRetrySync(connectionId);
        } finally {
            setIsRetrying(null);
        }
    };

    return (
        <div className="mx-4 mb-4 space-y-2">
            {errorConnections.map((conn) => (
                <div
                    key={conn.id}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
                >
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-full">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            {conn.provider} calendar sync failed
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 truncate">
                            {conn.providerEmail} • Last sync: {formatLastSync(conn.lastSyncAt ?? undefined)}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(conn.id)}
                        disabled={isRetrying === conn.id}
                        className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                        {isRetrying === conn.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Retry
                            </>
                        )}
                    </Button>
                </div>
            ))}

            {disconnectedConnections.map((conn) => (
                <div
                    key={conn.id}
                    className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3"
                >
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                        <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            {conn.provider} calendar disconnected
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            {conn.providerEmail} • Reconnect to resume syncing
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = "/settings/calendars"}
                        className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                        Reconnect
                    </Button>
                </div>
            ))}
        </div>
    );
}

// Compact sync status indicator for header
export function SyncStatusIndicator({
    connections,
}: {
    connections: CalendarConnection[];
}) {
    const allHealthy = connections.every(c => c.status === "ACTIVE");
    const hasErrors = connections.some(c => c.status === "ERROR" || c.status === "TOKEN_EXPIRED");
    const isSyncing = connections.some(c => c.status === "SYNCING");

    if (connections.length === 0) return null;

    if (isSyncing) {
        return (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-xs">Syncing...</span>
            </div>
        );
    }

    if (hasErrors) {
        return (
            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Sync issues</span>
            </div>
        );
    }

    if (allHealthy) {
        return (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-xs">All synced</span>
            </div>
        );
    }

    return null;
}

export default SyncStatusBanner;
