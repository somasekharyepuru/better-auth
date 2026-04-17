"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { calendarApi } from "@/lib/daymark-api";
import { Spinner } from "@/components/ui/spinner";

function CalendarCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const state = searchParams.get("state");
            const errorParam = searchParams.get("error");

            if (errorParam) {
                setStatus("error");
                setError(errorParam.replace(/_/g, " "));
                setTimeout(() => {
                    router.push(`/settings/calendars?error=${errorParam}`);
                }, 2000);
                return;
            }

            if (!code || !state) {
                setStatus("error");
                setError("Missing authorization code or state");
                setTimeout(() => {
                    router.push("/settings/calendars?error=missing_parameters");
                }, 2000);
                return;
            }

            try {
                // Complete the OAuth flow by sending the code to the backend
                const redirectUri = `${window.location.origin}/settings/calendars/callback`;
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002"}/api/calendar/connections/callback`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ code, state, redirectUri }),
                    }
                );

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || "Failed to complete connection");
                }

                setStatus("success");
                // Redirect to calendars page with success message
                router.push("/settings/calendars?success=true&provider=GOOGLE");
            } catch (err) {
                console.error("OAuth callback error:", err);
                setStatus("error");
                setError(err instanceof Error ? err.message : "Connection failed");
                setTimeout(() => {
                    router.push(`/settings/calendars?error=connection_failed`);
                }, 2000);
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="text-center">
                {status === "processing" && (
                    <>
                        <Spinner size="lg" />
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                            Completing calendar connection...
                        </p>
                    </>
                )}
                {status === "success" && (
                    <>
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <svg
                                className="w-8 h-8 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Calendar connected! Redirecting...
                        </p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <p className="text-red-600 dark:text-red-400 mb-2">
                            Connection failed
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {error || "An error occurred"}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function CalendarCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                    <Spinner size="lg" />
                </div>
            }
        >
            <CalendarCallbackContent />
        </Suspense>
    );
}
