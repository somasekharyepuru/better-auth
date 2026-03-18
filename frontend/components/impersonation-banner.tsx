"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
    const [isImpersonating, setIsImpersonating] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        authClient.getSession().then(({ data }) => {
            setIsImpersonating(!!(data as { session?: { impersonatedBy?: string } })?.session?.impersonatedBy);
        });
    }, []);

    const handleStop = async () => {
        setLoading(true);
        await authClient.admin.stopImpersonating();
        window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000";
    };

    if (!isImpersonating) return null;

    return (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span>You are impersonating a user</span>
            <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={loading}
                className="ml-2"
            >
                {loading ? "Stopping..." : "Stop Impersonating"}
            </Button>
        </div>
    );
}
