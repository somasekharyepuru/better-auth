import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timeBlocksApi, EnhancedTimeBlock, CreateTimeBlockInput, UpdateTimeBlockInput, Day } from "@/lib/daymark-api";
import { invalidateDayCaches } from "../queries/use-day";

export function useTimeBlockMutations(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();

  const invalidate = () => invalidateDayCaches(queryClient, date, lifeAreaId);

  const createBlock = useMutation({
    mutationFn: (data: CreateTimeBlockInput) => timeBlocksApi.create(date, data, lifeAreaId || undefined),
    onSettled: invalidate,
  });

  const updateBlock = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeBlockInput }) => timeBlocksApi.update(id, data),
    onSettled: invalidate,
  });

  const deleteBlock = useMutation({
    mutationFn: (id: string) => timeBlocksApi.delete(id),
    onSettled: invalidate,
  });

  return { createBlock, updateBlock, deleteBlock };
}
