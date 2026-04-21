"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useSettings } from "@/lib/settings-context";
import { useLifeAreas } from "@/lib/life-areas-context";
import { Spinner } from "@/components/ui/spinner";
import { AuthenticatedPageShell } from "@/components/layout/authenticated-page-shell";
import { PageHeader } from "@/components/page-header";
import {
  Plus,
  Flame,
  Check,
  Trash2,
  Edit2,
  Archive,
  Target,
  TrendingUp,
  Calendar,
  Repeat,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

// ─── Types ───────────────────────────────────────────────────────────────────

type HabitFrequency = "DAILY" | "WEEKLY" | "X_PER_WEEK" | "X_PER_MONTH";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EMOJI_SUGGESTIONS = [
  "💼","📧","📝","📊","📅","🎯","✅","🧠","📚","🤝","🚀","⚡","🛠️","🔧","💡",
];

const COLOR_SWATCHES = [
  "#6366F1","#8B5CF6","#EC4899","#EF4444","#F97316","#EAB308","#22C55E","#14B8A6","#3B82F6","#06B6D4",
];

interface Habit {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  color: string;
  frequency: HabitFrequency;
  frequencyDays: number[];
  targetCount?: number;
  lifeAreaId?: string | null;
  lifeArea?: { id: string; name: string; color: string | null } | null;
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  logs: { date: string; completed: boolean; note?: string }[];
}

interface HabitLog {
  id: string;
  date: string;
  completed: boolean;
  note?: string;
}

interface HabitDetail extends Habit {
  logHistory: HabitLog[];
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function fetchApi(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function frequencyLabel(h: Habit) {
  if (h.frequency === "DAILY") return "Every day";
  if (h.frequency === "WEEKLY")
    return h.frequencyDays.map((d) => DAYS_OF_WEEK[d]).join(", ");
  if (h.frequency === "X_PER_WEEK") return `${h.targetCount}× per week`;
  return `${h.targetCount}× per month`;
}

function isCompletedToday(h: Habit) {
  const today = todayStr();
  return h.logs.some((l) => l.date.startsWith(today) && l.completed);
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function HabitHeatmap({
  logs,
  color,
}: {
  logs: { date: string; completed: boolean; note?: string }[];
  color: string;
}) {
  const weeks = 26; // 6 months
  const days: { date: string; level: number }[] = [];

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7 + 1);

  const logSet = new Set(logs.filter((l) => l.completed).map((l) => l.date.split("T")[0]));

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    days.push({ date: ds, level: logSet.has(ds) ? 1 : 0 });
  }

  const cols: typeof days[] = [];
  for (let w = 0; w < weeks; w++) {
    cols.push(days.slice(w * 7, w * 7 + 7));
  }

  return (
    <div className="flex gap-[3px] overflow-x-auto pb-1">
      {cols.map((col, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {col.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}${cell.level ? " ✓" : ""}`}
              className="h-[10px] w-[10px] rounded-sm transition-opacity"
              style={{
                backgroundColor: cell.level ? color : undefined,
                opacity: cell.level ? 1 : undefined,
              }}
              {...(!cell.level ? { "data-empty": true } : {})}
            />
          ))}
        </div>
      ))}
      <style>{`[data-empty]{background:#e5e7eb} .dark [data-empty]{background:#374151}`}</style>
    </div>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({
  habit,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  onPause,
}: {
  habit: Habit;
  onToggle: (id: string, done: boolean) => void;
  onEdit: (h: Habit) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onPause: (id: string) => void;
}) {
  const done = isCompletedToday(habit);

  return (
    <div
      className="card-premium group"
      style={{ borderLeft: `3px solid ${habit.color}` }}
    >
      {/* ── Top row: check button, title/meta, streak, hover actions ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Emoji + check button */}
          <button
            onClick={() => onToggle(habit.id, done)}
            className="relative flex-shrink-0 h-11 w-11 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-105"
            style={{ backgroundColor: `${habit.color}18` }}
            title={done ? "Undo check-in" : "Mark done"}
          >
            {done ? (
              <Check className="h-5 w-5" style={{ color: habit.color }} />
            ) : (
              <span>{habit.emoji || "⭕"}</span>
            )}
            {done && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </button>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3
                className={`text-lg font-medium truncate ${
                  done
                    ? "line-through opacity-60 text-gray-500 dark:text-gray-400"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {habit.name}
              </h3>
              {habit.lifeArea && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: habit.lifeArea.color ? `${habit.lifeArea.color}20` : "#e5e7eb",
                    color: habit.lifeArea.color || "#374151",
                  }}
                >
                  {habit.lifeArea.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {frequencyLabel(habit)}
              </span>
              {habit.currentStreak > 0 && (
                <span className="flex items-center gap-1 text-orange-500 font-medium">
                  <Flame className="w-3 h-3" />
                  {habit.currentStreak}-day streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hover-revealed actions (matches decisions / matrix) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(habit)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPause(habit.id)}
            className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
            title="Pause (hide from daily tracking)"
          >
            <PauseCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => onArchive(habit.id)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Description ── */}
      {habit.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {habit.description}
        </p>
      )}

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {habit.currentStreak}
          </p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Current</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {habit.longestStreak}
          </p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Longest</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {habit.completionRate}%
          </p>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">30-day</p>
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Last 6 months
        </p>
        <HabitHeatmap logs={habit.logs} color={habit.color} />
      </div>
    </div>
  );
}

function PausedHabitCard({
  habit,
  onResume,
  onEdit,
  onDelete,
  onArchive,
}: {
  habit: Habit;
  onResume: (id: string) => void;
  onEdit: (h: Habit) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  return (
    <div
      className="card-premium group border border-dashed border-gray-200 dark:border-gray-600"
      style={{ borderLeft: `3px solid ${habit.color}` }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="text-2xl leading-none">{habit.emoji || "⭕"}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{habit.name}</h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Paused
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {frequencyLabel(habit)}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onResume(habit.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <PlayCircle className="h-4 w-4" />
            Resume
          </button>
          <button
            type="button"
            onClick={() => onEdit(habit)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onArchive(habit.id)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(habit.id)}
            className="p-2 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Form defaults ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  description: "",
  emoji: "⭕",
  color: "#6366F1",
  frequency: "DAILY" as HabitFrequency,
  frequencyDays: [] as number[],
  targetCount: 3,
  lifeAreaId: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const router = useRouter();
  const { isLoading: settingsLoading } = useSettings();
  const { lifeAreas, isLoading: lifeAreasLoading } = useLifeAreas();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadHabits = useCallback(async () => {
    try {
      const data = await fetchApi(`${API_BASE}/api/habits?includeInactive=true`);
      setHabits(data);
    } catch (e) {
      console.error("Failed to load habits:", e);
    }
  }, []);

  useEffect(() => {
    authClient.getSession().then((s) => {
      if (!s?.data) { router.push("/login"); return; }
      setIsAuthenticated(true);
      loadHabits().finally(() => setIsLoading(false));
    }).catch(() => router.push("/login"));
  }, [router, loadHabits]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleToggle = async (id: string, done: boolean) => {
    if (done) {
      await fetchApi(`${API_BASE}/api/habits/${id}/log/${todayStr()}`, { method: "DELETE" });
    } else {
      await fetchApi(`${API_BASE}/api/habits/${id}/log`, { method: "POST", body: JSON.stringify({ date: todayStr() }) });
    }
    loadHabits();
  };

  const handleEdit = (h: Habit) => {
    setForm({
      name: h.name,
      description: h.description || "",
      emoji: h.emoji || "⭕",
      color: h.color,
      frequency: h.frequency,
      frequencyDays: h.frequencyDays,
      targetCount: h.targetCount ?? 3,
      lifeAreaId: h.lifeAreaId || "",
    });
    setEditingId(h.id);
    setIsAdding(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        lifeAreaId: form.lifeAreaId || null,
        targetCount: ["X_PER_WEEK", "X_PER_MONTH"].includes(form.frequency) ? form.targetCount : undefined,
        frequencyDays: form.frequency === "WEEKLY" ? form.frequencyDays : [],
      };
      if (editingId) {
        await fetchApi(`${API_BASE}/api/habits/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await fetchApi(`${API_BASE}/api/habits`, { method: "POST", body: JSON.stringify(payload) });
      }
      setIsAdding(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      loadHabits();
    } catch (e) {
      console.error("Failed to save habit:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this habit and all its history?")) return;
    await fetchApi(`${API_BASE}/api/habits/${id}`, { method: "DELETE" });
    loadHabits();
  };

  const handleArchive = async (id: string) => {
    await fetchApi(`${API_BASE}/api/habits/${id}/archive`, { method: "PATCH" });
    loadHabits();
  };

  const handlePause = async (id: string) => {
    await fetchApi(`${API_BASE}/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });
    loadHabits();
  };

  const handleResume = async (id: string) => {
    await fetchApi(`${API_BASE}/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: true }),
    });
    loadHabits();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const toggleDay = (d: number) => {
    setForm((f) => ({
      ...f,
      frequencyDays: f.frequencyDays.includes(d)
        ? f.frequencyDays.filter((x) => x !== d)
        : [...f.frequencyDays, d],
    }));
  };

  // ── Stats (active habits only) ─────────────────────────────────────────────

  const activeHabits = habits.filter((h) => h.isActive !== false);
  const pausedHabits = habits.filter((h) => h.isActive === false);
  const todayDone = activeHabits.filter(isCompletedToday).length;
  const totalStreaks = activeHabits.reduce((s, h) => s + h.currentStreak, 0);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading || settingsLoading || lifeAreasLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AuthenticatedPageShell>
      <PageHeader
        title="Work Habits"
        description={
          pausedHabits.length > 0
            ? `${todayDone} / ${activeHabits.length} done today · ${pausedHabits.length} paused`
            : `${todayDone} / ${activeHabits.length} done today`
        }
        breadcrumbs={[{ label: "Tools", href: "/tools" }, { label: "Work Habits" }]}
        className="mb-8"
        actions={
          !isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 px-4 py-2 text-white shadow-lg shadow-gray-900/20 transition-all hover:from-gray-700 hover:to-gray-800 dark:from-gray-700 dark:to-gray-800"
            >
              <Plus className="h-4 w-4" />
              New Work Habit
            </button>
          ) : undefined
        }
      />

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      {activeHabits.length > 0 && !isAdding && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-subtle flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{todayDone}/{activeHabits.length}</p>
              <p className="text-xs text-gray-500">Done today</p>
            </div>
          </div>
          <div className="card-subtle flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalStreaks}</p>
              <p className="text-xs text-gray-500">Total streak days</p>
            </div>
          </div>
          <div className="card-subtle flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {activeHabits.length > 0
                  ? Math.round(activeHabits.reduce((s, h) => s + h.completionRate, 0) / activeHabits.length)
                  : 0}
                %
              </p>
              <p className="text-xs text-gray-500">Avg completion</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Form ────────────────────────────────────────────────── */}
      {isAdding && (
        <div className="card-premium mb-6">
          <h3 className="text-subheading mb-4">
            {editingId ? "Edit Work Habit" : "Create a Work Habit"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Habit name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Inbox zero by 10am"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional note"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
              />
            </div>

            {/* Life area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Life Area
              </label>
              <select
                value={form.lifeAreaId}
                onChange={(e) => setForm((f) => ({ ...f, lifeAreaId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400 dark:focus:border-gray-500"
              >
                <option value="">No life area</option>
                {lifeAreas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div className="flex gap-2 items-center h-[42px]">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`h-6 w-6 rounded-full transition-transform ${
                      form.color === c ? "scale-125 ring-2 ring-offset-2" : "hover:scale-110"
                    }`}
                    style={
                      { backgroundColor: c, ["--tw-ring-color" as string]: c } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            </div>

            {/* Emoji */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Emoji
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_SUGGESTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                    className={`text-lg h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                      form.emoji === e
                        ? "ring-2 ring-offset-1 scale-110"
                        : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    style={
                      form.emoji === e
                        ? ({ ["--tw-ring-color" as string]: form.color } as React.CSSProperties)
                        : {}
                    }
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequency
              </label>
              <div className="flex flex-wrap gap-2">
                {(["DAILY", "WEEKLY", "X_PER_WEEK", "X_PER_MONTH"] as HabitFrequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, frequency: f }))}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      form.frequency === f
                        ? "text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    style={form.frequency === f ? { backgroundColor: form.color } : {}}
                  >
                    {f === "DAILY"
                      ? "Daily"
                      : f === "WEEKLY"
                        ? "Specific days"
                        : f === "X_PER_WEEK"
                          ? "X / week"
                          : "X / month"}
                  </button>
                ))}
              </div>
            </div>

            {/* Days of week (WEEKLY) */}
            {form.frequency === "WEEKLY" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Which days?
                </label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`h-9 w-9 rounded-full text-sm font-medium transition-all ${
                        form.frequencyDays.includes(i)
                          ? "text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                      style={form.frequencyDays.includes(i) ? { backgroundColor: form.color } : {}}
                    >
                      {d[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Target count */}
            {(form.frequency === "X_PER_WEEK" || form.frequency === "X_PER_MONTH") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target ({form.frequency === "X_PER_WEEK" ? "times/week" : "times/month"})
                </label>
                <input
                  type="number"
                  min={1}
                  max={form.frequency === "X_PER_WEEK" ? 7 : 30}
                  value={form.targetCount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, targetCount: parseInt(e.target.value) || 1 }))
                  }
                  className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg outline-none focus:border-gray-400"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !form.name.trim()}
              className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? "Saving..."
                : editingId
                  ? "Update Work Habit"
                  : "Save Work Habit"}
            </button>
          </div>
        </div>
      )}

      {/* ── Habits List ────────────────────────────────────────────────────── */}
      {!isAdding && (
        <>
          {habits.length === 0 ? (
            <div className="card-subtle text-center py-16">
              <Repeat className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-muted text-lg mb-2">No work habits yet</p>
              <p className="text-sm text-gray-400 mb-6">
                Small daily disciplines compound into shipped work.
              </p>
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 transition-all"
              >
                <Plus className="h-4 w-4" /> Create your first work habit
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeHabits.length === 0 && pausedHabits.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No active habits — resume one below or create a new habit.
                </p>
              )}
              {/* Today - due */}
              {activeHabits.some((h) => !isCompletedToday(h)) && (
                <>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Due today
                  </p>
                  {activeHabits.filter((h) => !isCompletedToday(h)).map((h) => (
                    <HabitCard
                      key={h.id}
                      habit={h}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                      onPause={handlePause}
                    />
                  ))}
                </>
              )}
              {/* Completed today */}
              {activeHabits.some(isCompletedToday) && (
                <>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center gap-2 pt-2">
                    <Check className="h-3.5 w-3.5" /> Completed today
                  </p>
                  {activeHabits.filter(isCompletedToday).map((h) => (
                    <HabitCard
                      key={h.id}
                      habit={h}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                      onPause={handlePause}
                    />
                  ))}
                </>
              )}
              {pausedHabits.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2 pt-2">
                    <PauseCircle className="h-3.5 w-3.5" /> Paused
                  </p>
                  {pausedHabits.map((h) => (
                    <PausedHabitCard
                      key={h.id}
                      habit={h}
                      onResume={handleResume}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onArchive={handleArchive}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </AuthenticatedPageShell>
  );
}
