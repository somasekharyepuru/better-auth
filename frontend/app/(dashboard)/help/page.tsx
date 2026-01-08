"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Calendar, Brain, Target, Clock, Keyboard, ArrowLeft,
    Play, Users, Settings, ChevronDown, ChevronUp, Zap,
    LayoutDashboard, Timer, Grid3X3, Scale, Moon, Sun,
    CheckCircle, Star, RefreshCw, Wifi, Shield, Building,
    HelpCircle, ArrowRight, Sparkles
} from "lucide-react";
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

function FeatureCard({ icon, title, description, link }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    link?: string;
}) {
    const content = (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    {icon}
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
                </div>
                {link && <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />}
            </div>
        </div>
    );

    if (link) {
        return <Link href={link}>{content}</Link>;
    }
    return content;
}

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <HelpCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Daymark User Guide</h1>
                            <p className="text-purple-100">Everything you need to master your productivity</p>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <a href="#dashboard" className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-center transition-colors">
                            <LayoutDashboard className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-sm">Dashboard</span>
                        </a>
                        <a href="#calendar" className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-center transition-colors">
                            <Calendar className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-sm">Calendar</span>
                        </a>
                        <a href="#tools" className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-center transition-colors">
                            <Grid3X3 className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-sm">Tools</span>
                        </a>
                        <a href="#shortcuts" className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-center transition-colors">
                            <Keyboard className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-sm">Shortcuts</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">

                {/* Getting Started */}
                <CollapsibleSection
                    title="Getting Started"
                    icon={<Sparkles className="w-5 h-5 text-yellow-500" />}
                    defaultOpen={true}
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Daymark is your personal productivity system. Here's how to get the most out of it:
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">1. Set Priorities</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Define your top 3 daily priorities on the dashboard
                                </p>
                            </div>
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">2. Block Time</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Create focus blocks for deep work on your calendar
                                </p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">3. Focus & Execute</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Use Pomodoro sessions to work without distractions
                                </p>
                            </div>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Dashboard */}
                <div id="dashboard">
                    <CollapsibleSection
                        title="Dashboard"
                        icon={<LayoutDashboard className="w-5 h-5 text-blue-500" />}
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Your command center for daily productivity. View priorities, time blocks, and progress in one place.
                            </p>

                            <h4 className="font-medium text-gray-900 dark:text-white">Key Features:</h4>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">Top 3 Priorities</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Focus on what matters most today. Add up to 3 priority items.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">Time Blocks</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">See today's scheduled blocks with linked priorities.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Moon className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">End of Day Review</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Reflect on progress and plan for tomorrow.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Target className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">Life Areas</span>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Organize priorities by area (Work, Personal, Health, etc.).</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-4">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>Pro Tip:</strong> Use the arrow buttons or date picker to navigate between days and plan ahead.
                                </p>
                            </div>
                        </div>
                    </CollapsibleSection>
                </div>

                {/* Calendar */}
                <div id="calendar">
                    <CollapsibleSection
                        title="Calendar & Time Blocks"
                        icon={<Calendar className="w-5 h-5 text-purple-500" />}
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Unified calendar aggregating all your connected calendars with focus time blocking.
                            </p>

                            <h4 className="font-medium text-gray-900 dark:text-white">Time Block Categories:</h4>
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                                    <span className="font-medium text-purple-900 dark:text-purple-100">Focus</span>
                                    <p className="text-xs text-purple-700 dark:text-purple-300">Deep work sessions, blocks external calendars</p>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border-l-4 border-indigo-500">
                                    <span className="font-medium text-indigo-900 dark:text-indigo-100">Deep Work</span>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Extended focus for complex tasks</p>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                    <span className="font-medium text-blue-900 dark:text-blue-100">Meeting</span>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">Scheduled meetings and calls</p>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                                    <span className="font-medium text-green-900 dark:text-green-100">Break</span>
                                    <p className="text-xs text-green-700 dark:text-green-300">Rest periods between sessions</p>
                                </div>
                            </div>

                            <h4 className="font-medium text-gray-900 dark:text-white mt-4">Create Focus Blocks:</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                <li>• <strong>Click</strong> any time slot to create a block</li>
                                <li>• <strong>Shift+N</strong> for quick focus block at 9 AM</li>
                                <li>• <strong>Drag priorities</strong> from dashboard onto calendar</li>
                            </ul>

                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <p className="text-sm text-purple-800 dark:text-purple-200">
                                    <strong>External Blocking:</strong> Focus blocks automatically mark you as "busy" in Google, Microsoft, and Apple calendars.
                                </p>
                            </div>

                            <Link href="/calendar/help" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline text-sm mt-2">
                                View full calendar guide <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </CollapsibleSection>
                </div>

                {/* Tools */}
                <div id="tools">
                    <CollapsibleSection
                        title="Productivity Tools"
                        icon={<Grid3X3 className="w-5 h-5 text-green-500" />}
                    >
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Specialized tools to boost your productivity and decision making.
                            </p>

                            <div className="grid gap-4">
                                <FeatureCard
                                    icon={<Timer className="w-5 h-5 text-red-500" />}
                                    title="Pomodoro Timer"
                                    description="25-minute focus sessions with breaks. Track deep work time and stay focused."
                                    link="/tools/pomodoro"
                                />
                                <FeatureCard
                                    icon={<Grid3X3 className="w-5 h-5 text-blue-500" />}
                                    title="Eisenhower Matrix"
                                    description="Prioritize tasks by urgency and importance. Sort your to-dos into 4 quadrants."
                                    link="/tools/matrix"
                                />
                                <FeatureCard
                                    icon={<Scale className="w-5 h-5 text-purple-500" />}
                                    title="Decision Helper"
                                    description="Weigh pros and cons of decisions. Get clarity when you're stuck."
                                    link="/tools/decisions"
                                />
                            </div>

                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mt-4">
                                <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">Pomodoro Technique</h5>
                                <ol className="text-sm text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
                                    <li>Work for 25 minutes (1 Pomodoro)</li>
                                    <li>Take a 5-minute break</li>
                                    <li>After 4 Pomodoros, take a 15-30 min break</li>
                                    <li>Repeat! Track sessions in calendar</li>
                                </ol>
                            </div>
                        </div>
                    </CollapsibleSection>
                </div>

                {/* Keyboard Shortcuts */}
                <div id="shortcuts">
                    <CollapsibleSection
                        title="Keyboard Shortcuts"
                        icon={<Keyboard className="w-5 h-5 text-indigo-500" />}
                        defaultOpen={true}
                    >
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 dark:text-white">Calendar Navigation</h4>
                            <KeyboardShortcut keys={["←"]} description="Go to previous day/week/month" />
                            <KeyboardShortcut keys={["→"]} description="Go to next day/week/month" />
                            <KeyboardShortcut keys={["T"]} description="Jump to today" />

                            <h4 className="font-medium text-gray-900 dark:text-white pt-2">View Modes</h4>
                            <KeyboardShortcut keys={["D"]} description="Switch to Day view" />
                            <KeyboardShortcut keys={["W"]} description="Switch to Week view" />
                            <KeyboardShortcut keys={["M"]} description="Switch to Month view" />
                            <KeyboardShortcut keys={["S"]} description="Toggle sidebar" />

                            <h4 className="font-medium text-gray-900 dark:text-white pt-2">Actions</h4>
                            <KeyboardShortcut keys={["N"]} description="Create new event" />
                            <KeyboardShortcut keys={["⇧", "N"]} description="Quick focus block (9 AM)" />
                            <KeyboardShortcut keys={["R"]} description="Refresh calendars" />
                            <KeyboardShortcut keys={["F"]} description="Toggle Focus Mode" />
                            <KeyboardShortcut keys={["?"]} description="Show keyboard shortcuts" />
                            <KeyboardShortcut keys={["Esc"]} description="Close modal/dialog" />
                        </div>
                    </CollapsibleSection>
                </div>

                {/* Organizations */}
                <CollapsibleSection
                    title="Organizations & Teams"
                    icon={<Building className="w-5 h-5 text-orange-500" />}
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Create and manage organizations for team collaboration.
                        </p>

                        <div className="grid gap-3">
                            <FeatureCard
                                icon={<Building className="w-5 h-5 text-orange-500" />}
                                title="Create Organization"
                                description="Start a new team workspace. Invite members via email."
                                link="/organizations/create"
                            />
                            <FeatureCard
                                icon={<Users className="w-5 h-5 text-blue-500" />}
                                title="Manage Members"
                                description="Add, remove, or change roles for team members."
                                link="/organizations/manage"
                            />
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Settings & Account */}
                <CollapsibleSection
                    title="Settings & Account"
                    icon={<Settings className="w-5 h-5 text-gray-500" />}
                >
                    <div className="space-y-4">
                        <FeatureCard
                            icon={<Wifi className="w-5 h-5 text-green-500" />}
                            title="Calendar Connections"
                            description="Connect Google, Microsoft, or Apple calendars."
                            link="/settings/calendars"
                        />
                        <FeatureCard
                            icon={<Shield className="w-5 h-5 text-blue-500" />}
                            title="Two-Factor Authentication"
                            description="Add extra security to your account."
                            link="/profile/two-factor"
                        />
                        <FeatureCard
                            icon={<Settings className="w-5 h-5 text-gray-500" />}
                            title="Profile Settings"
                            description="Update your name, email, and password."
                            link="/profile"
                        />
                    </div>
                </CollapsibleSection>

                {/* Get Started Button */}
                <div className="text-center pt-8 space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Ready to take control of your time?
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/">
                            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                                <LayoutDashboard className="w-5 h-5 mr-2" />
                                Go to Dashboard
                            </Button>
                        </Link>
                        <Link href="/calendar">
                            <Button size="lg" variant="outline" className="px-8">
                                <Calendar className="w-5 h-5 mr-2" />
                                Open Calendar
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
