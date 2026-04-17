import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { prioritiesApi, TopPriority, Day } from "@/lib/daymark-api";
import { dayKeys } from "../queries/use-day";

interface MutationContext {
  previousDay: Day | undefined;
}

export function useTogglePriorityMutation(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = dayKeys.day(date, lifeAreaId);

  return useMutation({
    mutationFn: (id: string) => prioritiesApi.toggle(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDay = queryClient.getQueryData<Day>(queryKey);

      if (previousDay) {
        queryClient.setQueryData<Day>(queryKey, {
          ...previousDay,
          priorities: previousDay.priorities.map((p) =>
            p.id === id ? { ...p, completed: !p.completed } : p
          ),
        });
      }
      return { previousDay };
    },
    onError: (err, id, context) => {
      if (context?.previousDay) {
        queryClient.setQueryData(queryKey, context.previousDay);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdatePriorityMutation(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = dayKeys.day(date, lifeAreaId);

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      prioritiesApi.update(id, { title }),
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDay = queryClient.getQueryData<Day>(queryKey);

      if (previousDay) {
        queryClient.setQueryData<Day>(queryKey, {
          ...previousDay,
          priorities: previousDay.priorities.map((p) =>
            p.id === id ? { ...p, title } : p
          ),
        });
      }
      return { previousDay };
    },
    onError: (err, variables, context: MutationContext | undefined) => {
      if (context?.previousDay) {
        queryClient.setQueryData(queryKey, context.previousDay);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useCreatePriorityMutation(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = dayKeys.day(date, lifeAreaId);

  return useMutation({
    mutationFn: (title: string) => prioritiesApi.create(date, title, lifeAreaId || undefined),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDay = queryClient.getQueryData<Day>(queryKey);

      if (previousDay) {
        const optimisticPriority: TopPriority = {
          id: `temp-${Date.now()}`,
          title,
          completed: false,
          order: previousDay.priorities.length + 1,
          dayId: previousDay.id,
          createdAt: dayjs().toISOString(),
          updatedAt: dayjs().toISOString(),
          carriedToDate: null,
        };
        queryClient.setQueryData<Day>(queryKey, {
          ...previousDay,
          priorities: [...previousDay.priorities, optimisticPriority],
        });
      }
      return { previousDay };
    },
    onError: (err, title, context: MutationContext | undefined) => {
      if (context?.previousDay) {
        queryClient.setQueryData(queryKey, context.previousDay);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeletePriorityMutation(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = dayKeys.day(date, lifeAreaId);

  return useMutation({
    mutationFn: (id: string) => prioritiesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDay = queryClient.getQueryData<Day>(queryKey);

      if (previousDay) {
        queryClient.setQueryData<Day>(queryKey, {
          ...previousDay,
          priorities: previousDay.priorities.filter((p) => p.id !== id),
        });
      }
      return { previousDay };
    },
    onError: (err, id, context: MutationContext | undefined) => {
      if (context?.previousDay) {
        queryClient.setQueryData(queryKey, context.previousDay);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useReorderPrioritiesMutation(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = dayKeys.day(date, lifeAreaId);

  return useMutation({
    mutationFn: (priorities: TopPriority[]) =>
      prioritiesApi.reorder(priorities.map((p) => ({ id: p.id, order: p.order }))),
    onMutate: async (priorities) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDay = queryClient.getQueryData<Day>(queryKey);

      if (previousDay) {
        queryClient.setQueryData<Day>(queryKey, {
          ...previousDay,
          priorities,
        });
      }
      return { previousDay };
    },
    onError: (err, variables, context: MutationContext | undefined) => {
      if (context?.previousDay) {
        queryClient.setQueryData(queryKey, context.previousDay);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useMovePriorityMutation(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = dayKeys.day(date, lifeAreaId);

  return useMutation({
    mutationFn: ({ id, targetLifeAreaId }: { id: string; targetLifeAreaId: string | null }) =>
      prioritiesApi.move(id, targetLifeAreaId, date),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDay = queryClient.getQueryData<Day>(queryKey);

      if (previousDay) {
        queryClient.setQueryData<Day>(queryKey, {
          ...previousDay,
          priorities: previousDay.priorities.filter((p) => p.id !== id),
        });
      }
      return { previousDay };
    },
    onError: (err, variables, context: MutationContext | undefined) => {
      if (context?.previousDay) {
        queryClient.setQueryData(queryKey, context.previousDay);
      }
    },
    onSettled: () => {
      // Invalidate both current and all other day views to ensure the moved item shows up there
      queryClient.invalidateQueries({ queryKey: dayKeys.all });
    },
  });
}
