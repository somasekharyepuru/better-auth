/**
 * useRefreshOnFocus Hook
 *
 * Refreshes data when the screen comes into focus.
 * Uses @react-navigation/native's useFocusEffect for optimal performance.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface UseRefreshOnFocusOptions {
  refreshOnMount?: boolean;
}

export function useRefreshOnFocus(
  callback: () => void | Promise<void>,
  options: UseRefreshOnFocusOptions = {}
) {
  const { refreshOnMount = true } = options;
  const hasMounted = useRef(false);
  const latestCallbackRef = useRef(callback);

  // Keep ref updated with latest callback
  useEffect(() => {
    latestCallbackRef.current = callback;
  }, [callback]);

  // Refresh on mount
  useEffect(() => {
    if (refreshOnMount) {
      latestCallbackRef.current();
    }
    hasMounted.current = true;
  }, [refreshOnMount]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      if (hasMounted.current) {
        latestCallbackRef.current();
      }
    }, [callback])
  );
}
