"use client";

import { useState } from "react";
import { Brain, Play, Pause, Target, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedTimeBlock, focusSessionsApi, FocusSession } from "@/lib/daymark-api";

interface FocusBlockCardProps {
    timeBlock: EnhancedTimeBlock;
    onStartSession: (timeBlockId: string) => Promise<void>;
    onViewDetails?: () => void;
    compact?: boolean;
}

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    focus: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        border: "border-purple-300 dark:border-purple-700",
        text: "text-purple-700 dark:text-purple-300",
        icon: "text-purple-600 dark:text-purple-400",
    },
    "deep-work": {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        border: "border-indigo-300 dark:border-indigo-700",
        text: "text-indigo-700 dark:text-indigo-300",
        icon: "text-indigo-600 dark:text-indigo-400",
    },
    meeting: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        border: "border-blue-300 dark:border-blue-700",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
    },
    break: {
        bg: "bg-green-100 dark:bg-green-900/30",
        border: "border-green-300 dark:border-green-700",
        text: "text-green-700 dark:text-green-300",
        icon: "text-green-600 dark:text-green-400",
    },
    personal: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        border: "border-orange-300 dark:border-orange-700",
        text: "text-orange-700 dark:text-orange-300",
        icon: "text-orange-600 dark:text-orange-400",
    },
};

function formatTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function getDurationMinutes(start: Date | string, end: Date | string): number {
    const s = typeof start === "string" ? new Date(start) : start;
    const e = typeof end === "string" ? new Date(end) : end;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60));
}

export function FocusBlockCard({
    timeBlock,
    onStartSession,
    onViewDetails,
    compact = false,
}: FocusBlockCardProps) {
    const [isStarting, setIsStarting] = useState(false);

    const colors = CATEGORY_COLORS[timeBlock.category] || CATEGORY_COLORS.focus;
    const duration = getDurationMinutes(timeBlock.startTime, timeBlock.endTime);
    const isFocusable = timeBlock.category === "focus" || timeBlock.category === "deep-work";

    // Check if there's an active or completed session
    const hasCompletedSession = timeBlock.focusSessions?.some(s => s.completed);
    const hasActiveSession = timeBlock.focusSessions?.some(s => !s.endedAt);

    const handleStartSession = async () => {
        setIsStarting(true);
        try {
            await onStartSession(timeBlock.id);
        } finally {
            setIsStarting(false);
        }
    };

    if (compact) {
        return (
            <div
                className={`${colors.bg} ${colors.border} border-l-4 rounded-r px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={onViewDetails}
            >
                <div className="flex items-center gap-1">
                    {isFocusable && <Brain className={`w-3 h-3 ${colors.icon}`} />}
                    <span className={`text-xs font-medium ${colors.text} truncate`}>
                        {timeBlock.title}
                    </span>
                    {hasCompletedSession && (
                        <CheckCircle className="w-3 h-3 text-green-500 ml-auto flex-shrink-0" />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-all hover:shadow-md`}
            onClick={onViewDetails}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    {isFocusable ? (
                        <Brain className={`w-5 h-5 ${colors.icon}`} />
                    ) : (
                        <Clock className={`w-5 h-5 ${colors.icon}`} />
                    )}
                    <span className={`text-xs font-medium ${colors.text} uppercase tracking-wide`}>
                        {timeBlock.category.replace("-", " ")}
                    </span>
                </div>
                {hasCompletedSession && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Done</span>
                    </div>
                )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {timeBlock.title}
            </h3>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Clock className="w-4 h-4" />
                <span>
                    {formatTime(timeBlock.startTime)} - {formatTime(timeBlock.endTime)}
                </span>
                <span className="text-gray-400 dark:text-gray-500">({duration} min)</span>
            </div>

            {/* Linked Priority */}
            {timeBlock.priority && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Target className="w-4 h-4" />
                    <span className="truncate">{timeBlock.priority.title}</span>
                    {timeBlock.priority.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                </div>
            )}

            {/* Session Stats */}
            {timeBlock.focusSessions && timeBlock.focusSessions.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {timeBlock.focusSessions.filter(s => s.completed).length} session
                    {timeBlock.focusSessions.filter(s => s.completed).length !== 1 ? "s" : ""} completed
                </div>
            )}

            {/* Actions */}
            {isFocusable && !hasActiveSession && (
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleStartSession();
                    }}
                    disabled={isStarting}
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Play className="w-4 h-4 mr-2" />
                    {isStarting ? "Starting..." : "Start Focus Session"}
                </Button>
            )}

            {hasActiveSession && (
                <div className="flex items-center gap-2 p-2 bg-purple-600 text-white rounded-lg">
                    <div className="animate-pulse w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm font-medium">Session in progress</span>
                </div>
            )}
        </div>
    );
}

// Active Session Indicator - shows in calendar header when a session is active
export function ActiveSessionIndicator({
    session,
    onStop,
}: {
    session: FocusSession;
    onStop: () => void;
}) {
    const [elapsed, setElapsed] = useState(0);

    // Update elapsed time every second
    useState(() => {
        const interval = setInterval(() => {
            const start = new Date(session.startedAt);
            setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    });

    const formatElapsed = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white rounded-2xl shadow-lg p-4 flex items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Brain className="w-6 h-6" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div>
                    <div className="font-semibold">
                        {session.timeBlock?.title || "Focus Session"}
                    </div>
                    <div className="text-sm text-purple-200">
                        {formatElapsed(elapsed)} elapsed
                    </div>
                </div>
            </div>
            <Button
                onClick={onStop}
                variant="outline"
                size="sm"
                className="border-white text-white hover:bg-purple-500"
            >
                <Pause className="w-4 h-4 mr-1" />
                Stop
            </Button>
        </div>
    );
}

// Category badge for event cards
export function CategoryBadge({ category }: { category: string }) {
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.personal;

    return (
        <span className={`${colors.bg} ${colors.text} text-xs font-medium px-2 py-0.5 rounded-full`}>
            {category.replace("-", " ")}
        </span>
    );
}

export default FocusBlockCard;
