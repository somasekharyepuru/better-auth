import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { quickNotesApi, QuickNote, Day } from "@/lib/daymark-api";
import { dayKeys, invalidateDayCaches } from "../queries/use-day";

export function useQuickNoteMutations(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = dayKeys.day(date, lifeAreaId);

  const upsertNote = useMutation({
    mutationFn: (content: string) => quickNotesApi.upsert(date, content, lifeAreaId || undefined),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDay = queryClient.getQueryData<Day>(queryKey);
      if (previousDay) {
        queryClient.setQueryData<Day>(queryKey, {
          ...previousDay,
          quickNote: previousDay.quickNote ? { ...previousDay.quickNote, content } : {
             id: `temp-${Date.now()}`,
             content,
             dayId: previousDay.id,
             createdAt: dayjs().toISOString(),
             updatedAt: dayjs().toISOString()
          }
        });
      }
      return { previousDay };
    },
    onError: (err, content, context: any) => {
      if (context?.previousDay) {
        queryClient.setQueryData(queryKey, context.previousDay);
      }
    },
    onSettled: () => invalidateDayCaches(queryClient, date, lifeAreaId),
  });

  return { upsertNote };
}
