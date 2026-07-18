import { useQuery } from '@tanstack/react-query';
import { operationService } from '@/modules/operations/services/OperationService';

/**
 * Hook to fetch dashboard data
 * @returns Query object with dashboard data
 */
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      return await operationService.getDashboardData();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};