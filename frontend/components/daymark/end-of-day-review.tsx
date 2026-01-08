"use client";

import { useState, useEffect } from "react";
import { DailyReview, TopPriority, dailyReviewApi, formatDate } from "@/lib/daymark-api";
import { Moon, ArrowRight, X } from "lucide-react";

interface EndOfDayReviewProps {
    date: string;
    review: DailyReview | null;
    incompletePriorities: TopPriority[];
    onUpdate: () => void;
    isOpen: boolean;
    onClose: () => void;
    lifeAreaId?: string;
}

export function EndOfDayReview({
    date,
    review,
    incompletePriorities,
    onUpdate,
    isOpen,
    onClose,
    lifeAreaId,
}: EndOfDayReviewProps) {
    const [wentWell, setWentWell] = useState(review?.wentWell || "");
    const [didntGoWell, setDidntGoWell] = useState(review?.didntGoWell || "");
    const [isLoading, setIsLoading] = useState(false);
    const [isCarrying, setIsCarrying] = useState(false);
    const [carryResult, setCarryResult] = useState<{
        carried: number;
        skipped: number;
    } | null>(null);

    useEffect(() => {
        setWentWell(review?.wentWell || "");
        setDidntGoWell(review?.didntGoWell || "");
    }, [review]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await dailyReviewApi.upsert(date, { wentWell, didntGoWell });
            onUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to save review:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCarryForward = async () => {
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDate(tomorrow);

        setIsCarrying(true);
        try {
            const result = await dailyReviewApi.carryForward(date, tomorrowStr, lifeAreaId);
            setCarryResult(result);
            onUpdate();
        } catch (error) {
            console.error("Failed to carry forward:", error);
        } finally {
            setIsCarrying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Moon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">End of Day Review</h2>
                            <p className="text-sm text-gray-500">Reflect on today and plan ahead</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Carry forward incomplete priorities */}
                    {incompletePriorities.length > 0 && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <p className="text-sm font-medium text-amber-800 mb-2">
                                {incompletePriorities.length} incomplete{" "}
                                {incompletePriorities.length === 1 ? "priority" : "priorities"} today
                            </p>
                            <ul className="text-sm text-amber-700 mb-3 space-y-1">
                                {incompletePriorities.map((p) => (
                                    <li key={p.id} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        {p.title}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={handleCarryForward}
                                disabled={isCarrying}
                                className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50"
                            >
                                <ArrowRight className="w-4 h-4" />
                                {isCarrying ? "Carrying..." : "Carry to tomorrow"}
                            </button>
                            {carryResult && (
                                <p className="mt-2 text-xs text-amber-600">
                                    ✓ Carried {carryResult.carried}{" "}
                                    {carryResult.carried === 1 ? "priority" : "priorities"}
                                    {carryResult.skipped > 0 && ` (${carryResult.skipped} skipped - limit reached)`}
                                </p>
                            )}
                        </div>
                    )}

                    {/* What went well */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            What went well today?
                        </label>
                        <textarea
                            value={wentWell}
                            onChange={(e) => setWentWell(e.target.value)}
                            placeholder="Celebrate your wins, big and small..."
                            className="w-full bg-gray-50 rounded-xl p-4 text-gray-700 outline-none resize-none placeholder:text-gray-400 focus:bg-gray-100 transition-colors h-24"
                        />
                    </div>

                    {/* What didn't go well */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            What didn't go as planned?
                        </label>
                        <textarea
                            value={didntGoWell}
                            onChange={(e) => setDidntGoWell(e.target.value)}
                            placeholder="What would you do differently?"
                            className="w-full bg-gray-50 rounded-xl p-4 text-gray-700 outline-none resize-none placeholder:text-gray-400 focus:bg-gray-100 transition-colors h-24"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : "Save Review"}
                    </button>
                </div>
            </div>
        </div>
    );
}
