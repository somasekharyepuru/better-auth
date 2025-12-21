"use client";

interface DayProgressProps {
    completed: number;
    total: number;
}

export function DayProgress({ completed, total }: DayProgressProps) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="flex items-center gap-4">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-body">
                        {completed} of {total} priorities completed
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
            {/* Completion dots */}
            <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i < completed
                            ? "bg-gradient-to-br from-gray-700 to-gray-900 scale-100"
                            : i < total
                                ? "bg-gray-200"
                                : "bg-gray-100"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
