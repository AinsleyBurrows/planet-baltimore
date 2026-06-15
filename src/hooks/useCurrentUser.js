import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Shared hook for the authenticated user.
 * Backed by React Query — one network call, shared across all consumers.
 * staleTime: 5 min so navigating around never re-fetches unnecessarily.
 */
export function useCurrentUser() {
  const { data: user = null, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return { user, isLoading };
}