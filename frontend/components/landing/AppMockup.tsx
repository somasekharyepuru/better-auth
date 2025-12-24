"use client";

import { APP_CONFIG } from "@/config/app.constants";

export function AppMockup() {
    // Get current date for realistic display
    const today = new Date();
    const dayNumber = today.getDate();
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
    const monthYear = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
        <div className="relative mx-auto max-w-4xl">
            {/* Browser Chrome */}
            <div className="rounded-2xl bg-white shadow-2xl border border-gray-200/60 overflow-hidden">
                {/* Window Controls */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-200/60">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="px-4 py-1 bg-white rounded-md text-xs text-gray-400 border border-gray-200">
                            daymark.app
                        </div>
                    </div>
                    <div className="w-16" />
                </div>

                {/* App Content */}
                <div className="p-6 bg-gradient-to-b from-gray-50/50 to-white">
                    {/* App Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {/* Date Navigation */}
                            <div className="flex items-center gap-1">
                                <div className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </div>
                                <div className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Date Display */}
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold text-gray-900 tracking-tight">{dayNumber}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900 leading-tight">{dayOfWeek}</span>
                                    <span className="text-xs text-gray-500 leading-tight">{monthYear}</span>
                                </div>
                                <span className="px-2 py-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full ml-1">
                                    Today
                                </span>
                            </div>
                        </div>

                        {/* Greeting */}
                        <p className="text-sm text-gray-500">
                            Good morning, <span className="text-gray-700 font-medium">Alex</span>
                        </p>
                    </div>

                    {/* Life Area Tabs */}
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
                        <button className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg">
                            Work
                        </button>
                        <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
                            Personal
                        </button>
                        <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
                            Side Project
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6 p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Today&apos;s Progress</span>
                            <span className="text-xs font-semibold text-gray-900">2 of 3 complete</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: '66%' }} />
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Left Column - Priorities */}
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                Top Priorities
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-400 line-through">Complete project proposal</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-400 line-through">Review team feedback</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-4 h-4 rounded-full border-2 border-blue-400" />
                                    <span className="text-sm text-gray-900 font-medium">Plan next sprint</span>
                                </div>
                            </div>

                            {/* Discussion Items */}
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-4 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                To Discuss
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-600">S</div>
                                    <span className="text-sm text-gray-900">Budget review with Sarah</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Time Blocks & Notes */}
                        <div>
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Schedule
                            </h3>
                            <div className="space-y-2">
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-blue-900">Deep Work</span>
                                        <span className="text-xs text-blue-600">9:00 - 11:00</span>
                                    </div>
                                    <p className="text-xs text-blue-700">Focus on product roadmap</p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-amber-900">Meeting</span>
                                        <span className="text-xs text-amber-600">2:00 - 3:00</span>
                                    </div>
                                    <p className="text-xs text-amber-700">Weekly team sync</p>
                                </div>
                            </div>

                            {/* Quick Notes */}
                            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-4 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Quick Notes
                            </h3>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Remember to check the analytics dashboard for Q4 metrics. Also follow up on the design review...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle shadow/glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-b from-blue-100/20 to-purple-100/20 rounded-3xl -z-10 blur-2xl" />
        </div>
    );
}
