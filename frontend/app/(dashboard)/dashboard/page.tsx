"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { daysApi, formatDate, Day } from "@/lib/daymark-api";
import { Spinner } from "@/components/ui/spinner";
import { DayProgress } from "@/components/daymark/day-progress";
import { TopPriorities } from "@/components/daymark/top-priorities";
import { ToDiscuss } from "@/components/daymark/to-discuss";
import { TimeBlocks } from "@/components/daymark/time-blocks";
import { QuickNotes } from "@/components/daymark/quick-notes";
import { EndOfDayReview } from "@/components/daymark/end-of-day-review";
import { ChevronLeft, ChevronRight, Moon, Calendar } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-2xl font-semibold text-gray-900">{displayDate}</h1>
                {isToday && (
                  <p className="text-sm text-gray-500">
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

            {/* End of day review button */}
            <button
              onClick={() => setShowReview(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Moon className="w-4 h-4" />
              End of Day
            </button>
          </div>

          {/* Day Progress */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <DayProgress completed={completedCount} total={totalCount} />
          </div>

          {/* Main Grid */}
          {isDayLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <TopPriorities
                  date={currentDate}
                  priorities={dayData?.priorities || []}
                  onUpdate={loadDayData}
                />
                <ToDiscuss
                  date={currentDate}
                  items={dayData?.discussionItems || []}
                  onUpdate={loadDayData}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <TimeBlocks
                  date={currentDate}
                  blocks={dayData?.timeBlocks || []}
                  onUpdate={loadDayData}
                />
                <QuickNotes
                  date={currentDate}
                  note={dayData?.quickNote || null}
                  onUpdate={loadDayData}
                />
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
