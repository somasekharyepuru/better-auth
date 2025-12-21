"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { daysApi, formatDate, Day } from "@/lib/daymark-api";
import { useSettings } from "@/lib/settings-context";
import { Spinner } from "@/components/ui/spinner";
import { DayProgress } from "@/components/daymark/day-progress";
import { TopPriorities } from "@/components/daymark/top-priorities";
import { ToDiscuss } from "@/components/daymark/to-discuss";
import { TimeBlocks } from "@/components/daymark/time-blocks";
import { QuickNotes } from "@/components/daymark/quick-notes";
import { EndOfDayReview } from "@/components/daymark/end-of-day-review";
import { ChevronLeft, ChevronRight, Moon, Calendar, Settings } from "lucide-react";

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
  const router = useRouter();
  const { settings, isSectionEnabled } = useSettings();

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
    setIsDayLoading(true);
    try {
      const data = await daysApi.getDay(currentDate);
      setDayData(data);
    } catch (error) {
      console.error("Failed to load day data:", error);
    } finally {
      setIsDayLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    if (user) {
      loadDayData();
    }
  }, [user, currentDate, loadDayData]);

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

  if (isLoading) {
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

  // Check which sections to show
  const showProgress = isSectionEnabled("progress");
  const showPriorities = isSectionEnabled("priorities");
  const showDiscussion = isSectionEnabled("discussion");
  const showSchedule = isSectionEnabled("schedule");
  const showNotes = isSectionEnabled("notes");
  const showReviewButton = settings.endOfDayReviewEnabled;

  return (
    <div className="bg-premium">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header with date navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPreviousDay}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextDay}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h1 className="text-2xl text-heading">{displayDate}</h1>
                {isToday && (
                  <p className="text-sm text-muted">
                    Welcome back, {user.name.split(" ")[0]}
                  </p>
                )}
              </div>

              {!isToday && (
                <button
                  onClick={goToToday}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Today
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Settings button */}
              <button
                onClick={() => router.push("/settings")}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* End of day review button */}
              {showReviewButton && (
                <button
                  onClick={() => setShowReview(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Moon className="w-4 h-4" />
                  End of Day
                </button>
              )}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {showPriorities && (
                  <TopPriorities
                    date={currentDate}
                    priorities={dayData?.priorities || []}
                    onUpdate={loadDayData}
                    maxItems={settings.maxTopPriorities}
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
              <div className="flex flex-col gap-6 h-full">
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
                    className="flex-1 min-h-[300px]"
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

