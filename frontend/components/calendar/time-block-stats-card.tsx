"use client";

import { useMemo } from "react";
import { Brain, Users, Coffee, Briefcase, Clock, TrendingUp, Target } from "lucide-react";
import { EnhancedTimeBlock, TimeBlockStats } from "@/lib/daymark-api";

interface TimeBlockStatsCardProps {
    stats: TimeBlockStats;
    showTrends?: boolean;
}

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    focus: { icon: Brain, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
    "deep-work": { icon: Target, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30" },
    meeting: { icon: Users, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
    break: { icon: Coffee, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
    personal: { icon: Briefcase, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
};

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function TimeBlockStatsCard({ stats, showTrends }: TimeBlockStatsCardProps) {
    const focusPercentage = useMemo(() => {
        if (stats.totalBlocks === 0) return 0;
        return Math.round((stats.focusBlocks / stats.totalBlocks) * 100);
    }, [stats]);

    const meetingPercentage = useMemo(() => {
        if (stats.totalBlocks === 0) return 0;
        return Math.round((stats.meetingBlocks / stats.totalBlocks) * 100);
    }, [stats]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Time Block Summary
            </h3>

            {/* Focus vs Meeting Ratio */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Focus vs Meetings</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {focusPercentage}% focus
                    </span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                    <div
                        className="bg-purple-500 transition-all duration-300"
                        style={{ width: `${focusPercentage}%` }}
                    />
                    <div
                        className="bg-blue-500 transition-all duration-300"
                        style={{ width: `${meetingPercentage}%` }}
                    />
                    <div
                        className="bg-gray-300 dark:bg-gray-600"
                        style={{ width: `${100 - focusPercentage - meetingPercentage}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-purple-500 rounded-full" />
                        Focus
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        Meetings
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                        Other
                    </span>
                </div>
            </div>

            {/* Time Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Focus Time</span>
                    </div>
                    <p className="text-xl font-semibold text-purple-900 dark:text-purple-100">
                        {formatDuration(stats.totalFocusMinutes || 0)}
                    </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Meeting Time</span>
                    </div>
                    <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                        {formatDuration(stats.totalMeetingMinutes || 0)}
                    </p>
                </div>
            </div>

            {/* Session Completion */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            Sessions Completed
                        </span>
                    </div>
                    <span className="text-lg font-semibold text-green-900 dark:text-green-100">
                        {stats.completedSessions || 0}
                    </span>
                </div>
            </div>

            {/* Block Count */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total blocks</span>
                    <span className="font-medium text-gray-900 dark:text-white">{stats.totalBlocks}</span>
                </div>
            </div>
        </div>
    );
}

// Mini stats for calendar header
export function MiniStatsIndicator({ stats }: { stats: TimeBlockStats }) {
    const focusPercentage = stats.totalBlocks > 0
        ? Math.round((stats.focusBlocks / stats.totalBlocks) * 100)
        : 0;

    return (
        <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">{focusPercentage}%</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                    {formatDuration(stats.totalFocusMinutes || 0)}
                </span>
            </div>
        </div>
    );
}

export default TimeBlockStatsCard;
