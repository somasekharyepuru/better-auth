"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { Spinner } from "@/components/ui/spinner";
import { Timer, Grid3X3, BookOpen, ChevronLeft } from "lucide-react";

const TOOLS = [
    {
        key: "pomodoro",
        name: "Pomodoro Timer",
        description: "Focus timer for deep work sessions",
        icon: Timer,
        href: "/tools/pomodoro",
        settingsKey: "pomodoroEnabled" as const,
    },
    {
        key: "matrix",
        name: "Eisenhower Matrix",
        description: "Prioritize by urgency and importance",
        icon: Grid3X3,
        href: "/tools/matrix",
        settingsKey: "eisenhowerEnabled" as const,
    },
    {
        key: "decisions",
        name: "Decision Log",
        description: "Track important decisions and context",
        icon: BookOpen,
        href: "/tools/decisions",
        settingsKey: "decisionLogEnabled" as const,
    },
];

export default function ToolsPage() {
    const router = useRouter();
    const { settings, isLoading: settingsLoading } = useSettings();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const sessionData = await authClient.getSession();
                if (!sessionData?.data) {
                    router.push("/login");
                    return;
                }
                setIsAuthenticated(true);
            } catch {
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    if (isLoading || settingsLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spinner size="lg" />
            </div>
        );
    }

    // Filter tools based on settings
    const enabledTools = TOOLS.filter((tool) => settings[tool.settingsKey]);

    return (
        <div className="bg-premium">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push("/")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl text-heading">Tools</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Productivity utilities</p>
                    </div>
                </div>

                {/* Tools Grid */}
                {enabledTools.length === 0 ? (
                    <div className="card-subtle text-center py-16">
                        <p className="text-muted">No tools enabled</p>
                        <button
                            onClick={() => router.push("/profile?tab=preferences")}
                            className="mt-4 text-body hover:text-gray-900 underline underline-offset-2"
                        >
                            Enable tools in preferences
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {enabledTools.map((tool) => (
                            <button
                                key={tool.key}
                                onClick={() => router.push(tool.href)}
                                className="card-premium text-left group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-gray-100/80 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-gray-200/80 dark:group-hover:bg-gray-700 transition-colors">
                                    <tool.icon className="w-6 h-6 text-body dark:text-gray-300" />
                                </div>
                                <h3 className="text-lg text-subheading mb-1">
                                    {tool.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
