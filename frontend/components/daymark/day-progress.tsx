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
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                        {completed} of {total} priorities completed
                    </span>
                    <span className="text-sm font-medium text-gray-500">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gray-900 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
            {/* Completion dots */}
            <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-colors duration-200 ${i < completed
                                ? "bg-gray-900"
                                : i < total
                                    ? "bg-gray-300"
                                    : "bg-gray-100 border border-gray-200"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
