"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  eventsApi,
  calendarApi,
  CalendarEvent,
  CalendarConnection,
} from "@/lib/daymark-api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ChevronRight,
  CalendarPlus,
  Sparkles,
  Plus,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface UpcomingEventsDashboardCardProps {
  className?: string;
  maxEvents?: number;
  showHeader?: boolean;
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

function isUpcoming(startTime: string, withinMinutes: number = 15): boolean {
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

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) {
    return "Today";
  } else if (isSameDay(date, tomorrow)) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
}

export function UpcomingEventsDashboardCard({
  className = "",
  maxEvents = 5,
  showHeader = true,
}: UpcomingEventsDashboardCardProps) {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Get events for next 7 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const [eventsData, connectionsData] = await Promise.all([
        eventsApi.getEvents(today.toISOString(), nextWeek.toISOString()),
        calendarApi.getConnections(),
      ]);

      // Filter to only future events and sort
      const now = new Date();
      const futureEvents = eventsData
        .filter((e) => new Date(e.endTime) > now)
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );

      setEvents(futureEvents);
      setConnections(connectionsData);
    } catch (error) {
      console.error("Failed to load calendar data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const hasCalendarConnected = connections.some((c) => c.status === "ACTIVE");
  const currentEvent = events.find((e) => isNow(e.startTime, e.endTime));
  const upcomingEvents = events.filter(
    (e) => new Date(e.startTime) > new Date(),
  );

  // Group events by date
  const groupedEvents = upcomingEvents.slice(0, maxEvents).reduce(
    (acc, event) => {
      const dateKey = formatRelativeDate(event.startTime);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    },
    {} as Record<string, CalendarEvent[]>,
  );

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}
      >
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </div>
    );
  }

  if (!hasCalendarConnected) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-6 ${className}`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-4">
            <CalendarPlus className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Calendar
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-[250px]">
            Sync your Google, Microsoft, or Apple calendar to see your schedule
            and manage events.
          </p>
          <Button
            onClick={() => router.push("/settings/calendars")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect Calendar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}
    >
      {/* Header */}
      {showHeader && (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Upcoming Events
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Next 7 days
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/calendar")}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Current Event Banner */}
      {currentEvent && (
        <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-2 h-full min-h-[40px] rounded-full"
                style={{
                  backgroundColor: currentEvent.sourceColor || "#10B981",
                }}
              />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white truncate">
                  {currentEvent.title}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-500 text-white rounded-full flex-shrink-0">
                  NOW
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <Clock className="w-3 h-3" />
                {formatEventTime(currentEvent.startTime, currentEvent.endTime)}
              </div>
            </div>
            {currentEvent.location &&
              (currentEvent.location.includes("meet") ||
                currentEvent.location.includes("zoom")) && (
                <a
                  href={currentEvent.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  Join
                </a>
              )}
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="max-h-[350px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Clear Week Ahead
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No upcoming events. Time for focused work!
            </p>
          </div>
        ) : (
          <div className="p-3">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date} className="mb-3 last:mb-0">
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 py-1.5">
                  {date}
                </div>
                <div className="space-y-1">
                  {dateEvents.map((event) => (
                    <EventRow
                      key={event.id}
                      event={event}
                      isNext={
                        upcomingEvents[0]?.id === event.id && !currentEvent
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
            {upcomingEvents.length > maxEvents && (
              <div className="text-center pt-2">
                <button
                  onClick={() => router.push("/calendar")}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  +{upcomingEvents.length - maxEvents} more events
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-2">
        <Button
          onClick={() => router.push("/calendar")}
          variant="outline"
          size="sm"
          className="text-xs flex-1"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Event
        </Button>
        <Button
          onClick={() => router.push("/calendar")}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex-1"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          Open Calendar
        </Button>
      </div>
    </div>
  );
}

// Event Row Component
function EventRow({
  event,
  isNext,
}: {
  event: CalendarEvent;
  isNext?: boolean;
}) {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const isSoon = isUpcoming(event.startTime, 15);

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
        isNext
          ? "bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      {/* Color indicator */}
      <div
        className="w-1 rounded-full self-stretch min-h-[36px]"
        style={{ backgroundColor: event.sourceColor || "#6B7280" }}
      />

      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {event.title}
          </span>
          {isSoon && (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500 text-white rounded-full flex-shrink-0">
              SOON
            </span>
          )}
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          <span>
            {formatTime(startTime)} - {formatTime(endTime)}
          </span>
        </div>
      </div>

      {/* Time until */}
      {isNext && (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
          {getTimeUntil(event.startTime)}
        </span>
      )}

      {/* Video call link */}
      {event.location &&
        (event.location.includes("meet") ||
          event.location.includes("zoom")) && (
          <a
            href={event.location}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
            title="Join meeting"
          >
            <Video className="w-4 h-4" />
          </a>
        )}
    </div>
  );
}
