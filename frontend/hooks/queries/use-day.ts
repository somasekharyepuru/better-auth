import { useQuery } from "@tanstack/react-query";
import { daysApi, Day } from "@/lib/daymark-api";

export const dayKeys = {
  all: ["days"] as const,
  day: (date: string, lifeAreaId?: string | null) =>
    [...dayKeys.all, date, lifeAreaId] as const,
};

export function useDayQuery(date: string, lifeAreaId?: string | null) {
  return useQuery<Day, Error>({
    queryKey: dayKeys.day(date, lifeAreaId),
    queryFn: () => daysApi.getDay(date, lifeAreaId || undefined),
    enabled: !!date && lifeAreaId !== undefined,
  });
}
