"use client";

import { useState } from "react";
import {
    Calendar, Brain, Target, Clock, Keyboard, ArrowLeft, ArrowRight,
    Play, Pause, AlertTriangle, RefreshCw, Wifi, WifiOff, Move,
    Check, X, ChevronDown, ChevronUp, Zap, MousePointer, Timer
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: SectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </button>
            {isOpen && (
                <div className="p-4 bg-white dark:bg-gray-900">
                    {children}
                </div>
            )}
        </div>
    );
}

function KeyboardShortcut({ keys, description }: { keys: string[]; description: string }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-gray-600 dark:text-gray-400">{description}</span>
            <div className="flex items-center gap-1">
                {keys.map((key, i) => (
                    <span key={i}>
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono font-medium text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                            {key}
                        </kbd>
                        {i < keys.length - 1 && <span className="mx-1 text-gray-400">+</span>}
                    </span>
                ))}
            </div>
        </div>
    );
}

function FlowStep({ step, title, description }: { step: number; title: string; description: string }) {
    return (
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                {step}
            </div>
            <div className="flex-1 pb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
        </div>
    );
}

export default function CalendarHelpPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <Link href="/calendar" className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-6">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Calendar
                    </Link>
                    <h1 className="text-3xl font-bold mb-3">Calendar & Time Blocks Guide</h1>
                    <p className="text-purple-100 text-lg">
                        Master your schedule with unified calendars, focus blocks, and powerful keyboard shortcuts.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">

                {/* Quick Start */}
                <CollapsibleSection
                    title="Quick Start"
                    icon={<Zap className="w-5 h-5 text-yellow-500" />}
                    defaultOpen={true}
                >
                    <div className="space-y-6">
                        <p className="text-gray-600 dark:text-gray-400">
                            Get started with Daymark Calendar in 3 simple steps:
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Wifi className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">1. Connect</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Link Google, Microsoft, or Apple calendars
                                </p>
                            </div>
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">2. Block</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Create focus time blocks for deep work
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Play className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">3. Focus</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Start Pomodoro sessions from your blocks
                                </p>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Keyboard Shortcuts */}
                <CollapsibleSection
                    title="Keyboard Shortcuts"
                    icon={<Keyboard className="w-5 h-5 text-blue-500" />}
                    defaultOpen={true}
                >
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Navigation</h4>
                            <KeyboardShortcut keys={["←"]} description="Go to previous day/week/month" />
                            <KeyboardShortcut keys={["→"]} description="Go to next day/week/month" />
                            <KeyboardShortcut keys={["T"]} description="Jump to today" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">View Modes</h4>
                            <KeyboardShortcut keys={["D"]} description="Switch to Day view" />
                            <KeyboardShortcut keys={["W"]} description="Switch to Week view" />
                            <KeyboardShortcut keys={["M"]} description="Switch to Month view" />
                            <KeyboardShortcut keys={["S"]} description="Toggle sidebar" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Actions</h4>
                            <KeyboardShortcut keys={["N"]} description="Create new event" />
                            <KeyboardShortcut keys={["⇧", "N"]} description="Quick create focus block (9 AM)" />
                            <KeyboardShortcut keys={["R"]} description="Refresh/sync calendars" />
                            <KeyboardShortcut keys={["F"]} description="Toggle Focus Mode" />
                            <KeyboardShortcut keys={["?"]} description="Show keyboard shortcuts" />
                            <KeyboardShortcut keys={["Esc"]} description="Close modal/dialog" />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Time Block Categories */}
                <CollapsibleSection
                    title="Time Block Categories"
                    icon={<Clock className="w-5 h-5 text-purple-500" />}
                >
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                            <div className="flex items-center gap-2 mb-1">
                                <Brain className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-purple-900 dark:text-purple-100">Focus</span>
                            </div>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                Deep work sessions. Automatically blocks time in external calendars.
                            </p>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                            <div className="flex items-center gap-2 mb-1">
                                <Target className="w-4 h-4 text-indigo-600" />
                                <span className="font-medium text-indigo-900 dark:text-indigo-100">Deep Work</span>
                            </div>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                Extended focus sessions for complex tasks.
                            </p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-900 dark:text-blue-100">Meeting</span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Scheduled meetings and calls.
                            </p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-1">
                                <Pause className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-900 dark:text-green-100">Break</span>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Rest periods between work sessions.
                            </p>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Creating Focus Blocks */}
                <CollapsibleSection
                    title="Creating Focus Blocks"
                    icon={<Brain className="w-5 h-5 text-purple-500" />}
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Focus blocks protect your deep work time by automatically marking you as busy in all connected calendars.
                        </p>

                        <h4 className="font-medium text-gray-900 dark:text-white">Method 1: Click to Create</h4>
                        <div className="space-y-0">
                            <FlowStep step={1} title="Click on calendar" description="Click any time slot in day or week view" />
                            <FlowStep step={2} title="Fill details" description="Enter title, select 'Focus' category, set duration" />
                            <FlowStep step={3} title="Link priority (optional)" description="Connect to a priority from your dashboard" />
                            <FlowStep step={4} title="Save" description="Block is created and external calendars are updated" />
                        </div>

                        <h4 className="font-medium text-gray-900 dark:text-white mt-6">Method 2: Quick Create</h4>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                                Press <kbd className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-800 rounded text-xs font-mono">⇧</kbd> + <kbd className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-800 rounded text-xs font-mono">N</kbd> to instantly create a focus block at 9 AM on the current day.
                            </p>
                        </div>

                        <h4 className="font-medium text-gray-900 dark:text-white mt-6">Method 3: Drag from Priorities</h4>
                        <div className="space-y-0">
                            <FlowStep step={1} title="Open dashboard sidebar" description="Your priorities are visible on the left" />
                            <FlowStep step={2} title="Drag a priority" description="Drag any priority item onto the calendar" />
                            <FlowStep step={3} title="Drop on time slot" description="Release to create a focus block linked to that priority" />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Focus Sessions (Pomodoro) */}
                <CollapsibleSection
                    title="Focus Sessions (Pomodoro)"
                    icon={<Timer className="w-5 h-5 text-green-500" />}
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Start timed focus sessions directly from your time blocks to track deep work.
                        </p>

                        <FlowStep step={1} title="Click on a focus block" description="Open any focus or deep-work time block" />
                        <FlowStep step={2} title="Click 'Start Focus Session'" description="The Pomodoro timer begins (default 25 minutes)" />
                        <FlowStep step={3} title="Work without distractions" description="A floating indicator shows time remaining" />
                        <FlowStep step={4} title="Complete or pause" description="Mark session complete or pause if interrupted" />

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mt-4">
                            <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">Session Tracking</h5>
                            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                                <li>• Completed sessions are logged against your time block</li>
                                <li>• View session stats in the sidebar</li>
                                <li>• Track focus vs meeting ratio over time</li>
                            </ul>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Conflict Resolution */}
                <CollapsibleSection
                    title="Conflict Resolution"
                    icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            When events overlap, Daymark helps you resolve conflicts quickly.
                        </p>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Move className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">Reschedule</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Move your block to the next available free slot
                                </p>
                            </div>
                            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">Override</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Keep both events (double-book intentionally)
                                </p>
                            </div>
                            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <X className="w-5 h-5 text-red-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">Cancel</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Don't create the conflicting block
                                </p>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Focus Mode */}
                <CollapsibleSection
                    title="Focus Mode"
                    icon={<Brain className="w-5 h-5 text-indigo-500" />}
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Focus Mode hides distractions and shows only your focus and deep-work blocks.
                        </p>

                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                Press <kbd className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-800 rounded text-xs font-mono">F</kbd> to toggle Focus Mode on/off. A purple badge appears in the corner when active.
                            </p>
                        </div>

                        <h4 className="font-medium text-gray-900 dark:text-white">What changes in Focus Mode:</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Focus and Deep Work blocks remain visible
                            </li>
                            <li className="flex items-center gap-2">
                                <X className="w-4 h-4 text-red-500" />
                                Meetings, breaks, and personal blocks are hidden
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Reduced visual clutter for planning deep work
                            </li>
                        </ul>
                    </div>
                </CollapsibleSection>

                {/* Calendar Sync */}
                <CollapsibleSection
                    title="Calendar Sync & Health"
                    icon={<RefreshCw className="w-5 h-5 text-green-500" />}
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Keep your calendars in sync and monitor connection health.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded-r-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <WifiOff className="w-4 h-4 text-red-600" />
                                    <span className="font-medium text-red-800 dark:text-red-200">Sync Error</span>
                                </div>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    Red banner appears when a calendar fails to sync. Click "Retry" to attempt again.
                                </p>
                            </div>
                            <div className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <WifiOff className="w-4 h-4 text-amber-600" />
                                    <span className="font-medium text-amber-800 dark:text-amber-200">Disconnected</span>
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Amber banner when a calendar is disconnected. Click "Reconnect" to re-authorize.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">R</kbd> to manually refresh all connected calendars.
                            </p>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Get Started Button */}
                <div className="text-center pt-8">
                    <Link href="/calendar">
                        <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                            <Calendar className="w-5 h-5 mr-2" />
                            Open Calendar
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
