"use client";

import dayjs from "dayjs";
import { CheckCircle2, Circle, Clock, FileText, Moon } from "lucide-react";
import { DaySummary } from "@/lib/daymark-api";
import { Spinner } from "@/components/ui/spinner";
import { getCompletionTint } from "./completion-tint";

interface WeekViewProps {
  /** YYYY-MM-DD of any day inside the week. Used to highlight selection. */
  selectedDate: string;
  /** Inclusive 7-day window, in order Sun..Sat (or whatever the parent built). */
  weekDates: string[];
  summaries: DaySummary[];
  isLoading: boolean;
  onSelectDate: (date: string) => void;
}

/**
 * Renders a 7-column week overview of the user's Daymark days. Each column
 * surfaces the at-a-glance state (priority progress, schedule, note/review)
 * and clicking jumps the dashboard to that day's full view.
 */
export function WeekView({
  selectedDate,
  weekDates,
  summaries,
  isLoading,
  onSelectDate,
}: WeekViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Index by date for O(1) lookup; tolerate gaps if backend skipped a date.
  const summaryByDate = new Map(summaries.map((s) => [s.date, s]));
  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
      {weekDates.map((date) => {
        const summary = summaryByDate.get(date);
        const isToday = date === today;
        const isSelected = date === selectedDate;
        const d = dayjs(date);
        const completed = summary?.prioritiesCompleted ?? 0;
        const total = summary?.prioritiesTotal ?? 0;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const blocks = summary?.timeBlocks ?? [];
        const tint = getCompletionTint(completed, total);

        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDate(date)}
            // Selection wins over completion tint: it adds a stronger ring, but
            // we still keep the soft completion background so users can scan
            // multiple days at once and instantly see how each is trending.
            className={`group relative flex h-full min-h-[180px] flex-col rounded-xl border p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              tint.className
            } ${
              isSelected
                ? "ring-2 ring-emerald-400/50 dark:ring-emerald-500/50"
                : ""
            }`}
            aria-label={`Open ${d.format("dddd, MMMM D")} — ${tint.label}`}
            title={tint.label}
          >
            {/* Header: day name + date pill */}
            <header className="mb-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {d.format("ddd")}
                </span>
                <span
                  className={`text-2xl font-bold leading-none tabular-nums ${
                    isToday
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {d.format("D")}
                </span>
              </div>
              {isToday && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Today
                </span>
              )}
            </header>

            {/* Progress */}
            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                <span>
                  {total === 0 ? "No priorities" : `${completed}/${total} done`}
                </span>
                {total > 0 && <span className="tabular-nums">{pct}%</span>}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full transition-all ${
                    pct === 100
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Priorities preview */}
            {summary && summary.priorities.length > 0 && (
              <ul className="mb-2 space-y-1">
                {summary.priorities.slice(0, 3).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start gap-1.5 text-[11px] leading-tight text-gray-700 dark:text-gray-300"
                  >
                    {p.completed ? (
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
                    )}
                    <span
                      className={`line-clamp-1 ${
                        p.completed
                          ? "text-gray-400 line-through dark:text-gray-500"
                          : ""
                      }`}
                    >
                      {p.title}
                    </span>
                  </li>
                ))}
                {summary.priorities.length > 3 && (
                  <li className="text-[10px] text-gray-400">
                    +{summary.priorities.length - 3} more
                  </li>
                )}
              </ul>
            )}

            {/* Time blocks preview */}
            {blocks.length > 0 && (
              <div className="mb-2 space-y-1 border-t border-gray-100 pt-2 dark:border-gray-800">
                {blocks.slice(0, 2).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400"
                  >
                    <Clock className="h-3 w-3 shrink-0 text-gray-400" />
                    <span className="tabular-nums">
                      {dayjs(b.startTime).format("HH:mm")}
                    </span>
                    <span className="line-clamp-1">{b.title}</span>
                  </div>
                ))}
                {blocks.length > 2 && (
                  <div className="text-[10px] text-gray-400">
                    +{blocks.length - 2} more block
                    {blocks.length - 2 === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            )}

            {/* Footer indicators */}
            <footer className="mt-auto flex items-center justify-end gap-2 pt-1 text-gray-400">
              {summary?.hasQuickNote && (
                <FileText
                  className="h-3.5 w-3.5"
                  aria-label="Has quick note"
                />
              )}
              {summary?.hasReview && (
                <Moon
                  className="h-3.5 w-3.5 text-indigo-400"
                  aria-label="End-of-day review completed"
                />
              )}
            </footer>
          </button>
        );
      })}
    </div>
  );
}
