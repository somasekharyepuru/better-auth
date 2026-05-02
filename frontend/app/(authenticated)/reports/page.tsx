"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AuthenticatedPageShell } from "@/components/layout/authenticated-page-shell";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Target,
  Timer,
  Repeat,
  Globe,
  Grid3X3,
  BookOpen,
  CalendarSync,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  CalendarDays,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import { reportsApi } from "@/lib/reports-api";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(262, 83%, 58%)",
  "hsl(45, 93%, 47%)",
  "hsl(262, 70%, 50%)",
  "hsl(240, 5%, 65%)",
  "hsl(0, 72%, 51%)",
  "hsl(199, 89%, 48%)",
  "hsl(24, 95%, 53%)",
];

type ReportId = string;

interface ReportDef {
  id: ReportId;
  name: string;
  description: string;
  icon: React.ElementType;
}

interface CategoryDef {
  id: string;
  name: string;
  icon: React.ElementType;
  reports: ReportDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "summary",
    name: "Summary",
    icon: LayoutDashboard,
    reports: [
      { id: "weekly-review", name: "Weekly Review", description: "Full weekly productivity snapshot", icon: CalendarDays },
      { id: "monthly-score", name: "Monthly Score", description: "Composite productivity scorecard", icon: BarChart3 },
      { id: "streak-dashboard", name: "Streaks", description: "All streaks at a glance", icon: Flame },
      { id: "goal-velocity", name: "Goal Velocity", description: "Completion rate trends", icon: TrendingUp },
    ],
  },
  {
    id: "daily-planning",
    name: "Daily Planning",
    icon: Target,
    reports: [
      { id: "priority-completion", name: "Completion Rate", description: "Daily priority completion %", icon: CheckCircle2 },
      { id: "carried-forward", name: "Carried Forward", description: "Deferred priorities analysis", icon: AlertTriangle },
      { id: "priority-throughput", name: "Throughput", description: "Set vs completed over time", icon: Zap },
      { id: "review-trends", name: "Review Trends", description: "Daily review patterns", icon: BookOpen },
      { id: "days-without-review", name: "Missing Reviews", description: "Days without end-of-day review", icon: CalendarDays },
    ],
  },
  {
    id: "focus-time",
    name: "Focus & Time",
    icon: Timer,
    reports: [
      { id: "focus-hours", name: "Focus Hours", description: "Scheduled focus time", icon: Clock },
      { id: "time-categories", name: "Time Categories", description: "Category breakdown", icon: BarChart3 },
      { id: "calendar-vs-manual", name: "Calendar vs Manual", description: "Reactive vs intentional planning", icon: CalendarSync },
      { id: "schedule-density", name: "Schedule Density", description: "Over/under scheduled days", icon: CalendarDays },
    ],
  },
  {
    id: "focus-sessions",
    name: "Focus Sessions",
    icon: Zap,
    reports: [
      { id: "session-completion", name: "Session Completion", description: "Focus session success rate", icon: CheckCircle2 },
      { id: "deep-work", name: "Deep Work Time", description: "Actual focus minutes", icon: Timer },
      { id: "interruptions", name: "Interruptions", description: "When focus gets broken", icon: AlertTriangle },
      { id: "best-focus-times", name: "Best Focus Times", description: "Most productive hours", icon: TrendingUp },
      { id: "focus-trends", name: "Focus Trends", description: "Week-over-week changes", icon: BarChart3 },
    ],
  },
  {
    id: "habits",
    name: "Habits",
    icon: Repeat,
    reports: [
      { id: "habit-completion", name: "Completion Rate", description: "Per-habit adherence", icon: Target },
      { id: "habit-streaks", name: "Streaks", description: "Current & best streaks", icon: Flame },
      { id: "habit-consistency", name: "Consistency Score", description: "30-day consistency (0-100)", icon: BarChart3 },
      { id: "habit-life-areas", name: "By Life Area", description: "Habit health per area", icon: Globe },
      { id: "habit-failures", name: "Failure Patterns", description: "Skip rates by day of week", icon: AlertTriangle },
    ],
  },
  {
    id: "life-areas",
    name: "Life Areas",
    icon: Globe,
    reports: [
      { id: "life-area-time", name: "Time Distribution", description: "Hours per life area", icon: Clock },
      { id: "life-area-balance", name: "Balance Score", description: "Composite balance index", icon: BarChart3 },
      { id: "life-area-priorities", name: "Priority Focus", description: "Priorities per area", icon: Target },
    ],
  },
  {
    id: "eisenhower",
    name: "Eisenhower",
    icon: Grid3X3,
    reports: [
      { id: "eisenhower-distribution", name: "Quadrant Distribution", description: "Q1-Q4 task spread", icon: Grid3X3 },
      { id: "eisenhower-promotion", name: "Promotion Rate", description: "Tasks promoted to priorities", icon: TrendingUp },
      { id: "eisenhower-aging", name: "Task Aging", description: "Stale unpromoted tasks", icon: AlertTriangle },
      { id: "eisenhower-q1q2", name: "Q1 vs Q2 Trend", description: "Proactivity over time", icon: BarChart3 },
    ],
  },
  {
    id: "decisions",
    name: "Decisions",
    icon: BookOpen,
    reports: [
      { id: "decision-volume", name: "Decision Volume", description: "Decision cadence", icon: BarChart3 },
      { id: "decision-outcomes", name: "Outcome Tracking", description: "Follow-through rate", icon: CheckCircle2 },
      { id: "decision-by-area", name: "By Life Area", description: "Decisions per area", icon: Globe },
    ],
  },
  {
    id: "calendar-sync",
    name: "Calendar Sync",
    icon: CalendarSync,
    reports: [
      { id: "sync-health", name: "Sync Health", description: "Calendar sync reliability", icon: CalendarSync },
      { id: "sync-conflicts", name: "Conflicts", description: "Calendar conflict stats", icon: AlertTriangle },
    ],
  },
];

function pct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function TrendIcon({ value }: { value: number | null }) {
  if (value == null) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (value > 0) return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (value < 0) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function KpiCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number | null;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {(sub || trend != null) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {trend != null && <TrendIcon value={trend} />}
            {sub && <span>{sub}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-60 rounded-xl" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function useDateRange() {
  const [from, setFrom] = useState(dayjs().subtract(29, "day").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  return { from, to, setFrom, setTo };
}

function useReport<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

function formatNumber(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

function WeeklyReviewReport() {
  const { data, loading } = useReport(() => reportsApi.summary.weekly());
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No weekly data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{r.week.from}</Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant="secondary">{r.week.to}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Priorities" value={pct(r.priorities.rate)} sub={`${r.priorities.completed}/${r.priorities.set} done`} />
        <KpiCard label="Focus Sessions" value={pct(r.focus.completionRate)} sub={`${r.focus.sessions} sessions`} />
        <KpiCard label="Habits On Track" value={`${r.habits.onTrack}/${r.habits.total}`} />
        <KpiCard label="Daily Reviews" value={`${r.dailyReview.completed}/7`} />
      </div>
      {r.priorities.incomplete.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Incomplete Priorities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {r.priorities.incomplete.map((p: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {(r.dailyReview.wins.length > 0 || r.dailyReview.blockers.length > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {r.dailyReview.wins.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Common Wins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {r.dailyReview.wins.map((w: { word: string; count: number }, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{w.word} ({w.count})</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {r.dailyReview.blockers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-500">Common Blockers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {r.dailyReview.blockers.map((b: { word: string; count: number }, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{b.word} ({b.count})</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function MonthlyScoreReport() {
  const { data, loading } = useReport(() => reportsApi.summary.monthlyScore());
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No monthly data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-5xl font-bold">{r.summary.score}</div>
          <p className="text-sm text-muted-foreground">Productivity Score</p>
        </div>
        <div className="flex flex-col gap-1">
          <Badge variant={r.summary.direction === "improving" ? "default" : r.summary.direction === "declining" ? "destructive" : "secondary"}>
            {r.summary.direction === "improving" && <TrendingUp className="mr-1 h-3 w-3" />}
            {r.summary.direction === "declining" && <TrendingDown className="mr-1 h-3 w-3" />}
            {r.summary.change > 0 ? "+" : ""}{r.summary.change} from last month
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Priorities", value: r.components.priorityRate },
          { label: "Focus", value: r.components.focusRate },
          { label: "Habits", value: r.components.habitRate },
          { label: "Reviews", value: r.components.reviewRate },
          { label: "Balance", value: r.components.balanceScore },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-xl font-bold">{pct(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StreakDashboardReport() {
  const { data, loading } = useReport(() => reportsApi.summary.streakDashboard());
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No streak data" />;
  const r = data as any;
  const mainStreaks = [
    { label: "Daily Planning", icon: Target, current: r.streaks.dailyPlanning.current, best: r.streaks.dailyPlanning.best },
    { label: "Focus Sessions", icon: Zap, current: r.streaks.focusSessions.current, best: r.streaks.focusSessions.best },
    { label: "Daily Review", icon: BookOpen, current: r.streaks.dailyReview.current, best: r.streaks.dailyReview.best },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {mainStreaks.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{s.current}</span>
                    <span className="text-xs text-muted-foreground">/ {s.best} best</span>
                  </div>
                </div>
              </div>
              {s.best > 0 && (
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min((s.current / s.best) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {r.streaks.habits.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Habit Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {r.streaks.habits.map((h: any) => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-lg">{h.emoji || "🎯"}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{h.name}</span>
                      <span className="text-sm font-bold">{h.currentStreak} <span className="text-muted-foreground font-normal">/ {h.bestStreak}</span></span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${h.bestStreak > 0 ? Math.min((h.currentStreak / h.bestStreak) * 100, 100) : 0}%`, backgroundColor: h.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GoalVelocityReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.summary.goalVelocity(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No velocity data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Avg Velocity" value={`${r.summary.avgVelocity ?? "—"}/wk`} />
        <KpiCard label="Acceleration" value={r.summary.acceleration != null ? pct(r.summary.acceleration) : "—"} />
        <KpiCard label="Projected" value={`${r.summary.projectedWeekly ?? "—"}/wk`} />
        <KpiCard label="Trend" value={r.summary.trend ?? "—"} />
      </div>
      <ChartCard title="Weekly Completions">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.weeks}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Bar dataKey="completions" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function PriorityCompletionReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.priorities.completion(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No priority data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Avg Rate" value={pct(r.summary.avgRate)} />
        <KpiCard label="7-Day Avg" value={pct(r.summary.rolling7DayAvg)} />
        <KpiCard label="30-Day Avg" value={pct(r.summary.rolling30DayAvg)} />
        <KpiCard label="Worst Streak" value={`${r.summary.worstStreak} days`} />
      </div>
      <ChartCard title="Daily Completion Rate">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={r.days}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} className="text-muted-foreground" />
              <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} />
              <Line type="monotone" dataKey="rate" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function CarriedForwardReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.priorities.carriedForward(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No carried-forward priorities" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Carry Events" value={r.summary.totalCarryEvents} />
        <KpiCard label="Eventually Completed" value={pct(r.summary.eventuallyCompletedRate)} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Carried-Forward Priorities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {r.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">{item.carryCount}</span>
                  <span className="text-sm">{item.title}</span>
                </div>
                <Badge variant={item.completed ? "default" : "secondary"} className="text-xs">
                  {item.completed ? "Done" : "Open"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PriorityThroughputReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.priorities.throughput(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No throughput data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Avg Set/Day" value={r.summary.avgSetPerDay} />
        <KpiCard label="Avg Done/Day" value={r.summary.avgCompletedPerDay} />
        <KpiCard label="Throughput Ratio" value={pct(r.summary.throughputRatio)} />
        <KpiCard label="Over-Planning Days" value={r.summary.overPlanningDays} />
      </div>
      <ChartCard title="Weekly Set vs Completed">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.weeks}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Legend />
              <Bar dataKey="set" fill="hsl(240, 5%, 65%)" name="Set" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" name="Completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function ReviewTrendsReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.dailyReview.trends(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No review data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Completion Rate" value={pct(r.summary.completionRate)} />
        <KpiCard label="Review Streak" value={`${r.summary.reviewStreak} days`} />
        <KpiCard label="Avg Review Length" value={`${r.summary.avgReviewLength ?? "—"} chars`} />
        <KpiCard label="Total Reviews" value={`${r.summary.totalReviews}/${r.summary.totalDays}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {r.wordFrequency.wentWell.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Top Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {r.wordFrequency.wentWell.map((w: any, i: number) => (
                  <Badge key={i} variant="secondary">{w.word} ({w.count})</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {r.wordFrequency.didntGoWell.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-500">Top Blockers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {r.wordFrequency.didntGoWell.map((w: any, i: number) => (
                  <Badge key={i} variant="secondary">{w.word} ({w.count})</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DaysWithoutReviewReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.dailyReview.daysWithout(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="With Review" value={r.summary.daysWithReview} />
        <KpiCard label="Without Review" value={r.summary.daysWithoutReview} />
        <KpiCard label="Longest Gap" value={`${r.summary.longestGap} days`} />
        <KpiCard label="Current Gap" value={`${r.summary.currentGap} days`} />
      </div>
      <ChartCard title="Weekly Review Frequency">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.weeklyFrequency}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Bar dataKey="reviewed" fill="hsl(142, 71%, 45%)" name="Reviewed" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="missing" fill="hsl(0, 72%, 51%)" name="Missing" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function FocusHoursReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.timeBlocks.hours(from, to, "focus"));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No focus time data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Hours" value={`${formatNumber(r.summary.totalHours, 1)}h`} />
        <KpiCard label="Avg/Day" value={`${formatNumber(r.summary.avgPerDay, 1)}h`} />
        <KpiCard label="Active Days" value={r.summary.activeDays} />
        <KpiCard label="Peak Day" value={r.summary.peak?.date ?? "—"} sub={r.summary.peak ? `${formatNumber(r.summary.peak.hours, 1)}h` : undefined} />
      </div>
      <ChartCard title="Daily Focus Hours">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={r.periods}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)}h`} />
              <Area type="monotone" dataKey="hours" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function TimeCategoriesReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.timeBlocks.categories(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No category data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Hours" value={`${formatNumber(r.summary.totalHours, 1)}h`} />
        <KpiCard label="Focus Hours" value={`${formatNumber(r.summary.focusHours, 1)}h`} />
        <KpiCard label="Focus Ratio" value={pct(r.summary.focusRatio)} />
        <KpiCard label="Categories" value={r.summary.categoryCount} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={r.categories} dataKey="hours" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {r.categories.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {r.categories.map((c: any, i: number) => (
                <div key={c.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm capitalize">{c.category}</span>
                  </div>
                  <span className="text-sm font-medium">{formatNumber(c.hours, 1)}h ({pct(c.percentage)})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CalendarVsManualReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.timeBlocks.calendarVsManual(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Manual Hours" value={`${formatNumber(r.summary.totalManualHours, 1)}h`} />
        <KpiCard label="Calendar Hours" value={`${formatNumber(r.summary.totalCalendarHours, 1)}h`} />
        <KpiCard label="Manual %" value={pct(r.summary.manualPercentage)} />
        <KpiCard label="Total Hours" value={`${formatNumber(r.summary.totalHours, 1)}h`} />
      </div>
      <ChartCard title="Weekly: Manual vs Calendar">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.periods}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Legend />
              <Bar dataKey="manualHours" fill="hsl(142, 71%, 45%)" name="Manual" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="calendarHours" fill="hsl(240, 5%, 65%)" name="Calendar" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function ScheduleDensityReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.timeBlocks.density(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No density data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Avg Hours/Day" value={`${formatNumber(r.summary.averageHoursPerDay, 1)}h`} />
        <KpiCard label="Over-Scheduled" value={`${r.summary.overScheduledDays} days`} sub=">8h" />
        <KpiCard label="Under-Scheduled" value={`${r.summary.underScheduledDays} days`} sub="<2h workdays" />
        <KpiCard label="Ideal Range" value={`${r.summary.idealRangeDays} days`} sub="4-7h" />
      </div>
      <ChartCard title="Hours per Day">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.periods}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)}h`} />
              <Bar dataKey="hours" fill="hsl(262, 83%, 58%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function SessionCompletionReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.focusSessions.completion(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No session data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Completion Rate" value={pct(r.summary.completionRate)} />
        <KpiCard label="Interruption Rate" value={pct(r.summary.interruptionRate)} />
        <KpiCard label="Abandoned Rate" value={pct(r.summary.abandonedRate)} />
        <KpiCard label="Total Sessions" value={r.summary.totalSessions} />
      </div>
      <ChartCard title="Daily Session Outcomes">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.days}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" name="Completed" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="interrupted" fill="hsl(45, 93%, 47%)" name="Interrupted" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="abandoned" fill="hsl(0, 72%, 51%)" name="Abandoned" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function DeepWorkReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.focusSessions.deepWork(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No deep work data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Focus" value={`${formatNumber(r.summary.totalFocusMinutes, 0)}m`} />
        <KpiCard label="Avg Session" value={`${formatNumber(r.summary.averageSessionLength, 1)}m`} />
        <KpiCard label="Efficiency" value={pct(r.summary.efficiencyRate)} sub="actual vs target" />
        <KpiCard label="Sessions" value={r.summary.completedSessions} />
      </div>
      <ChartCard title="Daily Focus Minutes">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={r.periods}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip formatter={(v) => `${Number(v).toFixed(0)}m`} />
              <Legend />
              <Area type="monotone" dataKey="focusMinutes" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.2} name="Actual" strokeWidth={2} />
              <Line type="monotone" dataKey="targetMinutes" stroke="hsl(240, 5%, 65%)" strokeDasharray="5 5" name="Target" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function InterruptionsReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.focusSessions.interruptions(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No interruption data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total" value={r.summary.totalInterruptions} />
        <KpiCard label="Avg Time Before" value={`${formatNumber(r.summary.averageTimeBeforeInterruptionMinutes, 1)}m`} />
        <KpiCard label="Peak Hour" value={r.summary.peakHour?.hour != null ? `${r.summary.peakHour.hour}:00` : "—"} />
        <KpiCard label="Peak Day" value={r.summary.peakDay?.label ?? "—"} />
      </div>
      <ChartCard title="Interruptions by Hour">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.interruptionsByHour}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Bar dataKey="interruptions" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function BestFocusTimesReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.focusSessions.bestTimes(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No data" />;
  const r = data as any;
  const filteredHours = r.hours.filter((h: any) => h.count > 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {r.summary.topHours.slice(0, 3).map((h: any, i: number) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{i === 0 ? "Best" : i === 1 ? "2nd Best" : "3rd Best"} Hour</p>
              <p className="mt-1 text-3xl font-bold">{h.hour}:00</p>
              <p className="text-xs text-muted-foreground">{pct(h.completionRate)} completion</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <ChartCard title="Productivity by Hour">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredHours}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Bar dataKey="productivityScore" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function FocusTrendsReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.focusSessions.trends(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No trend data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Sessions" value={r.summary.totalSessions} />
        <KpiCard label="Completed" value={r.summary.totalCompletedSessions} />
        <KpiCard label="Deep Work" value={`${formatNumber(r.summary.totalDeepWorkMinutes, 0)}m`} />
        <KpiCard label="Completion Rate" value={pct(r.summary.completionRate)} />
      </div>
      <ChartCard title="Weekly Trends">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={r.weeks}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalSessions" stroke="hsl(240, 5%, 65%)" name="Sessions" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completedSessions" stroke="hsl(142, 71%, 45%)" name="Completed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="deepWorkMinutes" stroke="hsl(262, 83%, 58%)" name="Deep Work (m)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function HabitCompletionReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.habits.completion(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No habit data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Overall Rate" value={pct(r.summary.overallRate)} />
        <KpiCard label="Best Habit" value={r.summary.bestHabit?.name ?? "—"} sub={pct(r.summary.bestHabit?.completionRate)} />
        <KpiCard label="Worst Habit" value={r.summary.worstHabit?.name ?? "—"} sub={pct(r.summary.worstHabit?.completionRate)} />
        <KpiCard label="Total Habits" value={r.habits.length} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Per-Habit Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {r.habits.map((h: any) => (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-lg">{h.emoji || "🎯"}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{h.name}</span>
                    <span className="text-sm">{pct(h.completionRate)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${(h.completionRate ?? 0) * 100}%`, backgroundColor: h.color }} />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="h-3 w-3" />
                  {h.currentStreak}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HabitStreaksReport() {
  const { data, loading } = useReport(() => reportsApi.habits.streaks());
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No streak data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Habits" value={r.summary.totalHabits} />
        <KpiCard label="Active Streaks" value={r.summary.activeStreaks} />
        <KpiCard label="Avg Current" value={formatNumber(r.summary.averageCurrentStreak, 1)} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">All Habit Streaks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {r.habits.map((h: any) => (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-lg">{h.emoji || "🎯"}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{h.name}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-500" />{h.currentStreak}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><Trophy className="h-3.5 w-3.5" />{h.bestStreak}</span>
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div className="h-1.5 rounded-full bg-orange-400 transition-all" style={{ width: `${h.bestStreak > 0 ? Math.min((h.currentStreak / h.bestStreak) * 100, 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HabitConsistencyReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.habits.consistency(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No consistency data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Average Score" value={r.summary.averageScore != null ? `${r.summary.averageScore}` : "—"} />
        <KpiCard label="Best Habit" value={r.summary.bestHabit?.name ?? "—"} sub={r.summary.bestHabit ? `${r.summary.bestHabit.score}` : undefined} />
        <KpiCard label="Worst Habit" value={r.summary.worstHabit?.name ?? "—"} sub={r.summary.worstHabit ? `${r.summary.worstHabit.score}` : undefined} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Consistency Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {r.habits.map((h: any) => (
              <div key={h.id} className="flex items-center gap-3">
                <span className="text-lg">{h.emoji || "🎯"}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{h.name}</span>
                    <span className={cn("text-sm font-bold", h.score >= 80 ? "text-green-600" : h.score >= 50 ? "text-yellow-600" : "text-red-500")}>
                      {h.score}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className={cn("h-2 rounded-full transition-all", h.score >= 80 ? "bg-green-500" : h.score >= 50 ? "bg-yellow-500" : "bg-red-400")}
                      style={{ width: `${h.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HabitLifeAreasReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.habits.byLifeArea(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No area data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {r.areas.map((a: any) => (
          <Card key={a.lifeAreaId ?? "unassigned"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                <span className="text-sm font-medium">{a.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{a.habitCount}</Badge>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{pct(a.averageCompletionRate)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HabitFailuresReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.habits.failurePatterns(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No failure data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Habits Analyzed" value={r.summary.habitCount} />
        <KpiCard label="Most Skipped" value={r.summary.mostSkippedDay?.label ?? "—"} sub={pct(r.summary.mostSkippedDay?.skipRate)} />
        <KpiCard label="Safest Day" value={r.summary.safestDay?.label ?? "—"} sub={pct(r.summary.safestDay?.skipRate)} />
      </div>
      <ChartCard title="Skip Rate by Day of Week">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.days}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} className="text-muted-foreground" />
              <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} />
              <Bar dataKey="skipRate" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function LifeAreaTimeReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.lifeAreas.timeDistribution(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No time data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Hours" value={`${formatNumber(r.summary.totalHours, 1)}h`} />
        <KpiCard label="Areas" value={r.summary.areaCount} />
        <KpiCard label="Unassigned" value={`${formatNumber(r.summary.unassignedHours, 1)}h`} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Time Distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={r.areas} dataKey="hours" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {r.areas.map((a: any) => (
                    <Cell key={a.lifeAreaId} fill={a.color || CHART_COLORS[0]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {r.areas.map((a: any) => (
                <div key={a.lifeAreaId ?? "unassigned"} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                    <span className="text-sm">{a.name}</span>
                  </div>
                  <span className="text-sm font-medium">{formatNumber(a.hours, 1)}h ({pct(a.percentage)})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LifeAreaBalanceReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.lifeAreas.balanceScore(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No balance data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Avg Balance" value={r.summary.averageScore != null ? `${r.summary.averageScore}` : "—"} />
        <KpiCard label="Most Balanced" value={r.summary.mostBalanced?.name ?? "—"} sub={r.summary.mostBalanced ? `${(r.summary.mostBalanced.balanceScore * 100).toFixed(1)}` : undefined} />
        <KpiCard label="Most Neglected" value={r.summary.mostNeglected?.name ?? "—"} sub={r.summary.mostNeglected ? `${(r.summary.mostNeglected.balanceScore * 100).toFixed(1)}` : undefined} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Balance Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {r.areas.map((a: any) => (
              <div key={a.lifeAreaId} className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.name}</span>
                    <span className="text-sm font-bold">{(a.balanceScore * 100).toFixed(1)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${a.balanceScore * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LifeAreaPrioritiesReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.lifeAreas.priorityFocus(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No priority data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Set" value={r.summary.totalSet} />
        <KpiCard label="Total Completed" value={r.summary.totalCompleted} />
        <KpiCard label="Areas" value={r.summary.areaCount} />
      </div>
      <ChartCard title="Priorities by Life Area">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.areas} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="set" fill="hsl(240, 5%, 65%)" name="Set" radius={[0, 4, 4, 0]} />
              <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" name="Completed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function EisenhowerDistributionReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.eisenhower.quadrantDistribution(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No eisenhower data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {r.quadrants.map((q: any) => (
          <KpiCard key={q.quadrant} label={`Q${q.quadrant}`} value={q.count} sub={pct(q.percentage)} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Quadrant Split">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={r.quadrants} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                  {r.quadrants.map((_: any, i: number) => (
                    <Cell key={i} fill={["hsl(0, 72%, 51%)", "hsl(142, 71%, 45%)", "hsl(45, 93%, 47%)", "hsl(240, 5%, 65%)"][i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title="Q1% vs Q2% Over Time">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={r.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} className="text-muted-foreground" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="q1Percentage" stroke="hsl(0, 72%, 51%)" name="Q1%" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="q2Percentage" stroke="hsl(142, 71%, 45%)" name="Q2%" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function EisenhowerPromotionReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.eisenhower.promotionRate(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No promotion data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Promotion Rate" value={pct(r.promotionFunnel.promotionRate)} />
        <KpiCard label="Q2 Promotion" value={pct(r.promotionFunnel.q2PromotionRate)} />
        <KpiCard label="Avg Days to Promote" value={formatNumber(r.timing.avgDaysToPromotion, 1)} />
        <KpiCard label="Never Promoted (>30d)" value={r.timing.neverPromotedOlderThan30d} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Promotion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{r.promotionFunnel.totalCreated}</div>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{r.promotionFunnel.promoted}</div>
              <p className="text-xs text-muted-foreground">Promoted</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EisenhowerAgingReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.eisenhower.taskAging(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No aging data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Unpromoted Tasks" value={r.summary.totalUnpromoted} />
        <KpiCard label="Stale (>30d)" value={r.summary.staleCount} />
        <KpiCard label="Oldest Task" value={r.summary.oldestTaskAgeDays != null ? `${r.summary.oldestTaskAgeDays}d` : "—"} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Aging by Quadrant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {r.quadrantAging.map((q: any) => (
              <div key={q.quadrant} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Q{q.quadrant}</Badge>
                  <span className="text-sm">{q.label}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{q.taskCount} tasks</span>
                  <span className="text-muted-foreground">avg {q.avgAgeDays != null ? `${formatNumber(q.avgAgeDays, 0)}d` : "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {r.stale.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top 10 Stale Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {r.stale.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-4">{t.title}</span>
                  <Badge variant="destructive" className="text-xs whitespace-nowrap">{t.ageDays}d old</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EisenhowerQ1Q2Report() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.eisenhower.q1q2RatioTrend(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No ratio data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Overall Q1:Q2" value={r.summary.overallRatio != null ? r.summary.overallRatio.toFixed(2) : "—"} />
        <KpiCard label="Direction" value={r.summary.direction ?? "—"} />
      </div>
      <ChartCard title="Monthly Q1:Q2 Ratio">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={r.months}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Line type="monotone" dataKey="ratio" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function DecisionVolumeReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.decisions.volume(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No decision data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total Decisions" value={r.summary.totalDecisions} />
        <KpiCard label="Avg/Week" value={r.summary.avgPerWeek} />
        <KpiCard label="MoM Change" value={r.summary.momChange != null ? pct(r.summary.momChange) : "—"} trend={r.summary.momChange} />
      </div>
      <ChartCard title="Weekly Decisions">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.weekly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function DecisionOutcomesReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.decisions.outcomeTracking(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No outcome data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="With Outcome" value={r.outcomeTracking.withOutcome} />
        <KpiCard label="Without Outcome" value={r.outcomeTracking.withoutOutcome} />
        <KpiCard label="Outcome Rate" value={pct(r.outcomeTracking.outcomeRate)} />
        <KpiCard label="Avg Days to Outcome" value={formatNumber(r.outcomeTracking.avgDaysToOutcome, 1)} />
      </div>
      <ChartCard title="Outcome Tracking">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ name: "With Outcome", value: r.outcomeTracking.withOutcome }, { name: "Without", value: r.outcomeTracking.withoutOutcome }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                <Cell fill="hsl(142, 71%, 45%)" />
                <Cell fill="hsl(240, 5%, 65%)" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      {r.awaitingOutcome.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Outcome</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {r.awaitingOutcome.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="truncate mr-4">{d.title}</span>
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">{d.date}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DecisionByAreaReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.decisions.byLifeArea(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No area data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <KpiCard label="Total Decisions" value={r.summary.totalDecisions} />
        <KpiCard label="Areas" value={r.summary.areaCount} />
      </div>
      <ChartCard title="Decisions by Life Area">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.areas} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={100} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {r.areas.map((a: any, i: number) => (
                  <Cell key={i} fill={a.color || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function SyncHealthReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.calendarSync.health(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No sync data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Connections" value={r.summary.totalConnections} />
        <KpiCard label="Sync Success Rate" value={pct(r.summary.syncSuccessRate)} />
        <KpiCard label="Avg Duration" value={r.summary.avgSyncDurationMs != null ? `${r.summary.avgSyncDurationMs}ms` : "—"} />
        <KpiCard label="Total Syncs" value={r.summary.totalSyncs} />
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {r.connections.map((c: any) => (
              <div key={c.connectionId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarSync className="h-4 w-4" />
                  <span className="text-sm font-medium capitalize">{c.provider}</span>
                </div>
                <Badge variant={c.status === "ACTIVE" ? "default" : "destructive"} className="text-xs">{c.status}</Badge>
              </div>
            ))}
            {r.connections.length === 0 && <p className="text-sm text-muted-foreground">No calendar connections</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SyncConflictsReport() {
  const { from, to } = useDateRange();
  const { data, loading } = useReport(() => reportsApi.calendarSync.conflicts(from, to));
  if (loading) return <ReportSkeleton />;
  if (!data) return <EmptyState message="No conflict data" />;
  const r = data as any;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Conflicts" value={r.summary.totalConflicts} />
        <KpiCard label="Resolved" value={r.summary.resolved} />
        <KpiCard label="Unresolved" value={r.summary.unresolved} />
        <KpiCard label="Resolution Rate" value={pct(r.summary.resolutionRate)} />
      </div>
      {r.conflictsByType.length > 0 && (
        <ChartCard title="Conflicts by Type">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.conflictsByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} className="text-muted-foreground" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );
}

const REPORT_COMPONENTS: Record<ReportId, React.ComponentType> = {
  "weekly-review": WeeklyReviewReport,
  "monthly-score": MonthlyScoreReport,
  "streak-dashboard": StreakDashboardReport,
  "goal-velocity": GoalVelocityReport,
  "priority-completion": PriorityCompletionReport,
  "carried-forward": CarriedForwardReport,
  "priority-throughput": PriorityThroughputReport,
  "review-trends": ReviewTrendsReport,
  "days-without-review": DaysWithoutReviewReport,
  "focus-hours": FocusHoursReport,
  "time-categories": TimeCategoriesReport,
  "calendar-vs-manual": CalendarVsManualReport,
  "schedule-density": ScheduleDensityReport,
  "session-completion": SessionCompletionReport,
  "deep-work": DeepWorkReport,
  "interruptions": InterruptionsReport,
  "best-focus-times": BestFocusTimesReport,
  "focus-trends": FocusTrendsReport,
  "habit-completion": HabitCompletionReport,
  "habit-streaks": HabitStreaksReport,
  "habit-consistency": HabitConsistencyReport,
  "habit-life-areas": HabitLifeAreasReport,
  "habit-failures": HabitFailuresReport,
  "life-area-time": LifeAreaTimeReport,
  "life-area-balance": LifeAreaBalanceReport,
  "life-area-priorities": LifeAreaPrioritiesReport,
  "eisenhower-distribution": EisenhowerDistributionReport,
  "eisenhower-promotion": EisenhowerPromotionReport,
  "eisenhower-aging": EisenhowerAgingReport,
  "eisenhower-q1q2": EisenhowerQ1Q2Report,
  "decision-volume": DecisionVolumeReport,
  "decision-outcomes": DecisionOutcomesReport,
  "decision-by-area": DecisionByAreaReport,
  "sync-health": SyncHealthReport,
  "sync-conflicts": SyncConflictsReport,
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportId>("weekly-review");
  const [expandedCategory, setExpandedCategory] = useState<string>("summary");

  const activeReport = CATEGORIES.flatMap((c) => c.reports).find((r) => r.id === selectedReport);

  const ReportComponent = REPORT_COMPONENTS[selectedReport];

  return (
    <AuthenticatedPageShell>
      <PageHeader
        title="Reports"
        description="Productivity insights across all tools"
        breadcrumbs={[{ label: "Reports" }]}
        className="mb-6"
      />
      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <nav className="space-y-1">
              {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? "" : cat.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted/50"
                  >
                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-left">{cat.name}</span>
                    <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expandedCategory === cat.id && "rotate-90")} />
                  </button>
                  {expandedCategory === cat.id && (
                    <div className="ml-4 space-y-0.5 border-l border-border pl-3">
                      {cat.reports.map((report) => (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => setSelectedReport(report.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                            selectedReport === report.id
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                          )}
                        >
                          <report.icon className="h-3.5 w-3.5" />
                          {report.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-2 lg:hidden">
            <select
              value={selectedReport}
              onChange={(e) => {
                setSelectedReport(e.target.value);
                const cat = CATEGORIES.find((c) => c.reports.some((r) => r.id === e.target.value));
                if (cat) setExpandedCategory(cat.id);
              }}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.map((cat) => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.reports.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {activeReport && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{activeReport.name}</h2>
              <p className="text-sm text-muted-foreground">{activeReport.description}</p>
            </div>
          )}

          <ErrorBoundary fallback={<EmptyState message="Failed to load report" />}>
            {ReportComponent ? <ReportComponent /> : <EmptyState message="Report not found" />}
          </ErrorBoundary>
        </div>
      </div>
    </AuthenticatedPageShell>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
