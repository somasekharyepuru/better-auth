"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  eventsApi,
  calendarApi,
  CalendarEvent,
  CalendarConnection,
  WritableCalendarSource,
  CreateCalendarEventInput,
} from "@/lib/daymark-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Video,
  ExternalLink,
  CalendarPlus,
  RefreshCw,
  Settings,
  Zap,
  Check,
  X,
  ChevronDown,
  AlertCircle,
  CalendarDays,
  Sparkles,
} from "lucide-react";

interface HeaderCalendarWidgetProps {
  variant?: "compact" | "full";
}

// Helper functions
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatEventTime(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return `${formatTime(start)} - ${formatTime(end)}`;
}

function isNow(startTime: string, endTime: string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  return now >= start && now <= end;
}

function isUpcoming(startTime: string, withinMinutes: number = 30): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const diffMs = start.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= withinMinutes * 60 * 1000;
}

function getTimeUntil(startTime: string): string {
  const now = new Date();
  const start = new Date(startTime);
  const diffMs = start.getTime() - now.getTime();

  if (diffMs <= 0) return "now";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `in ${hours}h`;
  return `in ${hours}h ${remainingMins}m`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function HeaderCalendarWidget({
  variant = "compact",
}: HeaderCalendarWidgetProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [writableSources, setWritableSources] = useState<
    WritableCalendarSource[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick create form state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSourceId, setQuickSourceId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const loadData = useCallback(async () => {
    try {
      const [eventsData, connectionsData] = await Promise.all([
        eventsApi.getEvents(today.toISOString(), tomorrow.toISOString()),
        calendarApi.getConnections(),
      ]);

      setEvents(
        eventsData.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
      );
      setConnections(connectionsData);

      // Load writable sources
      try {
        const sources = await eventsApi.getWritableSources();
        setWritableSources(sources);
        if (sources.length > 0 && !quickSourceId) {
          setQuickSourceId(
            sources.find((s) => s.isPrimary)?.id || sources[0].id,
          );
        }
      } catch {
        // Ignore if not available
      }
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [quickSourceId]);

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowQuickCreate(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    addToast({ type: "success", title: "Calendar refreshed", duration: 2000 });
  };

  const handleQuickCreate = async () => {
    if (!quickTitle.trim() || !quickSourceId) return;

    setIsCreating(true);
    try {
      const now = new Date();
      const startTime = new Date(now);
      startTime.setMinutes(Math.ceil(startTime.getMinutes() / 15) * 15, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      await eventsApi.createEvent({
        sourceId: quickSourceId,
        title: quickTitle.trim(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      addToast({ type: "success", title: "Event created", duration: 3000 });
      setQuickTitle("");
      setShowQuickCreate(false);
      loadData();
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to create event",
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Get current and upcoming events
  const now = new Date();
  const currentEvent = events.find((e) => isNow(e.startTime, e.endTime));
  const upcomingEvents = events.filter((e) => new Date(e.startTime) > now);
  const nextEvent = upcomingEvents[0];
  const hasUpcoming = upcomingEvents.length > 0;
  const nextEventSoon = nextEvent && isUpcoming(nextEvent.startTime, 30);

  // Calculate free time today
  const remainingEvents = events.filter((e) => new Date(e.endTime) > now);
  const busyMinutesToday = remainingEvents.reduce((total, e) => {
    const start = new Date(e.startTime);
    const end = new Date(e.endTime);
    const effectiveStart = start < now ? now : start;
    return (
      total +
      Math.max(0, (end.getTime() - effectiveStart.getTime()) / (1000 * 60))
    );
  }, 0);
  const freeHoursToday = Math.max(
    0,
    24 - now.getHours() - busyMinutesToday / 60,
  );

  const hasCalendarConnected = connections.some((c) => c.status === "ACTIVE");

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ${
          isOpen
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
        } ${currentEvent ? "ring-2 ring-green-500/50" : nextEventSoon ? "ring-2 ring-amber-500/50" : ""}`}
      >
        <div className="relative">
          <Calendar className="w-5 h-5" />
          {currentEvent && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          )}
          {!currentEvent && nextEventSoon && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
          )}
        </div>

        {variant === "full" && (
          <>
            <div className="hidden md:block text-left">
              {currentEvent ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {currentEvent.title}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Now
                  </span>
                </div>
              ) : nextEvent ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {nextEvent.title}
                  </span>
                  <span
                    className={`text-xs font-medium ${nextEventSoon ? "text-amber-600 dark:text-amber-400" : "text-gray-500"}`}
                  >
                    {getTimeUntil(nextEvent.startTime)}
                  </span>
                </div>
              ) : (
                <span className="text-sm">No more events today</span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        )}

        {/* Event count badge */}
        {variant === "compact" && remainingEvents.length > 0 && (
          <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {remainingEvents.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Today&apos;s Schedule
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => router.push("/settings/calendars")}
                  className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Today summary */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {hasCalendarConnected && (
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>~{freeHoursToday.toFixed(1)}h free</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : !hasCalendarConnected ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                  <CalendarPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Connect Your Calendar
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Sync with Google, Microsoft, or Apple Calendar to see your
                  events here.
                </p>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/settings/calendars");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Calendar
                </Button>
              </div>
            ) : events.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Clear Day Ahead!
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  No events scheduled for today. Perfect time for deep work.
                </p>
                <Button
                  onClick={() => setShowQuickCreate(true)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Something
                </Button>
              </div>
            ) : (
              <div className="p-2">
                {/* Current Event Highlight */}
                {currentEvent && (
                  <div className="mb-2">
                    <div className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider px-3 py-1">
                      Happening Now
                    </div>
                    <EventCard event={currentEvent} isActive />
                  </div>
                )}

                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                  <div>
                    {currentEvent && (
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1 mt-2">
                        Coming Up
                      </div>
                    )}
                    <div className="space-y-1">
                      {upcomingEvents.slice(0, 5).map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          isNext={event.id === nextEvent?.id}
                        />
                      ))}
                      {upcomingEvents.length > 5 && (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-500">
                            +{upcomingEvents.length - 5} more events
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Past Events (completed) */}
                {events.filter((e) => new Date(e.endTime) <= now).length >
                  0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">
                      Completed
                    </div>
                    {events
                      .filter((e) => new Date(e.endTime) <= now)
                      .slice(-2)
                      .map((event) => (
                        <EventCard key={event.id} event={event} isPast />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Create Section */}
          {hasCalendarConnected && showQuickCreate && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Quick event title..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickCreate();
                    if (e.key === "Escape") setShowQuickCreate(false);
                  }}
                  className="flex-1 h-9 text-sm"
                  autoFocus
                />
                <button
                  onClick={handleQuickCreate}
                  disabled={!quickTitle.trim() || isCreating}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  {isCreating ? (
                    <Spinner size="sm" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowQuickCreate(false);
                    setQuickTitle("");
                  }}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {writableSources.length > 1 && (
                <select
                  value={quickSourceId}
                  onChange={(e) => setQuickSourceId(e.target.value)}
                  className="mt-2 w-full text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5"
                >
                  {writableSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-2">
            {hasCalendarConnected && !showQuickCreate && (
              <Button
                onClick={() => setShowQuickCreate(true)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Quick Add
              </Button>
            )}
            {!hasCalendarConnected && <div />}
            <Button
              onClick={() => {
                setIsOpen(false);
                router.push("/calendar");
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Full Calendar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Event Card Component
function EventCard({
  event,
  isActive = false,
  isNext = false,
  isPast = false,
}: {
  event: CalendarEvent;
  isActive?: boolean;
  isNext?: boolean;
  isPast?: boolean;
}) {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const durationMins = Math.round(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60),
  );

  return (
    <div
      className={`group px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
        isActive
          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          : isNext
            ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20"
            : isPast
              ? "opacity-50 hover:opacity-70"
              : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Color indicator */}
        <div
          className={`w-1 rounded-full self-stretch min-h-[40px] ${isActive ? "bg-green-500" : ""}`}
          style={{
            backgroundColor: isActive
              ? undefined
              : event.sourceColor || "#6B7280",
          }}
        />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2">
            <span
              className={`font-medium truncate ${isPast ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}
            >
              {event.title}
            </span>
            {isActive && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-500 text-white rounded-full">
                LIVE
              </span>
            )}
          </div>

          {/* Time and metadata */}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatEventTime(event.startTime, event.endTime)}</span>
              <span className="text-gray-400">({durationMins}min)</span>
            </div>
          </div>

          {/* Location or video */}
          {event.location && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
              {event.location.includes("meet.google") ||
              event.location.includes("zoom") ? (
                <>
                  <Video className="w-3 h-3 text-blue-500" />
                  <a
                    href={event.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Join meeting
                  </a>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{event.location}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Time until indicator */}
        {isNext && !isActive && (
          <div className="text-right">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {getTimeUntil(event.startTime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
