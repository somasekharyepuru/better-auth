import { QueryClient, useQuery } from "@tanstack/react-query";
import { daysApi, Day, DaySummary } from "@/lib/daymark-api";

export const dayKeys = {
  all: ["days"] as const,
  /** Prefix matched by all range queries — useful for blanket invalidation. */
  rangeAll: ["days", "range"] as const,
  day: (date: string, lifeAreaId?: string | null) =>
    [...dayKeys.all, date, lifeAreaId] as const,
  range: (start: string, end: string, lifeAreaId?: string | null) =>
    [...dayKeys.rangeAll, start, end, lifeAreaId] as const,
};

/**
 * Invalidate everything that could surface a given day's data. Mutations
 * touching priorities / discussion / time blocks / quick notes / reviews
 * must call this so the dashboard's week and month overviews refresh too —
 * the per-day key alone won't reach the range cache.
 */
export function invalidateDayCaches(
  queryClient: QueryClient,
  date: string,
  lifeAreaId?: string | null,
) {
  queryClient.invalidateQueries({ queryKey: dayKeys.day(date, lifeAreaId) });
  // Range queries are keyed by [start, end, lifeAreaId]; the simplest
  // correct invalidation is the prefix — a refetch is cheap (one HTTP call).
  queryClient.invalidateQueries({ queryKey: dayKeys.rangeAll });
}

export function useDayQuery(date: string, lifeAreaId?: string | null) {
  return useQuery<Day, Error>({
    queryKey: dayKeys.day(date, lifeAreaId),
    queryFn: () => daysApi.getDay(date, lifeAreaId || undefined),
    enabled: !!date && lifeAreaId !== undefined,
  });
}

/**
 * Fetch lightweight day summaries for a date range. Powers the week / month
 * dashboard overviews. Returns one entry per calendar date in [start, end].
 */
export function useDaysRangeQuery(
  start: string,
  end: string,
  lifeAreaId?: string | null,
) {
  return useQuery<DaySummary[], Error>({
    queryKey: dayKeys.range(start, end, lifeAreaId),
    queryFn: () => daysApi.getRange(start, end, lifeAreaId || undefined),
    enabled: !!start && !!end && lifeAreaId !== undefined,
  });
}
