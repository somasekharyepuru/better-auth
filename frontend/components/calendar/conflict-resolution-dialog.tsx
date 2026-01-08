"use client";

import { useState } from "react";
import { AlertTriangle, Clock, ChevronRight, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusyTimeSlot } from "@/lib/daymark-api";

interface ConflictResolutionDialogProps {
    conflicts: BusyTimeSlot[];
    proposedStartTime: string;
    proposedEndTime: string;
    onResolve: (action: 'reschedule' | 'override' | 'drop', newStartTime?: string, newEndTime?: string) => void;
    onClose: () => void;
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

// Helper to find the next free time slot
function findNextFreeSlot(
    conflicts: BusyTimeSlot[],
    desiredStart: Date,
    durationMinutes: number
): { start: Date; end: Date } | null {
    // Sort conflicts by start time
    const sortedConflicts = [...conflicts].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Try to find a gap after each conflict
    for (let i = 0; i < sortedConflicts.length; i++) {
        const conflictEnd = new Date(sortedConflicts[i].endTime);
        const nextConflictStart = sortedConflicts[i + 1]
            ? new Date(sortedConflicts[i + 1].startTime)
            : null;

        const proposedStart = conflictEnd;
        const proposedEnd = new Date(proposedStart.getTime() + durationMinutes * 60 * 1000);

        // Check if this slot fits before the next conflict (or if there's no next conflict)
        if (!nextConflictStart || proposedEnd <= nextConflictStart) {
            // Make sure we're not scheduling too late in the day (after 8 PM)
            if (proposedEnd.getHours() <= 20) {
                return { start: proposedStart, end: proposedEnd };
            }
        }
    }

    // If no slot today, suggest tomorrow at the same time as desired
    const tomorrow = new Date(desiredStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(desiredStart.getHours(), desiredStart.getMinutes(), 0, 0);
    const tomorrowEnd = new Date(tomorrow.getTime() + durationMinutes * 60 * 1000);

    return { start: tomorrow, end: tomorrowEnd };
}

export function ConflictResolutionDialog({
    conflicts,
    proposedStartTime,
    proposedEndTime,
    onResolve,
    onClose,
}: ConflictResolutionDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState<'reschedule' | 'override' | 'drop' | null>(null);

    const proposedStart = new Date(proposedStartTime);
    const proposedEnd = new Date(proposedEndTime);
    const durationMinutes = (proposedEnd.getTime() - proposedStart.getTime()) / (1000 * 60);

    const suggestedSlot = findNextFreeSlot(conflicts, proposedStart, durationMinutes);

    const handleAction = (action: 'reschedule' | 'override' | 'drop') => {
        setIsLoading(true);
        setSelectedAction(action);

        if (action === 'reschedule' && suggestedSlot) {
            onResolve(action, suggestedSlot.start.toISOString(), suggestedSlot.end.toISOString());
        } else {
            onResolve(action);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Time Conflict Detected
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This time overlaps with {conflicts.length} existing event{conflicts.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Conflict List */}
                <div className="p-4 space-y-3 max-h-[200px] overflow-auto">
                    {conflicts.map((conflict) => (
                        <div
                            key={conflict.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: conflict.sourceColor || "#6B7280" }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {conflict.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}
                                </p>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {conflict.sourceName}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {/* Reschedule Suggestion */}
                    {suggestedSlot && (
                        <button
                            onClick={() => handleAction('reschedule')}
                            disabled={isLoading}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedAction === 'reschedule'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                                } disabled:opacity-50`}
                        >
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <div className="text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Reschedule to free slot
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(suggestedSlot.start.toISOString())}, {formatTime(suggestedSlot.start.toISOString())} - {formatTime(suggestedSlot.end.toISOString())}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    )}

                    {/* Override */}
                    <button
                        onClick={() => handleAction('override')}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedAction === 'override'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                                : 'border-gray-200 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-700'
                            } disabled:opacity-50`}
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <div className="text-left">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Create anyway (double-book)
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This will create an overlapping event
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* Cancel */}
                    <Button
                        variant="outline"
                        onClick={() => handleAction('drop')}
                        disabled={isLoading}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Inline conflict indicator for event cards
export function ConflictIndicator({ conflictCount }: { conflictCount: number }) {
    if (conflictCount === 0) return null;

    return (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-3 h-3 text-white" />
        </div>
    );
}

// Conflict warning banner for the calendar view
export function ConflictBanner({
    conflicts,
    onResolve
}: {
    conflicts: BusyTimeSlot[];
    onResolve: () => void
}) {
    if (conflicts.length === 0) return null;

    return (
        <div className="mx-4 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''} detected
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                    Some events overlap with each other
                </p>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={onResolve}
                className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
                Resolve
            </Button>
        </div>
    );
}

export default ConflictResolutionDialog;
