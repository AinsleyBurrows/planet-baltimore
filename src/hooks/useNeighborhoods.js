import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useNeighborhoods() {
  return useQuery({
    queryKey: ['neighborhoods-list'],
    queryFn: () => base44.entities.Neighborhood.list('name', 100),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}