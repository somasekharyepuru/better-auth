"use client";

export function AppMockup() {
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
                            focus.app
                        </div>
                    </div>
                    <div className="w-16" />
                </div>

                {/* App Content */}
                <div className="p-8 bg-gradient-to-b from-gray-50/50 to-white">
                    {/* App Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">F</span>
                            </div>
                            <span className="text-gray-400 text-sm">Saturday, December 21</span>
                        </div>
                        <div className="w-8 h-8 bg-gray-100 rounded-full" />
                    </div>

                    {/* Greeting */}
                    <div className="mb-10">
                        <h2 className="text-3xl font-semibold text-gray-900 mb-1">Good morning</h2>
                        <p className="text-gray-400">Here's your focus for today.</p>
                    </div>

                    {/* Top 3 Priorities */}
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                            Top 3 Priorities
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="w-5 h-5 rounded-full border-2 border-blue-500" />
                                <span className="text-gray-900 font-medium">Complete project proposal</span>
                                <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                    High
                                </span>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                <span className="text-gray-900 font-medium">Review team feedback</span>
                                <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                    Medium
                                </span>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                <span className="text-gray-900 font-medium">Plan next week's goals</span>
                                <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                    Low
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50/80 rounded-xl text-center">
                            <div className="text-2xl font-semibold text-gray-900 mb-1">3</div>
                            <div className="text-xs text-gray-500">Tasks today</div>
                        </div>
                        <div className="p-4 bg-gray-50/80 rounded-xl text-center">
                            <div className="text-2xl font-semibold text-gray-900 mb-1">7</div>
                            <div className="text-xs text-gray-500">Day streak</div>
                        </div>
                        <div className="p-4 bg-gray-50/80 rounded-xl text-center">
                            <div className="text-2xl font-semibold text-gray-900 mb-1">2</div>
                            <div className="text-xs text-gray-500">Notes</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle shadow/glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-b from-blue-100/20 to-purple-100/20 rounded-3xl -z-10 blur-2xl" />
        </div>
    );
}
