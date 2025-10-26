import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardData } from '@/types/BidLinesClient.types';

interface UseBidLineDataProps {
  selectedOperation: string;
  searchTerm: string;
  selectedStatus: string;
  selectedCategories: string[];
  categoryFilterMode: string;
}

/**
 * Custom hook for fetching dashboard data including bid lines, favorites, operations, and status counts
 */
export const useBidLineData = ({
  selectedOperation,
  searchTerm,
  selectedStatus,
  selectedCategories,
  categoryFilterMode,
}: UseBidLineDataProps) => {
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', selectedOperation, searchTerm, selectedStatus, selectedCategories, categoryFilterMode],
    queryFn: async (): Promise<DashboardData> => {
      const params = new URLSearchParams({
        operation: selectedOperation,
        search: searchTerm,
        status: selectedStatus,
        categories: selectedCategories.join(','),
        categoryMode: categoryFilterMode,
      });
      // Add timestamp to bypass cache after mutations
      const timestamp = queryClient.getQueryData(['cache-bust-timestamp']);
      if (timestamp) {
        params.append('_t', String(timestamp));
      }
      const res = await fetch(`/api/dashboard?${params}`, {
        headers: timestamp ? { 'x-cache-bust': 'true' } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
  });

  // Extract data from the combined response with defaults
  const bidLines = dashboardData?.bidLines || [];
  const favoriteBidLines = dashboardData?.favorites || [];
  const operations = dashboardData?.operations || [];
  const allBidLines = bidLines; // All bid lines are now in the main bidLines array
  const statusCounts = dashboardData?.statusCounts || { AVAILABLE: 0, TAKEN: 0, BLACKED_OUT: 0, total: 0 };

  return {
    dashboardData,
    bidLines,
    favoriteBidLines,
    operations,
    allBidLines,
    statusCounts,
    isLoading,
    refetch,
  };
};