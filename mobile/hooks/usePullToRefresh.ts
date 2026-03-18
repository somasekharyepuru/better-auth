/**
 * usePullToRefresh Hook
 *
 * Provides pull-to-refresh functionality for FlatList components.
 * Compatible with React Native's RefreshControl.
 */

import { useState, useCallback } from 'react';

interface UsePullToRefreshReturn {
  refreshing: boolean;
  onRefresh: () => void;
}

export function usePullToRefresh(
  refreshFn: () => Promise<void>
): UsePullToRefreshReturn {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshFn().finally(() => {
      setRefreshing(false);
    });
  }, [refreshFn]);

  return {
    refreshing,
    onRefresh,
  };
}
