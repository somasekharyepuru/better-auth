"use client";

import dayjs from "dayjs";
import { FileText, Moon } from "lucide-react";
import { DaySummary } from "@/lib/daymark-api";
import { Spinner } from "@/components/ui/spinner";
import { getCompletionTint } from "./completion-tint";

interface MonthViewProps {
  /** YYYY-MM-DD anchoring the month being shown. */
  monthAnchor: string;
  /** YYYY-MM-DD currently selected (highlighted). */
  selectedDate: string;
  /**
   * The full grid of dates already padded to fit a 6-week window
   * (Sun..Sat × 6 rows = 42 dates). Built by the parent so we don't
   * re-do calendar math in two places.
   */
  gridDates: string[];
  summaries: DaySummary[];
  isLoading: boolean;
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Standard 6×7 month grid showing per-day snapshots: a tiny progress ring
 * for top priorities, a count of time blocks, and indicators for quick notes
 * and end-of-day reviews. Days outside the active month are de-emphasized.
 */
export function MonthView({
  monthAnchor,
  selectedDate,
  gridDates,
  summaries,
  isLoading,
  onSelectDate,
}: MonthViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const summaryByDate = new Map(summaries.map((s) => [s.date, s]));
  const today = dayjs().format("YYYY-MM-DD");
  const activeMonth = dayjs(monthAnchor).month();

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700/70 dark:bg-gray-900/40">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {gridDates.map((date, i) => {
          const summary = summaryByDate.get(date);
          const d = dayjs(date);
          const inMonth = d.month() === activeMonth;
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const completed = summary?.prioritiesCompleted ?? 0;
          const total = summary?.prioritiesTotal ?? 0;
          const blockCount = summary?.timeBlocksCount ?? 0;

          // Last column / last row trim borders for tidy edges
          const isLastCol = (i + 1) % 7 === 0;
          const isLastRow = i >= gridDates.length - 7;

          // Completion tint only applies to in-month days; out-of-month
          // padding cells stay muted so the grid's structure stays readable.
          const tint = inMonth ? getCompletionTint(completed, total) : null;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`group relative flex h-24 flex-col items-stretch gap-1 p-1.5 text-left transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:h-28 ${
                isLastCol
                  ? ""
                  : "border-r border-gray-100 dark:border-gray-800"
              } ${
                isLastRow
                  ? ""
                  : "border-b border-gray-100 dark:border-gray-800"
              } ${
                inMonth
                  ? `${tint?.className ?? ""} hover:brightness-95 dark:hover:brightness-110`
                  : "bg-gray-50/40 dark:bg-gray-900/20"
              } ${
                isSelected
                  ? "ring-1 ring-inset ring-emerald-400/70 dark:ring-emerald-500/70"
                  : ""
              }`}
              aria-label={`Open ${d.format("dddd, MMMM D")}${
                tint ? ` — ${tint.label}` : ""
              }`}
              title={tint?.label}
            >
              {/* Top row: date number + today badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                    isToday
                      ? "bg-emerald-500 text-white"
                      : inMonth
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {d.format("D")}
                </span>
                <div className="flex items-center gap-0.5">
                  {summary?.hasQuickNote && (
                    <FileText
                      className="h-3 w-3 text-gray-400"
                      aria-label="Has note"
                    />
                  )}
                  {summary?.hasReview && (
                    <Moon
                      className="h-3 w-3 text-indigo-400"
                      aria-label="Reviewed"
                    />
                  )}
                </div>
              </div>

              {/* Priorities ring + count */}
              {inMonth && total > 0 && (
                <div className="flex items-center gap-1.5">
                  <ProgressRing completed={completed} total={total} />
                  <span className="text-[10px] tabular-nums text-gray-600 dark:text-gray-400">
                    {completed}/{total}
                  </span>
                </div>
              )}

              {/* Time blocks dots */}
              {inMonth && blockCount > 0 && (
                <div className="mt-auto flex items-center gap-0.5">
                  {Array.from({ length: Math.min(blockCount, 5) }).map(
                    (_, idx) => (
                      <span
                        key={idx}
                        className="h-1.5 w-1.5 rounded-full bg-blue-400/80"
                      />
                    ),
                  )}
                  {blockCount > 5 && (
                    <span className="ml-0.5 text-[9px] text-gray-500">
                      +{blockCount - 5}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const size = 16;
  const stroke = 2.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? completed / total : 0;
  const dashOffset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className={
          pct === 1
            ? "text-emerald-500"
            : "text-emerald-500 transition-[stroke-dashoffset]"
        }
      />
    </svg>
  );
}
