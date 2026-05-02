const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3002";

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Request failed");
  return res.json();
}

function params(obj: Record<string, string | undefined>): string {
  const p = new URLSearchParams(Object.entries(obj).filter(([, v]) => v !== undefined) as [string, string][]);
  return p.toString();
}

export const reportsApi = {
  priorities: {
    completion: (from: string, to: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/priorities/completion?${params({ from, to, lifeAreaId })}`),
    carriedForward: (from: string, to: string, minCarryCount?: string) =>
      fetchApi(`${API_BASE}/api/reports/priorities/carried-forward?${params({ from, to, minCarryCount })}`),
    throughput: (from: string, to: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/priorities/throughput?${params({ from, to, lifeAreaId })}`),
  },
  dailyReview: {
    trends: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/daily-review/trends?${params({ from, to })}`),
    daysWithout: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/daily-review/days-without?${params({ from, to })}`),
  },
  focusSessions: {
    completion: (from: string, to: string, sessionType?: string) =>
      fetchApi(`${API_BASE}/api/reports/focus-sessions/completion?${params({ from, to, sessionType })}`),
    deepWork: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/focus-sessions/deep-work?${params({ from, to })}`),
    interruptions: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/focus-sessions/interruptions?${params({ from, to })}`),
    bestTimes: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/focus-sessions/best-times?${params({ from, to })}`),
    trends: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/focus-sessions/trends?${params({ from, to })}`),
  },
  timeBlocks: {
    hours: (from: string, to: string, category?: string, lifeAreaId?: string, type?: string) =>
      fetchApi(`${API_BASE}/api/reports/time-blocks/hours?${params({ from, to, category, lifeAreaId, type })}`),
    categories: (from: string, to: string, lifeAreaId?: string, type?: string) =>
      fetchApi(`${API_BASE}/api/reports/time-blocks/categories?${params({ from, to, lifeAreaId, type })}`),
    types: (from: string, to: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/time-blocks/types?${params({ from, to, lifeAreaId })}`),
    calendarVsManual: (from: string, to: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/time-blocks/calendar-vs-manual?${params({ from, to, lifeAreaId })}`),
    density: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/time-blocks/density?${params({ from, to })}`),
  },
  habits: {
    completion: (from: string, to: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/habits/completion?${params({ from, to, lifeAreaId })}`),
    streaks: (lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/habits/streaks?${params({ lifeAreaId })}`),
    consistency: (from: string, to: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/habits/consistency?${params({ from, to, lifeAreaId })}`),
    byLifeArea: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/habits/by-life-area?${params({ from, to })}`),
    failurePatterns: (from: string, to: string, habitId?: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/habits/failure-patterns?${params({ from, to, habitId, lifeAreaId })}`),
  },
  lifeAreas: {
    timeDistribution: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/life-areas/time-distribution?${params({ from, to })}`),
    balanceScore: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/life-areas/balance-score?${params({ from, to })}`),
    priorityFocus: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/life-areas/priority-focus?${params({ from, to })}`),
    eisenhowerByArea: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/life-areas/eisenhower-by-area?${params({ from, to })}`),
  },
  eisenhower: {
    quadrantDistribution: (from: string, to: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/eisenhower/quadrant-distribution?${params({ from, to, lifeAreaId })}`),
    promotionRate: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/eisenhower/promotion-rate?${params({ from, to })}`),
    taskAging: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/eisenhower/task-aging?${params({ from, to })}`),
    q1q2RatioTrend: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/eisenhower/q1-q2-ratio-trend?${params({ from, to })}`),
  },
  decisions: {
    volume: (from: string, to: string, lifeAreaId?: string) =>
      fetchApi(`${API_BASE}/api/reports/decisions/volume?${params({ from, to, lifeAreaId })}`),
    outcomeTracking: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/decisions/outcome-tracking?${params({ from, to })}`),
    byLifeArea: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/decisions/by-life-area?${params({ from, to })}`),
    focusTime: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/decisions/focus-time?${params({ from, to })}`),
  },
  calendarSync: {
    health: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/calendar-sync/health?${params({ from, to })}`),
    conflicts: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/calendar-sync/conflicts?${params({ from, to })}`),
  },
  summary: {
    weekly: (date?: string) =>
      fetchApi(`${API_BASE}/api/reports/summary/weekly?${params({ date })}`),
    monthlyScore: (date?: string) =>
      fetchApi(`${API_BASE}/api/reports/summary/monthly-score?${params({ date })}`),
    streakDashboard: () =>
      fetchApi(`${API_BASE}/api/reports/summary/streak-dashboard`),
    goalVelocity: (from: string, to: string) =>
      fetchApi(`${API_BASE}/api/reports/summary/goal-velocity?${params({ from, to })}`),
  },
};
