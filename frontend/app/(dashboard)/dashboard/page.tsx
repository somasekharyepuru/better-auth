"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { daysApi, formatDate, Day } from "@/lib/daymark-api";
import { useSettings } from "@/lib/settings-context";
import { useLifeAreas } from "@/lib/life-areas-context";
import { Spinner } from "@/components/ui/spinner";
import { DayProgress } from "@/components/daymark/day-progress";
import { TopPriorities } from "@/components/daymark/top-priorities";
import { ToDiscuss } from "@/components/daymark/to-discuss";
import { TimeBlocks } from "@/components/daymark/time-blocks";
import { QuickNotes } from "@/components/daymark/quick-notes";
import { EndOfDayReview } from "@/components/daymark/end-of-day-review";
import { LifeAreaSelector } from "@/components/daymark/life-area-selector";
import { ChevronLeft, ChevronRight, Moon, Settings, CalendarDays } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => formatDate(new Date()));
  const [dayData, setDayData] = useState<Day | null>(null);
  const [isDayLoading, setIsDayLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();
  const { settings, isSectionEnabled } = useSettings();
  const { selectedLifeArea, isLoading: isLifeAreasLoading } = useLifeAreas();

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionData = await authClient.getSession();

        if (!sessionData?.data) {
          router.push("/login");
          return;
        }

        setUser(sessionData.data.user as User);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Load day data
  const loadDayData = useCallback(async () => {
    if (!selectedLifeArea) return;
    setIsDayLoading(true);
    try {
      const data = await daysApi.getDay(currentDate, selectedLifeArea.id);
      setDayData(data);
    } catch (error) {
      console.error("Failed to load day data:", error);
    } finally {
      setIsDayLoading(false);
    }
  }, [currentDate, selectedLifeArea]);

  useEffect(() => {
    if (user && selectedLifeArea) {
      loadDayData();
    }
  }, [user, currentDate, selectedLifeArea, loadDayData]);

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

  // Format display date
  const displayDate = new Date(currentDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (isLoading || isLifeAreasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate progress
  const completedCount = dayData?.priorities.filter((p) => p.completed).length || 0;
  const totalCount = dayData?.priorities.length || 0;

  // Get incomplete priorities for review
  const incompletePriorities = dayData?.priorities.filter((p) => !p.completed) || [];

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Format premium date display
  const dayOfWeek = new Date(currentDate).toLocaleDateString("en-US", { weekday: "long" });
  const dayNumber = new Date(currentDate).getDate();
  const monthYear = new Date(currentDate).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Check which sections to show
  const showProgress = isSectionEnabled("progress");
  const showPriorities = isSectionEnabled("priorities");
  const showDiscussion = isSectionEnabled("discussion");
  const showSchedule = isSectionEnabled("schedule");
  const showNotes = isSectionEnabled("notes");
  const showReviewButton = settings.endOfDayReviewEnabled;

  return (
    <div className="bg-premium">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-4">
          {/* Premium Date Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Date Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextDay}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Premium Date Display */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                    {dayNumber}
                  </span>
                  <div className="flex flex-col justify-center">
                    <span className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                      {dayOfWeek}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 leading-tight">
                      {monthYear}
                    </span>
                  </div>
                </div>

                {/* Today indicator or Back to Today */}
                {isToday ? (
                  <span className="px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">
                    Today
                  </span>
                ) : (
                  <button
                    onClick={goToToday}
                    className="px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    ← Today
                  </button>
                )}

                {/* Date Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    title="Pick a date"
                  >
                    <CalendarDays className="w-5 h-5" />
                  </button>
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCurrentDate(e.target.value);
                        setShowDatePicker(false);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Greeting (right side) */}
            {isToday && user && (
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {getGreeting()}, <span className="text-gray-700 dark:text-gray-300 font-medium">{user.name.split(" ")[0]}</span>
              </p>
            )}
          </div>

          {/* Secondary Toolbar: Life Areas + Actions */}
          <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
            {/* Life Area Tabs */}
            <LifeAreaSelector />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* End of day review button */}
              {showReviewButton && (
                <button
                  onClick={() => setShowReview(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Moon className="w-4 h-4" />
                  <span className="hidden sm:inline">End of Day</span>
                </button>
              )}

              {/* Settings button */}
              <button
                onClick={() => router.push("/settings")}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Day Progress */}
          {showProgress && (
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
                    onUpdate={loadDayData}
                    maxItems={settings.maxTopPriorities}
                    lifeAreaId={selectedLifeArea?.id}
                  />
                )}
                {showDiscussion && (
                  <ToDiscuss
                    date={currentDate}
                    items={dayData?.discussionItems || []}
                    onUpdate={loadDayData}
                    maxItems={settings.maxDiscussionItems}
                  />
                )}
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-4 h-full">
                {showSchedule && (
                  <TimeBlocks
                    date={currentDate}
                    blocks={dayData?.timeBlocks || []}
                    onUpdate={loadDayData}
                    defaultDuration={settings.defaultTimeBlockDuration}
                    defaultType={settings.defaultTimeBlockType}
                  />
                )}
                {showNotes && (
                  <QuickNotes
                    date={currentDate}
                    note={dayData?.quickNote || null}
                    onUpdate={loadDayData}
                    className="flex-1 min-h-[200px]"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* End of Day Review Modal */}
      <EndOfDayReview
        date={currentDate}
        review={dayData?.dailyReview || null}
        incompletePriorities={incompletePriorities}
        onUpdate={loadDayData}
        isOpen={showReview}
        onClose={() => setShowReview(false)}
      />
    </div>
  );
}

