"use client";

import { useState, useEffect, useCallback } from "react";
import { Brain, Pause, Play, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FocusSession, focusSessionsApi } from "@/lib/daymark-api";

interface ActiveSessionIndicatorProps {
    session: FocusSession | null;
    onEndSession: (sessionId: string, completed: boolean) => Promise<void>;
    onRefresh: () => void;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ActiveSessionIndicator({
    session,
    onEndSession,
    onRefresh,
}: ActiveSessionIndicatorProps) {
    const [elapsed, setElapsed] = useState(0);
    const [isEnding, setIsEnding] = useState(false);

    // Calculate elapsed time from session start
    useEffect(() => {
        if (!session) {
            setElapsed(0);
            return;
        }

        const startTime = new Date(session.startedAt).getTime();

        const updateElapsed = () => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);

        return () => clearInterval(interval);
    }, [session]);

    const handleEndSession = async (completed: boolean) => {
        if (!session) return;
        setIsEnding(true);
        try {
            await onEndSession(session.id, completed);
            onRefresh();
        } finally {
            setIsEnding(false);
        }
    };

    if (!session) return null;

    const targetDuration = session.targetDuration || 25 * 60; // Default 25 min
    const progress = Math.min((elapsed / targetDuration) * 100, 100);
    const remaining = Math.max(targetDuration - elapsed, 0);
    const isComplete = elapsed >= targetDuration;

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 rounded-2xl shadow-2xl overflow-hidden ${isComplete
                    ? "bg-green-600"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600"
                }`}
            style={{ width: "320px" }}
        >
            {/* Progress bar */}
            <div
                className="h-1 bg-white/30 transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
            />

            <div className="p-4 text-white">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Brain className="w-8 h-8" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        </div>
                        <div>
                            <p className="font-semibold truncate max-w-[180px]">
                                {session.timeBlock?.title || "Focus Session"}
                            </p>
                            <p className="text-sm opacity-80">
                                {session.sessionType || "Pomodoro"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleEndSession(false)}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        title="Cancel session"
                        disabled={isEnding}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Timer display */}
                <div className="text-center mb-4">
                    <div className={`text-4xl font-mono font-bold ${isComplete ? "animate-pulse" : ""}`}>
                        {isComplete ? formatTime(elapsed) : formatTime(remaining)}
                    </div>
                    <p className="text-sm opacity-70 mt-1">
                        {isComplete ? "Session complete!" : "Time remaining"}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {isComplete ? (
                        <Button
                            onClick={() => handleEndSession(true)}
                            disabled={isEnding}
                            className="flex-1 bg-white text-green-600 hover:bg-white/90"
                        >
                            <SkipForward className="w-4 h-4 mr-2" />
                            {isEnding ? "Completing..." : "Complete Session"}
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={() => handleEndSession(false)}
                                disabled={isEnding}
                                variant="outline"
                                className="flex-1 border-white/40 text-white hover:bg-white/20"
                            >
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                            </Button>
                            <Button
                                onClick={() => handleEndSession(true)}
                                disabled={isEnding}
                                className="flex-1 bg-white/20 text-white hover:bg-white/30"
                            >
                                <SkipForward className="w-4 h-4 mr-2" />
                                Skip
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Compact version for calendar grid cells
export function SessionProgressBadge({
    session,
    inline = false,
}: {
    session: FocusSession;
    inline?: boolean;
}) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const startTime = new Date(session.startedAt).getTime();
        const targetDuration = (session.targetDuration || 25 * 60) * 1000;

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            setProgress(Math.min((elapsed / targetDuration) * 100, 100));
        };

        updateProgress();
        const interval = setInterval(updateProgress, 5000);

        return () => clearInterval(interval);
    }, [session]);

    if (inline) {
        return (
            <div className="flex items-center gap-1">
                <div className="relative w-4 h-4">
                    <svg className="w-4 h-4 -rotate-90">
                        <circle
                            cx="8"
                            cy="8"
                            r="6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-purple-200 dark:text-purple-900"
                        />
                        <circle
                            cx="8"
                            cy="8"
                            r="6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray={`${progress * 0.377} 100`}
                            className="text-purple-600 dark:text-purple-400"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-0 left-0 right-0 h-1 bg-purple-200 dark:bg-purple-900 overflow-hidden rounded-t">
            <div
                className="h-full bg-purple-600 dark:bg-purple-400 transition-all duration-1000"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

export default ActiveSessionIndicator;
