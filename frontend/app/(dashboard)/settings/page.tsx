"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { Spinner } from "@/components/ui/spinner";
import {
    Settings,
    ListChecks,
    Eye,
    Clock,
    Moon,
    Zap,
    ChevronLeft,
    Wrench,
    Timer,
    Grid3X3,
    BookOpen,
} from "lucide-react";

const SECTION_OPTIONS = [
    { key: "priorities", label: "Top Priorities", description: "Your main focus items for the day" },
    { key: "discussion", label: "To Discuss", description: "Items to bring up in meetings" },
    { key: "schedule", label: "Today's Schedule", description: "Time blocks for your day" },
    { key: "notes", label: "Quick Notes", description: "Freeform notes area" },
    { key: "progress", label: "Day Progress", description: "Progress indicator for priorities" },
    { key: "review", label: "End-of-Day Review", description: "Daily reflection prompts" },
];

const TIME_BLOCK_TYPES = ["Deep Work", "Meeting", "Personal", "Break", "Admin"];

export default function SettingsPage() {
    const router = useRouter();
    const { settings, isLoading, updateSettings } = useSettings();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    // Local state for form
    const [maxPriorities, setMaxPriorities] = useState(3);
    const [maxDiscussion, setMaxDiscussion] = useState(3);
    const [enabledSections, setEnabledSections] = useState<string[]>([]);
    const [defaultDuration, setDefaultDuration] = useState(60);
    const [defaultType, setDefaultType] = useState("Deep Work");
    const [reviewEnabled, setReviewEnabled] = useState(true);
    const [autoCarry, setAutoCarry] = useState(true);
    const [autoCreate, setAutoCreate] = useState(true);
    // Tools state
    const [toolsEnabled, setToolsEnabled] = useState(true);
    const [pomodoroEnabled, setPomodoroEnabled] = useState(true);
    const [eisenhowerEnabled, setEisenhowerEnabled] = useState(true);
    const [decisionLogEnabled, setDecisionLogEnabled] = useState(true);
    const [focusDuration, setFocusDuration] = useState(25);
    const [shortBreak, setShortBreak] = useState(5);
    const [longBreak, setLongBreak] = useState(15);

    // Auth check
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
            }
        };
        checkAuth();
    }, [router]);

    // Sync local state with settings
    useEffect(() => {
        if (settings) {
            setMaxPriorities(settings.maxTopPriorities);
            setMaxDiscussion(settings.maxDiscussionItems);
            setEnabledSections(settings.enabledSections);
            setDefaultDuration(settings.defaultTimeBlockDuration);
            setDefaultType(settings.defaultTimeBlockType);
            setReviewEnabled(settings.endOfDayReviewEnabled);
            setAutoCarry(settings.autoCarryForward);
            setAutoCreate(settings.autoCreateNextDay);
            // Tools
            setToolsEnabled(settings.toolsTabEnabled);
            setPomodoroEnabled(settings.pomodoroEnabled);
            setEisenhowerEnabled(settings.eisenhowerEnabled);
            setDecisionLogEnabled(settings.decisionLogEnabled);
            setFocusDuration(settings.pomodoroFocusDuration);
            setShortBreak(settings.pomodoroShortBreak);
            setLongBreak(settings.pomodoroLongBreak);
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage("");
        try {
            await updateSettings({
                maxTopPriorities: maxPriorities,
                maxDiscussionItems: maxDiscussion,
                enabledSections,
                defaultTimeBlockDuration: defaultDuration,
                defaultTimeBlockType: defaultType,
                endOfDayReviewEnabled: reviewEnabled,
                autoCarryForward: autoCarry,
                autoCreateNextDay: autoCreate,
                // Tools
                toolsTabEnabled: toolsEnabled,
                pomodoroEnabled,
                eisenhowerEnabled,
                decisionLogEnabled,
                pomodoroFocusDuration: focusDuration,
                pomodoroShortBreak: shortBreak,
                pomodoroLongBreak: longBreak,
            });
            setSaveMessage("Settings saved successfully!");
            setTimeout(() => setSaveMessage(""), 3000);
        } catch {
            setSaveMessage("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSection = (key: string) => {
        setEnabledSections((prev) => {
            if (prev.includes(key)) {
                // Don't allow disabling all sections
                if (prev.length === 1) return prev;
                return prev.filter((s) => s !== key);
            }
            return [...prev, key];
        });
    };

    if (!isAuthenticated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="bg-premium">
            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl text-heading">Settings</h1>
                            <p className="text-sm text-muted">Customize your dashboard</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Dashboard Preferences */}
                    <section className="card-premium">
                        <div className="flex items-center gap-2 mb-6">
                            <ListChecks className="w-5 h-5 text-muted" />
                            <h2 className="text-lg text-subheading">Dashboard Preferences</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Max Priorities */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Top Priorities</p>
                                    <p className="text-sm text-gray-500">Maximum items per day (1-5)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setMaxPriorities((p) => Math.max(1, p - 1))}
                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-medium">{maxPriorities}</span>
                                    <button
                                        onClick={() => setMaxPriorities((p) => Math.min(5, p + 1))}
                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Max Discussion */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">To Discuss Items</p>
                                    <p className="text-sm text-gray-500">Maximum items per day (0-5)</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setMaxDiscussion((p) => Math.max(0, p - 1))}
                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-medium">{maxDiscussion}</span>
                                    <button
                                        onClick={() => setMaxDiscussion((p) => Math.min(5, p + 1))}
                                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section Visibility */}
                    <section className="card-premium">
                        <div className="flex items-center gap-2 mb-5">
                            <Eye className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Section Visibility</h2>
                        </div>

                        <div className="space-y-3">
                            {SECTION_OPTIONS.map((section) => (
                                <label
                                    key={section.key}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">{section.label}</p>
                                        <p className="text-sm text-gray-500">{section.description}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={enabledSections.includes(section.key)}
                                        onChange={() => toggleSection(section.key)}
                                        className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                    />
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Scheduling Preferences */}
                    <section className="card-premium">
                        <div className="flex items-center gap-2 mb-5">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Scheduling Defaults</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Default Duration */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Default Duration</p>
                                    <p className="text-sm text-gray-500">For new time blocks</p>
                                </div>
                                <select
                                    value={defaultDuration}
                                    onChange={(e) => setDefaultDuration(Number(e.target.value))}
                                    className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-gray-300"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={45}>45 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                </select>
                            </div>

                            {/* Default Type */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Default Type</p>
                                    <p className="text-sm text-gray-500">For new time blocks</p>
                                </div>
                                <select
                                    value={defaultType}
                                    onChange={(e) => setDefaultType(e.target.value)}
                                    className="bg-gray-100 border-0 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-gray-300"
                                >
                                    {TIME_BLOCK_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Tools Settings */}
                    <section className="card-premium">
                        <div className="flex items-center gap-2 mb-5">
                            <Wrench className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Tools Tab Toggle */}
                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Show Tools Tab</p>
                                    <p className="text-sm text-gray-500">Display tools link in dashboard header</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={toolsEnabled}
                                    onChange={(e) => setToolsEnabled(e.target.checked)}
                                    className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                />
                            </label>

                            {toolsEnabled && (
                                <>
                                    <div className="border-t border-gray-100 pt-4">
                                        <p className="text-sm font-medium text-gray-500 mb-3">Available Tools</p>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Timer className="w-5 h-5 text-blue-500" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">Pomodoro Timer</p>
                                                        <p className="text-sm text-gray-500">Focus timer for deep work</p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={pomodoroEnabled}
                                                    onChange={(e) => setPomodoroEnabled(e.target.checked)}
                                                    className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                                />
                                            </label>

                                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Grid3X3 className="w-5 h-5 text-purple-500" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">Eisenhower Matrix</p>
                                                        <p className="text-sm text-gray-500">Prioritize tasks by urgency</p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={eisenhowerEnabled}
                                                    onChange={(e) => setEisenhowerEnabled(e.target.checked)}
                                                    className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                                />
                                            </label>

                                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <BookOpen className="w-5 h-5 text-green-500" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">Decision Log</p>
                                                        <p className="text-sm text-gray-500">Track important decisions</p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={decisionLogEnabled}
                                                    onChange={(e) => setDecisionLogEnabled(e.target.checked)}
                                                    className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    {pomodoroEnabled && (
                                        <div className="border-t border-gray-100 pt-4">
                                            <p className="text-sm font-medium text-gray-500 mb-3">Pomodoro Durations</p>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-gray-700">Focus</p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setFocusDuration((p) => Math.max(5, p - 5))}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-16 text-center font-medium">{focusDuration} min</span>
                                                        <button
                                                            onClick={() => setFocusDuration((p) => Math.min(120, p + 5))}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-gray-700">Short Break</p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setShortBreak((p) => Math.max(1, p - 1))}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-16 text-center font-medium">{shortBreak} min</span>
                                                        <button
                                                            onClick={() => setShortBreak((p) => Math.min(30, p + 1))}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-gray-700">Long Break</p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setLongBreak((p) => Math.max(5, p - 5))}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-16 text-center font-medium">{longBreak} min</span>
                                                        <button
                                                            onClick={() => setLongBreak((p) => Math.min(60, p + 5))}
                                                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                    {/* Review Preferences */}
                    <section className="card-premium">
                        <div className="flex items-center gap-2 mb-5">
                            <Moon className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Review Preferences</h2>
                        </div>

                        <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                            <div>
                                <p className="font-medium text-gray-900">End-of-Day Review</p>
                                <p className="text-sm text-gray-500">Enable daily reflection prompts</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={reviewEnabled}
                                onChange={(e) => setReviewEnabled(e.target.checked)}
                                className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                            />
                        </label>
                    </section>

                    {/* Daily Behavior */}
                    <section className="card-premium">
                        <div className="flex items-center gap-2 mb-5">
                            <Zap className="w-5 h-5 text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900">Daily Behavior</h2>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Auto-carry unfinished</p>
                                    <p className="text-sm text-gray-500">Move incomplete priorities to next day</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={autoCarry}
                                    onChange={(e) => setAutoCarry(e.target.checked)}
                                    className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">Auto-create next day</p>
                                    <p className="text-sm text-gray-500">Automatically prepare tomorrow's dashboard</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={autoCreate}
                                    onChange={(e) => setAutoCreate(e.target.checked)}
                                    className="w-5 h-5 rounded text-gray-900 focus:ring-gray-500"
                                />
                            </label>
                        </div>
                    </section>

                    {/* Save Button */}
                    <div className="flex items-center justify-between">
                        {saveMessage && (
                            <p
                                className={`text-sm ${saveMessage.includes("Failed") ? "text-red-500" : "text-green-600"
                                    }`}
                            >
                                {saveMessage}
                            </p>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="ml-auto px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
