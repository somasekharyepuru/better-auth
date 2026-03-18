"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect old settings page to profile preferences tab
export default function SettingsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/profile?tab=preferences");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
            <p className="text-gray-500">Redirecting to preferences...</p>
        </div>
    );
}
