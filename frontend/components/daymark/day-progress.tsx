"use client";

interface DayProgressProps {
    completed: number;
    total: number;
}

export function DayProgress({ completed, total }: DayProgressProps) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Don't render if no priorities or nothing completed yet
    if (total === 0 || completed === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-4">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-body">
                        {completed} of {total} priorities completed
                        {completed === total && ' 🎉'}
                    </span>
                    <span className="text-sm text-muted">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                        className="progress-premium h-2"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
            {/* Completion dots - dynamic based on total */}
            <div className="flex gap-2">
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i < completed
                                ? "bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-200 dark:to-white scale-100"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
