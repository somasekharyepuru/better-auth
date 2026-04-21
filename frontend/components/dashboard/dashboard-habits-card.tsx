"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Repeat } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

interface DashboardHabitRow {
  id: string;
  name: string;
  emoji?: string | null;
  color: string;
  completedForDate?: boolean;
  completedToday?: boolean;
}

export function DashboardHabitsCard({
  date,
}: {
  /** YYYY-MM-DD — the day shown in day view */
  date: string;
}) {
  const { settings } = useSettings();
  const [items, setItems] = useState<DashboardHabitRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/habits/day/${date}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load habits");
      const data = await res.json();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const toggle = async (id: string, done: boolean) => {
    try {
      if (done) {
        await fetch(`${API_BASE}/api/habits/${id}/log/${date}`, {
          method: "DELETE",
          credentials: "include",
        });
      } else {
        await fetch(`${API_BASE}/api/habits/${id}/log`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date }),
        });
      }
      load();
    } catch {
      /* ignore */
    }
  };

  if (settings.habitsEnabled === false) return null;

  const done = items.filter((h) => h.completedForDate ?? h.completedToday).length;
  const total = items.length;

  return (
    <div className="card-premium">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50">
            <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-subheading text-base">Work habits</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {loading ? "Loading…" : `${done} / ${total} for this day`}
            </p>
          </div>
        </div>
        <Link
          href="/tools/habits"
          className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Manage
        </Link>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-gray-500">Loading habits…</div>
      ) : total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No habits due this day.{" "}
          <Link href="/tools/habits" className="font-medium text-indigo-600 dark:text-indigo-400">
            Add habits
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((h) => {
            const completed = h.completedForDate ?? h.completedToday ?? false;
            return (
              <li
                key={h.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white/60 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/40"
              >
                <button
                  type="button"
                  onClick={() => toggle(h.id, completed)}
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: `${h.color}20` }}
                  aria-label={completed ? "Mark incomplete" : "Mark done"}
                  title={completed ? "Undo" : "Done"}
                >
                  {completed ? (
                    <Check className="h-4 w-4" style={{ color: h.color }} />
                  ) : (
                    <span>{h.emoji || "◯"}</span>
                  )}
                </button>
                <span
                  className={`min-w-0 flex-1 text-sm font-medium ${
                    completed ? "text-gray-500 line-through dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {h.name}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
