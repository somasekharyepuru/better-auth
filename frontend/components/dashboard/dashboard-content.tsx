"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/daymark-api";
import { useSettings } from "@/lib/settings-context";
import { useLifeAreas } from "@/lib/life-areas-context";
import {
  useDayQuery,
  useDaysRangeQuery,
  invalidateDayCaches,
} from "@/hooks/queries/use-day";
import dayjs, { Dayjs } from "dayjs";
import { Spinner } from "@/components/ui/spinner";
import { DatePickerIcon } from "@/components/ui/date-picker";
import { DayProgress } from "@/components/daymark/day-progress";
import { TopPriorities } from "@/components/daymark/top-priorities/index";
import { ToDiscuss } from "@/components/daymark/to-discuss";
import { TimeBlocks } from "@/components/daymark/time-blocks";
import { QuickNotes } from "@/components/daymark/quick-notes";
import { EndOfDayReview } from "@/components/daymark/end-of-day-review";
import { LifeAreaSelector } from "@/components/daymark/life-area-selector";
import { WeekView } from "@/components/dashboard/week-view";
import { MonthView } from "@/components/dashboard/month-view";
import { ChevronLeft, ChevronRight, Moon } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface DashboardContentProps {
  user: User;
}

type ViewMode = "day" | "week" | "month";

/**
 * Builds the inclusive Sun..Sat 7-day window that contains `anchor`.
 * Returns Dayjs objects so callers can derive whatever shape they need.
 */
function buildWeekDates(anchor: Dayjs): Dayjs[] {
  const start = anchor.startOf("week"); // dayjs default = Sunday
  return Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
}

/**
 * Builds a 6-row × 7-col padded month grid (Sun-first) covering the calendar
 * weeks that intersect `anchor`'s month. Always returns 42 dates so the
 * grid layout is stable across months.
 */
function buildMonthGrid(anchor: Dayjs): Dayjs[] {
  const monthStart = anchor.startOf("month");
  const gridStart = monthStart.startOf("week");
  return Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [showReview, setShowReview] = useState(false);
  const { settings, isSectionEnabled } = useSettings();
  const {
    selectedLifeArea,
    lifeAreas,
    isLoading: isLifeAreasLoading,
  } = useLifeAreas();

  const queryClient = useQueryClient();

  // ---- Day-view data ----
  const {
    data: dayData,
    isLoading: isDayLoading,
    refetch: refetchDay,
  } = useDayQuery(currentDate, selectedLifeArea?.id || null);

  // Components like EndOfDayReview / TopPriorities pass an `onUpdate` callback.
  // We refetch the day query AND invalidate the range cache so week / month
  // views reflect the change immediately.
  const loadDayData = useCallback(() => {
    invalidateDayCaches(queryClient, currentDate, selectedLifeArea?.id || null);
    return refetchDay();
  }, [queryClient, currentDate, selectedLifeArea?.id, refetchDay]);

  // ---- Week / Month range data ----
  const anchor = useMemo(() => dayjs(currentDate), [currentDate]);

  const weekDates = useMemo(() => buildWeekDates(anchor), [anchor]);
  const monthGrid = useMemo(() => buildMonthGrid(anchor), [anchor]);

  // The active range driving the API call. We only fetch the range that the
  // current view actually needs to keep the dashboard snappy.
  const rangeStart =
    viewMode === "week"
      ? weekDates[0].format("YYYY-MM-DD")
      : viewMode === "month"
        ? monthGrid[0].format("YYYY-MM-DD")
        : "";
  const rangeEnd =
    viewMode === "week"
      ? weekDates[weekDates.length - 1].format("YYYY-MM-DD")
      : viewMode === "month"
        ? monthGrid[monthGrid.length - 1].format("YYYY-MM-DD")
        : "";

  const { data: rangeData, isLoading: isRangeLoading } = useDaysRangeQuery(
    rangeStart,
    rangeEnd,
    viewMode === "day" ? null : selectedLifeArea?.id || null,
  );
  // Disable range fetch when in day view by leaving start/end empty (the hook
  // is `enabled` only when both are present).
  const effectiveRangeData = viewMode === "day" ? [] : rangeData ?? [];
  const effectiveRangeLoading = viewMode !== "day" && isRangeLoading;

  // ---- Navigation across all view modes ----
  const goPrev = () => {
    const unit: dayjs.ManipulateType =
      viewMode === "month" ? "month" : viewMode === "week" ? "week" : "day";
    setCurrentDate(anchor.subtract(1, unit).format("YYYY-MM-DD"));
  };

  const goNext = () => {
    const unit: dayjs.ManipulateType =
      viewMode === "month" ? "month" : viewMode === "week" ? "week" : "day";
    setCurrentDate(anchor.add(1, unit).format("YYYY-MM-DD"));
  };

  const goToToday = () => setCurrentDate(formatDate(new Date()));

  const isToday = currentDate === formatDate(new Date());
  const isPastDay = dayjs(currentDate).isBefore(dayjs().startOf("day"));

  // "Are we currently looking at a range that contains today?" — used to swap
  // the "← Today" button for a contextual badge so the button never appears
  // to be a no-op. In week/month view, currentDate is just an anchor inside
  // the visible range, so a string-equality check (isToday) isn't enough.
  const todayStr = formatDate(new Date());
  const today = dayjs(todayStr);
  const viewContainsToday =
    viewMode === "day"
      ? isToday
      : viewMode === "week"
        ? today.isSame(anchor, "week")
        : today.isSame(anchor, "month");
  const todayBadgeLabel =
    viewMode === "week"
      ? "This week"
      : viewMode === "month"
        ? "This month"
        : "Today";

  if (isLifeAreasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Day-view derived data
  const completedCount =
    dayData?.priorities.filter((p) => p.completed).length || 0;
  const totalCount = dayData?.priorities.length || 0;
  const incompletePriorities =
    dayData?.priorities.filter((p) => !p.completed && !p.carriedToDate) || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Header label adapts to current view
  const headerLabel = (() => {
    if (viewMode === "week") {
      const start = weekDates[0];
      const end = weekDates[weekDates.length - 1];
      const sameMonth = start.month() === end.month();
      const sameYear = start.year() === end.year();
      if (sameMonth) {
        return `${start.format("MMM D")} – ${end.format("D, YYYY")}`;
      }
      if (sameYear) {
        return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
      }
      return `${start.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`;
    }
    if (viewMode === "month") {
      return anchor.format("MMMM YYYY");
    }
    return null; // Day view uses its own large date display
  })();

  const dayOfWeek = anchor.format("dddd");
  const dayNumber = anchor.format("D");
  const monthYear = anchor.format("MMMM YYYY");
  const firstName = user.name.split(" ")[0] || user.name;

  const showProgress = isSectionEnabled("progress");
  const showPriorities = isSectionEnabled("priorities");
  const showDiscussion = isSectionEnabled("discussion");
  const showSchedule = isSectionEnabled("schedule");
  const showNotes = isSectionEnabled("notes");
  const showReviewButton = settings.endOfDayReviewEnabled;

  // Selecting a date in week/month should drop us back into day view for it.
  const handleSelectDate = (date: string) => {
    setCurrentDate(date);
    setViewMode("day");
  };

  return (
    <>
      <div className="space-y-4">
        {/* Premium Date Header — adapts to view mode */}
        <section
          className="rounded-2xl border border-gray-200/70 bg-white/70 px-4 py-3 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/35 sm:px-5 sm:py-4"
          aria-label="Selected day"
        >
          {viewMode === "day" && isToday && user && (
            <p className="mb-2.5 text-[15px] leading-snug text-gray-600 dark:text-gray-400 sm:mb-3 sm:text-[15px]">
              {getGreeting()},{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {firstName}
              </span>
            </p>
          )}

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4">
              <div
                className="flex shrink-0 items-center rounded-full border border-gray-200/90 bg-gray-50/90 p-0.5 dark:border-gray-600/80 dark:bg-gray-800/60"
                role="group"
                aria-label={`Change ${viewMode}`}
              >
                <button
                  type="button"
                  onClick={goPrev}
                  className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  aria-label={`Previous ${viewMode}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  aria-label={`Next ${viewMode}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {viewMode === "day" ? (
                <div className="flex min-w-0 items-center gap-2 sm:gap-3.5">
                  <span className="shrink-0 text-[2rem] font-bold tabular-nums leading-none tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    {dayNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                      {dayOfWeek}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-gray-500 dark:text-gray-400 sm:text-sm">
                      {monthYear}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-tight text-gray-900 dark:text-white sm:text-xl">
                    {headerLabel}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-gray-500 dark:text-gray-400">
                    {viewMode === "week" ? "Week view" : "Month view"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-700/80 sm:border-t-0 sm:pt-0 sm:pl-2">
              {/* View switcher */}
              <ViewSwitcher value={viewMode} onChange={setViewMode} />

              {viewContainsToday ? (
                <span className="px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-full">
                  {todayBadgeLabel}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                >
                  ← Today
                </button>
              )}
              <DatePickerIcon
                value={currentDate}
                onChange={(date) => setCurrentDate(date)}
              />
            </div>
          </div>
        </section>

        {/* Secondary Toolbar: Life Areas + Actions */}
        <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
          <LifeAreaSelector showSettings />

          <div className="flex items-center gap-2">
            {/* End of day review only meaningful in day view */}
            {viewMode === "day" &&
              showReviewButton &&
              (() => {
                const currentHour = new Date().getHours();
                const allComplete =
                  totalCount > 0 && completedCount === totalCount;

                if (allComplete) {
                  return (
                    <button
                      onClick={() => setShowReview(true)}
                      className="btn-end-day-celebrate flex items-center gap-2"
                    >
                      <span>🎉</span>
                      <span className="hidden sm:inline">
                        All Done! Review Day
                      </span>
                      <span className="sm:hidden">Review</span>
                    </button>
                  );
                }

                if (currentHour >= 17) {
                  return (
                    <button
                      onClick={() => setShowReview(true)}
                      className="btn-end-day-prominent flex items-center gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        End of Day Review
                      </span>
                      <span className="sm:hidden">Review</span>
                    </button>
                  );
                }

                return (
                  <button
                    onClick={() => setShowReview(true)}
                    className="btn-end-day-subtle flex items-center gap-2"
                  >
                    <Moon className="w-4 h-4" />
                    <span className="hidden sm:inline">End Day Early</span>
                  </button>
                );
              })()}
          </div>
        </div>

        {/* Past Day Indicator (day view only) */}
        {viewMode === "day" && isPastDay && (
          <div className="flex items-center justify-center gap-2 py-2 text-gray-500 dark:text-gray-400">
            <span className="text-sm">
              Viewing past day • Notes and review are still editable
            </span>
          </div>
        )}

        {/* Day Progress (day view only) */}
        {viewMode === "day" && showProgress && completedCount > 0 && (
          <div className="card-subtle">
            <DayProgress completed={completedCount} total={totalCount} />
          </div>
        )}

        {/* Main content per view */}
        {viewMode === "day" && (
          <>
            {isDayLoading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {showPriorities && (
                    <TopPriorities
                      date={currentDate}
                      priorities={dayData?.priorities || []}
                      onUpdate={() => {}}
                      lifeAreaId={selectedLifeArea?.id}
                      readOnly={isPastDay}
                      lifeAreas={lifeAreas}
                      onMove={loadDayData}
                    />
                  )}
                  {showDiscussion && (
                    <ToDiscuss
                      date={currentDate}
                      items={dayData?.discussionItems || []}
                      onUpdate={() => {}}
                      lifeAreaId={selectedLifeArea?.id}
                      readOnly={isPastDay}
                      lifeAreas={lifeAreas}
                      onMove={loadDayData}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-4 h-full">
                  {showSchedule && (
                    <TimeBlocks
                      date={currentDate}
                      blocks={dayData?.timeBlocks || []}
                      onUpdate={() => {}}
                      defaultDuration={settings.defaultTimeBlockDuration}
                      defaultType={settings.defaultTimeBlockType}
                      lifeAreaId={selectedLifeArea?.id}
                      readOnly={isPastDay}
                    />
                  )}
                  {showNotes && (
                    <QuickNotes
                      date={currentDate}
                      note={dayData?.quickNote || null}
                      onUpdate={() => {}}
                      className="flex-1 min-h-[200px]"
                      lifeAreaId={selectedLifeArea?.id}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === "week" && (
          <WeekView
            selectedDate={currentDate}
            weekDates={weekDates.map((d) => d.format("YYYY-MM-DD"))}
            summaries={effectiveRangeData}
            isLoading={effectiveRangeLoading}
            onSelectDate={handleSelectDate}
          />
        )}

        {viewMode === "month" && (
          <MonthView
            monthAnchor={currentDate}
            selectedDate={currentDate}
            gridDates={monthGrid.map((d) => d.format("YYYY-MM-DD"))}
            summaries={effectiveRangeData}
            isLoading={effectiveRangeLoading}
            onSelectDate={handleSelectDate}
          />
        )}
      </div>

      <EndOfDayReview
        date={currentDate}
        review={dayData?.dailyReview || null}
        incompletePriorities={incompletePriorities}
        onUpdate={loadDayData}
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        lifeAreaId={selectedLifeArea?.id}
      />
    </>
  );
}

/**
 * Compact segmented control for switching between day / week / month views.
 * Kept inline to avoid pulling in another shared component for one-off use.
 */
function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const options: Array<{ id: ViewMode; label: string }> = [
    { id: "day", label: "Day" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Dashboard view"
      className="flex items-center rounded-full border border-gray-200/90 bg-gray-50/90 p-0.5 dark:border-gray-600/80 dark:bg-gray-800/60"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
