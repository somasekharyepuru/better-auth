/**
 * useAuthGuard Hook
 *
 * Protects authenticated routes by redirecting to login if not authenticated.
 * Should be used in protected screen layouts.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

interface UseAuthGuardReturn {
  user: ReturnType<typeof useAuth>['user'];
  isLoading: boolean;
}

export function useAuthGuard(): UseAuthGuardReturn {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/(auth)/login');
        return; // Keep loading true during redirect
      }
      setIsLoading(false); // Only set false when confirmed authenticated
    }
  }, [authLoading, isAuthenticated, router]);

  return {
    user,
    isLoading: isLoading || authLoading,
  };
}
