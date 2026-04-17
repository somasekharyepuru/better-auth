import { useMutation, useQueryClient } from "@tanstack/react-query";
import { discussionItemsApi, DiscussionItem, Day } from "@/lib/daymark-api";
import { dayKeys } from "../queries/use-day";

interface MutationContext {
  previousDay: Day | undefined;
}

// Minimal implementation similar to priorities
// Real optimistic updates can be expanded similarly if needed, but for simplicity we rely on invalidation for now, 
// or implement the same pattern if required by the UX.

export function useDiscussionMutations(date: string, lifeAreaId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = dayKeys.day(date, lifeAreaId);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  // Example of simplified optimistic update setter
  const setOptimistic = async (updateFn: (prev: Day) => Day) => {
    await queryClient.cancelQueries({ queryKey });
    const previousDay = queryClient.getQueryData<Day>(queryKey);
    if (previousDay) {
      queryClient.setQueryData<Day>(queryKey, updateFn(previousDay));
    }
    return { previousDay };
  };

  const rollback = (context: MutationContext | undefined) => {
    if (context?.previousDay) {
      queryClient.setQueryData(queryKey, context.previousDay);
    }
  };

  const createItem = useMutation({
    mutationFn: (content: string) => discussionItemsApi.create(date, content, lifeAreaId || undefined),
    onSettled: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => discussionItemsApi.update(id, content),
    onMutate: async ({ id, content }) => setOptimistic(prev => ({
        ...prev,
        discussionItems: prev.discussionItems.map(item => item.id === id ? { ...item, content } : item)
    })),
    onError: (err, vars, context) => rollback(context as MutationContext),
    onSettled: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => discussionItemsApi.delete(id),
    onMutate: async (id) => setOptimistic(prev => ({
        ...prev,
        discussionItems: prev.discussionItems.filter(item => item.id !== id)
    })),
    onError: (err, vars, context) => rollback(context as MutationContext),
    onSettled: invalidate,
  });

  const moveItem = useMutation({
    mutationFn: ({ id, targetLifeAreaId }: { id: string; targetLifeAreaId: string | null }) => discussionItemsApi.move(id, targetLifeAreaId, date),
    onSettled: () => queryClient.invalidateQueries({ queryKey: dayKeys.all }),
  });

  // Since TopPriorities passed an 'onUpdate' prop, this is all encapsulated and handled natively by react query cache.
  // The UI just needs to call these mutations.

  return { createItem, updateItem, deleteItem, moveItem };
}
