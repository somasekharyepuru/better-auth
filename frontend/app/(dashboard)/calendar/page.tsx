"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    eventsApi,
    calendarApi,
    CalendarEvent,
    CalendarSource,
    WritableCalendarSource,
    CreateCalendarEventInput,
    UpdateCalendarEventInput,
    BusyTimeSlot,
    ConflictCheckResult,
} from "@/lib/daymark-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Settings,
    Clock,
    MapPin,
    X,
    Check,
    Trash2,
    RefreshCw,
    Menu,
    Keyboard,
    AlertTriangle,
} from "lucide-react";

type ViewMode = "month" | "week" | "day";

interface EventModalState {
    isOpen: boolean;
    event: CalendarEvent | null;
    date?: Date;
    startHour?: number;
}

interface DragState {
    isDragging: boolean;
    eventId: string | null;
    newStartTime?: Date;
    newEndTime?: Date;
}

// Helper functions
function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function addWeeks(date: Date, weeks: number): Date {
    return addDays(date, weeks * 7);
}

function addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function formatMonthYear(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatFullDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarPage() {
    const router = useRouter();
    const { addToast } = useToast();

    const [viewMode, setViewMode] = useState<ViewMode>("week");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [sources, setSources] = useState<CalendarSource[]>([]);
    const [writableSources, setWritableSources] = useState<WritableCalendarSource[]>([]);
    const [visibleSourceIds, setVisibleSourceIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [eventModal, setEventModal] = useState<EventModalState>({ isOpen: false, event: null });
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [dragState, setDragState] = useState<DragState>({ isDragging: false, eventId: null });

    // Refs for keyboard navigation
    const containerRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger when typing in inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Don't trigger when modal is open
            if (eventModal.isOpen) {
                if (e.key === "Escape") {
                    setEventModal({ isOpen: false, event: null });
                }
                return;
            }

            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    goBack();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    goForward();
                    break;
                case "t":
                case "T":
                    e.preventDefault();
                    goToToday();
                    break;
                case "d":
                case "D":
                    e.preventDefault();
                    setViewMode("day");
                    break;
                case "w":
                case "W":
                    e.preventDefault();
                    setViewMode("week");
                    break;
                case "m":
                case "M":
                    e.preventDefault();
                    setViewMode("month");
                    break;
                case "n":
                    e.preventDefault();
                    openCreateModal();
                    break;
                case "N":
                    // Shift+N for quick focus block
                    e.preventDefault();
                    openCreateModal(currentDate, 9); // Default to 9am focus block
                    break;
                case "r":
                case "R":
                    e.preventDefault();
                    handleRefresh();
                    break;
                case "s":
                case "S":
                    // Toggle sidebar
                    e.preventDefault();
                    setSidebarOpen(!sidebarOpen);
                    break;
                case "/":
                case "?":
                    e.preventDefault();
                    setShowShortcuts(!showShortcuts);
                    break;
                case "Escape":
                    e.preventDefault();
                    if (showShortcuts) {
                        setShowShortcuts(false);
                    }
                    break;
            }
        };


        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [eventModal.isOpen, viewMode, currentDate, showShortcuts]);

    // Calculate date range based on view mode
    const dateRange = useMemo(() => {
        let start: Date;
        let end: Date;

        switch (viewMode) {
            case "month":
                start = startOfMonth(currentDate);
                start = addDays(start, -start.getDay()); // Start from Sunday of first week
                end = endOfMonth(currentDate);
                end = addDays(end, 6 - end.getDay()); // End on Saturday of last week
                break;
            case "week":
                start = startOfWeek(currentDate);
                end = addDays(start, 6);
                end.setHours(23, 59, 59, 999);
                break;
            case "day":
                start = new Date(currentDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
                break;
        }

        return { start, end };
    }, [viewMode, currentDate]);

    // Load calendar sources
    const loadSources = useCallback(async () => {
        try {
            const connections = await calendarApi.getConnections();
            const allSources: CalendarSource[] = [];
            connections.forEach((conn) => {
                if (conn.sources) {
                    allSources.push(...conn.sources.filter((s) => s.syncEnabled));
                }
            });
            setSources(allSources);
            setVisibleSourceIds(new Set(allSources.map((s) => s.id)));

            try {
                const writable = await eventsApi.getWritableSources();
                setWritableSources(writable);
            } catch (error) {
                console.error("Failed to load writable sources:", error);
            }
        } catch (error) {
            console.error("Failed to load sources:", error);
        }
    }, []);

    // Load events
    const loadEvents = useCallback(async () => {
        try {
            const data = await eventsApi.getEvents(
                dateRange.start.toISOString(),
                dateRange.end.toISOString()
            );
            setEvents(data);
        } catch (error) {
            console.error("Failed to load events:", error);
            setEvents([]); // Set empty array on error
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [dateRange]);

    useEffect(() => {
        loadSources();
    }, [loadSources]);

    useEffect(() => {
        setIsLoading(true); // Set loading when date range changes
        loadEvents();
    }, [loadEvents]);

    // Filter events by visible sources
    const filteredEvents = useMemo(() => {
        return events.filter(
            (e) => !e.sourceId || visibleSourceIds.has(e.sourceId)
        );
    }, [events, visibleSourceIds]);

    // Navigation handlers
    const goToToday = () => setCurrentDate(new Date());

    const goBack = () => {
        switch (viewMode) {
            case "month":
                setCurrentDate(addMonths(currentDate, -1));
                break;
            case "week":
                setCurrentDate(addWeeks(currentDate, -1));
                break;
            case "day":
                setCurrentDate(addDays(currentDate, -1));
                break;
        }
    };

    const goForward = () => {
        switch (viewMode) {
            case "month":
                setCurrentDate(addMonths(currentDate, 1));
                break;
            case "week":
                setCurrentDate(addWeeks(currentDate, 1));
                break;
            case "day":
                setCurrentDate(addDays(currentDate, 1));
                break;
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadEvents();
    };

    // Event handlers
    const openCreateModal = (date?: Date, hour?: number) => {
        setEventModal({ isOpen: true, event: null, date, startHour: hour });
    };

    const openEditModal = (event: CalendarEvent) => {
        setEventModal({ isOpen: true, event });
    };

    const closeModal = () => {
        setEventModal({ isOpen: false, event: null });
    };

    const handleEventCreate = async (data: CreateCalendarEventInput) => {
        try {
            await eventsApi.createEvent(data);
            addToast({ type: "success", title: "Event created", duration: 3000 });
            closeModal();
            loadEvents();
        } catch (error) {
            addToast({ type: "error", title: "Failed to create event", duration: 5000 });
        }
    };

    const handleEventUpdate = async (id: string, data: UpdateCalendarEventInput) => {
        try {
            await eventsApi.updateEvent(id, data);
            addToast({ type: "success", title: "Event updated", duration: 3000 });
            closeModal();
            loadEvents();
        } catch (error) {
            addToast({ type: "error", title: "Failed to update event", duration: 5000 });
        }
    };

    const handleEventDelete = async (id: string) => {
        if (!confirm("Delete this event?")) return;
        try {
            await eventsApi.deleteEvent(id);
            addToast({ type: "success", title: "Event deleted", duration: 3000 });
            closeModal();
            loadEvents();
        } catch (error) {
            addToast({ type: "error", title: "Failed to delete event", duration: 5000 });
        }
    };

    const toggleSourceVisibility = (sourceId: string) => {
        setVisibleSourceIds((prev) => {
            const next = new Set(prev);
            if (next.has(sourceId)) {
                next.delete(sourceId);
            } else {
                next.add(sourceId);
            }
            return next;
        });
    };

    // Render header
    const renderHeader = () => {
        let title: string;
        switch (viewMode) {
            case "month":
                title = formatMonthYear(currentDate);
                break;
            case "week":
                const weekStart = startOfWeek(currentDate);
                const weekEnd = addDays(weekStart, 6);
                if (weekStart.getMonth() === weekEnd.getMonth()) {
                    title = `${weekStart.toLocaleDateString("en-US", { month: "short" })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
                } else {
                    title = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${weekEnd.getFullYear()}`;
                }
                break;
            case "day":
                title = formatFullDate(currentDate);
                break;
        }

        return (
            <header className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        title="Toggle sidebar"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="hidden md:flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Calendar</h1>
                    </div>

                    <div className="flex items-center gap-1 md:gap-2 md:ml-4">
                        <Button variant="outline" size="sm" onClick={goToToday} className="hidden sm:flex">
                            Today
                        </Button>
                        <button
                            onClick={goBack}
                            className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            title="Previous (←)"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={goForward}
                            className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            title="Next (→)"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <h2 className="text-sm md:text-lg font-medium text-gray-900 dark:text-white min-w-0 md:min-w-[200px] truncate">
                            {title}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                        title="Refresh (R)"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>

                    <div className="hidden sm:flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium capitalize transition-colors ${viewMode === mode
                                    ? "bg-blue-600 text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} view (${mode.charAt(0).toUpperCase()})`}
                            >
                                {mode.charAt(0).toUpperCase()}
                                <span className="hidden md:inline">{mode.slice(1)}</span>
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={() => openCreateModal()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                        title="New event (N)"
                    >
                        <Plus className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Create</span>
                    </Button>

                    <button
                        onClick={() => setShowShortcuts(!showShortcuts)}
                        className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        title="Keyboard shortcuts (?)"
                    >
                        <Keyboard className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => router.push("/settings/calendars")}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        title="Calendar Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>
        );
    };

    // Render sidebar
    const renderSidebar = () => (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
                fixed md:static inset-y-0 left-0 z-40
                w-64 border-r border-gray-200 dark:border-gray-700 
                bg-gray-50 dark:bg-gray-900 p-4 flex flex-col
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Mobile close button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Mini Calendar */}
                <div className="mb-6 mt-8 md:mt-0">
                    <MiniCalendar
                        currentDate={currentDate}
                        onDateSelect={(date) => {
                            setCurrentDate(date);
                            if (viewMode === "month") setViewMode("day");
                            setSidebarOpen(false); // Close on mobile after selection
                        }}
                    />
                </div>

                {/* Calendar Sources */}
                <div className="flex-1 overflow-auto">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        My Calendars
                    </h3>
                    {sources.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No calendars connected.{" "}
                            <button
                                onClick={() => router.push("/settings/calendars")}
                                className="text-blue-600 hover:underline"
                            >
                                Add one
                            </button>
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {sources.map((source) => (
                                <label
                                    key={source.id}
                                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 -mx-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={visibleSourceIds.has(source.id)}
                                        onChange={() => toggleSourceVisibility(source.id)}
                                        className="w-4 h-4 rounded"
                                        style={{
                                            accentColor: source.color || "#6B7280",
                                        }}
                                    />
                                    <span
                                        className="w-3 h-3 rounded-sm flex-shrink-0"
                                        style={{ backgroundColor: source.color || "#6B7280" }}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                                        {source.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );

    // Render main content
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <Spinner size="lg" />
                </div>
            );
        }

        switch (viewMode) {
            case "month":
                return (
                    <MonthView
                        currentDate={currentDate}
                        events={filteredEvents}
                        onEventClick={openEditModal}
                        onDateClick={(date) => openCreateModal(date)}
                    />
                );
            case "week":
                return (
                    <WeekView
                        currentDate={currentDate}
                        events={filteredEvents}
                        onEventClick={openEditModal}
                        onTimeSlotClick={(date, hour) => openCreateModal(date, hour)}
                        onEventDrop={handleEventDrop}
                    />
                );
            case "day":
                return (
                    <DayView
                        currentDate={currentDate}
                        events={filteredEvents}
                        onEventClick={openEditModal}
                        onTimeSlotClick={(hour) => openCreateModal(currentDate, hour)}
                        onEventDrop={handleEventDrop}
                    />
                );
        }
    };

    // Handle drag-drop event reschedule
    const handleEventDrop = async (eventId: string, newStart: Date, newEnd: Date) => {
        try {
            await eventsApi.updateEvent(eventId, {
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString(),
            });
            addToast({ type: "success", title: "Event rescheduled", duration: 3000 });
            loadEvents();
        } catch (error) {
            addToast({ type: "error", title: "Failed to reschedule", duration: 5000 });
        }
    };

    return (
        <div ref={containerRef} className="h-[calc(100vh-4rem)] flex flex-col bg-white dark:bg-gray-900">
            {renderHeader()}
            <div className="flex-1 flex overflow-hidden relative">
                {renderSidebar()}
                <main className="flex-1 overflow-auto">{renderContent()}</main>
            </div>

            {/* Event Modal */}
            {eventModal.isOpen && (
                <EventModal
                    event={eventModal.event}
                    defaultDate={eventModal.date}
                    defaultHour={eventModal.startHour}
                    writableSources={writableSources}
                    onClose={closeModal}
                    onCreate={handleEventCreate}
                    onUpdate={handleEventUpdate}
                    onDelete={handleEventDelete}
                />
            )}

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
                            <button onClick={() => setShowShortcuts(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Previous</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">←</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Next</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">→</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Today</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">T</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">New Event</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">N</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Quick Focus Block</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">⇧N</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Day View</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">D</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Week View</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">W</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Month View</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">M</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Refresh</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">R</kbd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Toggle Sidebar</span>
                                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">S</kbd>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <a
                                href="/calendar/help"
                                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                            >
                                View full guide →
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Mini Calendar Component
function MiniCalendar({
    currentDate,
    onDateSelect,
}: {
    currentDate: Date;
    onDateSelect: (date: Date) => void;
}) {
    const [displayMonth, setDisplayMonth] = useState(currentDate);

    const monthStart = startOfMonth(displayMonth);
    const firstDay = monthStart.getDay();
    const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
    const today = new Date();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setDisplayMonth(addMonths(displayMonth, -1))}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS_SHORT.map((d, i) => (
                    <div key={i} className="text-xs text-gray-500 dark:text-gray-400 font-medium py-1">
                        {d}
                    </div>
                ))}
                {days.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const date = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
                    const isToday = isSameDay(date, today);
                    const isSelected = isSameDay(date, currentDate);

                    return (
                        <button
                            key={i}
                            onClick={() => onDateSelect(date)}
                            className={`text-xs w-7 h-7 rounded-full transition-colors ${isSelected
                                ? "bg-blue-600 text-white"
                                : isToday
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Month View Component
function MonthView({
    currentDate,
    events,
    onEventClick,
    onDateClick,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onDateClick: (date: Date) => void;
}) {
    const today = new Date();
    const monthStart = startOfMonth(currentDate);
    const viewStart = addDays(monthStart, -monthStart.getDay());

    const weeks: Date[][] = [];
    let current = viewStart;
    for (let w = 0; w < 6; w++) {
        const week: Date[] = [];
        for (let d = 0; d < 7; d++) {
            week.push(new Date(current));
            current = addDays(current, 1);
        }
        weeks.push(week);
    }

    const getEventsForDate = (date: Date) => {
        return events.filter((e) => isSameDay(new Date(e.startTime), date)).slice(0, 3);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {weeks.flat().map((date, i) => {
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = isSameDay(date, today);
                    const dayEvents = getEventsForDate(date);

                    return (
                        <div
                            key={i}
                            onClick={() => onDateClick(date)}
                            className={`border-r border-b border-gray-200 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!isCurrentMonth ? "bg-gray-50 dark:bg-gray-850" : ""
                                }`}
                        >
                            <div
                                className={`text-sm mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday
                                    ? "bg-blue-600 text-white"
                                    : isCurrentMonth
                                        ? "text-gray-900 dark:text-white"
                                        : "text-gray-400 dark:text-gray-600"
                                    }`}
                            >
                                {date.getDate()}
                            </div>
                            <div className="space-y-1">
                                {dayEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        className="text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80"
                                        style={{
                                            backgroundColor: event.sourceColor || "#3B82F6",
                                            color: "#fff",
                                        }}
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {events.filter((e) => isSameDay(new Date(e.startTime), date)).length > 3 && (
                                    <div className="text-xs text-gray-500 px-2">
                                        +{events.filter((e) => isSameDay(new Date(e.startTime), date)).length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Week View Component
function WeekView({
    currentDate,
    events,
    onEventClick,
    onTimeSlotClick,
    onEventDrop,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onTimeSlotClick: (date: Date, hour: number) => void;
    onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
}) {
    const today = new Date();
    const weekStart = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const getEventsForDateHour = (date: Date, hour: number) => {
        return events.filter((e) => {
            const eventDate = new Date(e.startTime);
            return isSameDay(eventDate, date) && eventDate.getHours() === hour;
        });
    };

    return (
        <div className="flex flex-col h-full overflow-auto">
            {/* Header */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div className="w-16 flex-shrink-0" />
                {days.map((date, i) => {
                    const isToday = isSameDay(date, today);
                    return (
                        <div
                            key={i}
                            className="flex-1 text-center py-3 border-l border-gray-200 dark:border-gray-700"
                        >
                            <div className="text-sm text-gray-500 dark:text-gray-400">{WEEKDAYS[i]}</div>
                            <div
                                className={`text-2xl font-light mt-1 ${isToday
                                    ? "w-10 h-10 rounded-full bg-blue-600 text-white mx-auto flex items-center justify-center"
                                    : "text-gray-900 dark:text-white"
                                    }`}
                            >
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Grid */}
            <div className="flex-1">
                {HOURS.map((hour) => (
                    <div key={hour} className="flex border-b border-gray-100 dark:border-gray-800">
                        <div className="w-16 flex-shrink-0 text-right pr-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            {hour === 0 ? "" : `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`}
                        </div>
                        {days.map((date, dayIndex) => {
                            const hourEvents = getEventsForDateHour(date, hour);
                            return (
                                <div
                                    key={dayIndex}
                                    onClick={() => onTimeSlotClick(date, hour)}
                                    className="flex-1 border-l border-gray-100 dark:border-gray-800 h-14 relative cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                                >
                                    {hourEvents.map((event) => {
                                        const startDate = new Date(event.startTime);
                                        const endDate = new Date(event.endTime);
                                        const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
                                        const topOffset = (startDate.getMinutes() / 60) * 100;
                                        const height = Math.max(durationHours * 100, 20);

                                        return (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick(event);
                                                }}
                                                className="absolute left-1 right-1 rounded px-2 py-1 text-xs overflow-hidden cursor-pointer hover:opacity-80 z-10"
                                                style={{
                                                    top: `${topOffset}%`,
                                                    height: `${height}%`,
                                                    backgroundColor: event.sourceColor || "#3B82F6",
                                                    color: "#fff",
                                                }}
                                            >
                                                <div className="font-medium truncate">{event.title}</div>
                                                <div className="opacity-80">
                                                    {formatTime(startDate)} - {formatTime(endDate)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Day View Component
function DayView({
    currentDate,
    events,
    onEventClick,
    onTimeSlotClick,
    onEventDrop,
}: {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick: (event: CalendarEvent) => void;
    onTimeSlotClick: (hour: number) => void;
    onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
}) {
    const dayEvents = events.filter((e) => isSameDay(new Date(e.startTime), currentDate));

    const getEventsForHour = (hour: number) => {
        return dayEvents.filter((e) => new Date(e.startTime).getHours() === hour);
    };

    return (
        <div className="flex flex-col h-full overflow-auto">
            {/* Time Grid */}
            <div className="flex-1">
                {HOURS.map((hour) => {
                    const hourEvents = getEventsForHour(hour);
                    return (
                        <div key={hour} className="flex border-b border-gray-100 dark:border-gray-800">
                            <div className="w-20 flex-shrink-0 text-right pr-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {hour === 0 ? "" : `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`}
                            </div>
                            <div
                                onClick={() => onTimeSlotClick(hour)}
                                className="flex-1 h-16 relative cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-l border-gray-200 dark:border-gray-700"
                            >
                                {hourEvents.map((event, idx) => {
                                    const startDate = new Date(event.startTime);
                                    const endDate = new Date(event.endTime);
                                    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
                                    const topOffset = (startDate.getMinutes() / 60) * 100;
                                    const height = Math.max(durationHours * 100, 40);

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(event);
                                            }}
                                            className="absolute rounded-lg px-3 py-2 text-sm overflow-hidden cursor-pointer hover:opacity-80 z-10"
                                            style={{
                                                top: `${topOffset}%`,
                                                height: `${height}%`,
                                                left: `${idx * 10 + 4}px`,
                                                right: "4px",
                                                backgroundColor: event.sourceColor || "#3B82F6",
                                                color: "#fff",
                                            }}
                                        >
                                            <div className="font-medium">{event.title}</div>
                                            <div className="opacity-80 flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(startDate)} - {formatTime(endDate)}
                                            </div>
                                            {event.location && (
                                                <div className="opacity-80 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {event.location}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Event Modal Component
function EventModal({
    event,
    defaultDate,
    defaultHour,
    writableSources,
    onClose,
    onCreate,
    onUpdate,
    onDelete,
}: {
    event: CalendarEvent | null;
    defaultDate?: Date;
    defaultHour?: number;
    writableSources: WritableCalendarSource[];
    onClose: () => void;
    onCreate: (data: CreateCalendarEventInput) => Promise<void>;
    onUpdate: (id: string, data: UpdateCalendarEventInput) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}) {
    const isEditing = !!event;

    const getDefaultStartTime = () => {
        const d = defaultDate ? new Date(defaultDate) : new Date();
        d.setHours(defaultHour ?? 9, 0, 0, 0);
        return d.toISOString().slice(0, 16);
    };

    const getDefaultEndTime = () => {
        const d = defaultDate ? new Date(defaultDate) : new Date();
        d.setHours((defaultHour ?? 9) + 1, 0, 0, 0);
        return d.toISOString().slice(0, 16);
    };

    const [title, setTitle] = useState(event?.title || "");
    const [description, setDescription] = useState(event?.description || "");
    const [location, setLocation] = useState(event?.location || "");
    const [startTime, setStartTime] = useState(
        event ? event.startTime.slice(0, 16) : getDefaultStartTime()
    );
    const [endTime, setEndTime] = useState(
        event ? event.endTime.slice(0, 16) : getDefaultEndTime()
    );
    const [sourceId, setSourceId] = useState(
        event?.sourceId || writableSources.find((s) => s.isPrimary)?.id || writableSources[0]?.id || ""
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [conflicts, setConflicts] = useState<BusyTimeSlot[]>([]);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

    // Check for conflicts when time changes
    useEffect(() => {
        const checkConflicts = async () => {
            if (!startTime || !endTime) return;

            setIsCheckingConflicts(true);
            try {
                const result = await eventsApi.checkConflicts(
                    new Date(startTime).toISOString(),
                    new Date(endTime).toISOString(),
                    isEditing ? event.id : undefined
                );
                setConflicts(result.conflicts);
            } catch (error) {
                console.error("Failed to check conflicts:", error);
            } finally {
                setIsCheckingConflicts(false);
            }
        };

        const debounce = setTimeout(checkConflicts, 300);
        return () => clearTimeout(debounce);
    }, [startTime, endTime, isEditing, event?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await onUpdate(event.id, {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    location: location.trim() || undefined,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                });
            } else {
                await onCreate({
                    sourceId,
                    title: title.trim(),
                    description: description.trim() || undefined,
                    location: location.trim() || undefined,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedSource = writableSources.find((s) => s.id === sourceId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {isEditing ? "Edit Event" : "Create Event"}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                        <Input
                            placeholder="Add title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-medium border-0 border-b rounded-none focus:ring-0 px-0"
                            autoFocus
                        />

                        {!isEditing && writableSources.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Calendar
                                </label>
                                <select
                                    value={sourceId}
                                    onChange={(e) => setSourceId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                                >
                                    {writableSources.map((source) => (
                                        <option key={source.id} value={source.id}>
                                            {source.name} ({source.providerEmail})
                                        </option>
                                    ))}
                                </select>
                                {selectedSource && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: selectedSource.color || "#6B7280" }}
                                        />
                                        <span className="text-xs text-gray-500">{selectedSource.provider}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Start
                                </label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    End
                                </label>
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>

                        {/* Conflict Warning */}
                        {conflicts.length > 0 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                            Time Conflict Detected
                                        </p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                            This time overlaps with {conflicts.length} event{conflicts.length > 1 ? 's' : ''} from other calendars:
                                        </p>
                                        <ul className="mt-2 space-y-1">
                                            {conflicts.slice(0, 3).map((conflict) => (
                                                <li key={conflict.id} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: conflict.sourceColor }}
                                                    />
                                                    <span className="font-medium">{conflict.title}</span>
                                                    <span className="text-amber-500">
                                                        ({conflict.sourceName})
                                                    </span>
                                                </li>
                                            ))}
                                            {conflicts.length > 3 && (
                                                <li className="text-xs text-amber-500">
                                                    +{conflicts.length - 3} more conflicts
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        {isCheckingConflicts && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Spinner size="sm" />
                                Checking for conflicts...
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Location
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Add location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                placeholder="Add description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(event.id)}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!title.trim() || (!isEditing && !sourceId) || isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSubmitting ? (
                                    <Spinner size="sm" />
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        {isEditing ? "Save" : "Create"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
