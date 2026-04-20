"use client";

import { useEffect, useState, useCallback } from "react";
import {
  daysApi,
  formatDate,
  Day,
  TopPriority,
  DiscussionItem,
  TimeBlock,
  QuickNote,
} from "@/lib/daymark-api";
import { useSettings } from "@/lib/settings-context";
import { useLifeAreas } from "@/lib/life-areas-context";
import { useDayQuery } from "@/hooks/queries/use-day";
import dayjs from "dayjs";
import { Spinner } from "@/components/ui/spinner";
import { DatePickerIcon } from "@/components/ui/date-picker";
import { DayProgress } from "@/components/daymark/day-progress";
import { TopPriorities } from "@/components/daymark/top-priorities/index";
import { ToDiscuss } from "@/components/daymark/to-discuss";
import { TimeBlocks } from "@/components/daymark/time-blocks";
import { QuickNotes } from "@/components/daymark/quick-notes";
import { EndOfDayReview } from "@/components/daymark/end-of-day-review";
import { LifeAreaSelector } from "@/components/daymark/life-area-selector";
import { ChevronLeft, ChevronRight, Moon } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface DashboardContentProps {
  user: User;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));
  const [showReview, setShowReview] = useState(false);
  const { settings, isSectionEnabled } = useSettings();
  const {
    selectedLifeArea,
    lifeAreas,
    isLoading: isLifeAreasLoading,
  } = useLifeAreas();

  // Load day data using React Query
  const { data: dayData, isLoading: isDayLoading, refetch: loadDayData } = useDayQuery(
    currentDate,
    selectedLifeArea?.id || null
  );



  // Date navigation
  const goToPreviousDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    setCurrentDate(formatDate(date));
  };

  const goToNextDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    setCurrentDate(formatDate(date));
  };

  const goToToday = () => {
    setCurrentDate(formatDate(new Date()));
  };

  const isToday = currentDate === formatDate(new Date());
  const isPastDay = dayjs(currentDate).isBefore(dayjs().startOf('day'));

  if (isLifeAreasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  // Calculate progress
  const completedCount =
    dayData?.priorities.filter((p) => p.completed).length || 0;
  const totalCount = dayData?.priorities.length || 0;

  // Get incomplete priorities for review (exclude already carried ones)
  const incompletePriorities =
    dayData?.priorities.filter((p) => !p.completed && !p.carriedToDate) || [];

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Format premium date display
  const dayOfWeek = new Date(currentDate).toLocaleDateString("en-US", {
    weekday: "long",
  });
  const dayNumber = new Date(currentDate).getDate();
  const monthYear = new Date(currentDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstName = user.name.split(" ")[0] || user.name;

  // Check which sections to show
  const showProgress = isSectionEnabled("progress");
  const showPriorities = isSectionEnabled("priorities");
  const showDiscussion = isSectionEnabled("discussion");
  const showSchedule = isSectionEnabled("schedule");
  const showNotes = isSectionEnabled("notes");
  const showReviewButton = settings.endOfDayReviewEnabled;

  return (
    <>
      <div className="space-y-4">
          {/* Premium Date Header — greeting separated from date controls for clearer hierarchy */}
          <section
            className="rounded-2xl border border-gray-200/70 bg-white/70 px-4 py-4 shadow-sm dark:border-gray-700/70 dark:bg-gray-900/35 sm:px-5 sm:py-5"
            aria-label="Selected day"
          >
            {isToday && user && (
              <p className="mb-4 text-[15px] leading-snug text-gray-600 dark:text-gray-400 sm:text-base">
                {getGreeting()},{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">{firstName}</span>
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
                <div
                  className="flex shrink-0 items-center rounded-full border border-gray-200/90 bg-gray-50/90 p-0.5 dark:border-gray-600/80 dark:bg-gray-800/60"
                  role="group"
                  aria-label="Change day"
                >
                  <button
                    type="button"
                    onClick={goToPreviousDay}
                    className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextDay}
                    className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    aria-label="Next day"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
                  <span className="shrink-0 text-3xl font-bold tabular-nums leading-none tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    {dayNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white sm:text-base">
                      {dayOfWeek}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-gray-500 dark:text-gray-400 sm:text-sm">
                      {monthYear}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700/80 sm:border-t-0 sm:pt-0 sm:pl-2">
                {isToday ? (
                  <span className="px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-full">
                    Today
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
                <DatePickerIcon value={currentDate} onChange={(date) => setCurrentDate(date)} />
              </div>
            </div>
          </section>

          {/* Secondary Toolbar: Life Areas + Actions */}
          <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
            {/* Life Area Tabs */}
            <LifeAreaSelector showSettings />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* End of day review button - contextual appearance */}
              {showReviewButton &&
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

          {/* Past Day Indicator */}
          {isPastDay && (
            <div className="flex items-center justify-center gap-2 py-2 text-gray-500 dark:text-gray-400">
              <span className="text-sm">
                Viewing past day • Notes and review are still editable
              </span>
            </div>
          )}

          {/* Day Progress - only show when at least one priority is completed */}
          {showProgress && completedCount > 0 && (
            <div className="card-subtle">
              <DayProgress completed={completedCount} total={totalCount} />
            </div>
          )}

          {/* Main Grid */}
          {isDayLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {showPriorities && (
                  <TopPriorities
                    date={currentDate}
                    priorities={dayData?.priorities || []}
                    onUpdate={() => {}} // Legacy prop kept for compatibility if needed before complete rewrite
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

              {/* Right Column */}
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
        </div>

      {/* End of Day Review Modal */}
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
