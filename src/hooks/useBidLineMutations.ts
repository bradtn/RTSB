import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { emitLineUpdate, BidLineUpdateData } from '@/lib/socket';

interface FavoriteMutationParams {
  bidLineId: string;
  favoriteId?: string;
  isFavorited: boolean;
}

interface ClaimMutationParams {
  bidLineId: string;
}

interface ManageMutationParams {
  bidLineId: string;
  action: 'assign' | 'release' | 'blackout';
  data?: any;
}

/**
 * Custom hook for bid line mutations (favorite, claim, manage)
 */
export const useBidLineMutations = (selectedOperation: string, searchTerm: string, selectedStatus: string) => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async ({ bidLineId, favoriteId, isFavorited }: FavoriteMutationParams) => {
      console.log('Favorite mutation called for:', bidLineId, 'currently favorited:', isFavorited);
      
      // Use the faster /api/bid-lines/[id]/favorite endpoint that handles both add and remove
      const res = await fetch(`/api/bid-lines/${bidLineId}/favorite`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        console.error('Favorite API failed:', res.status, res.statusText);
        throw new Error('Failed to toggle favorite');
      }
      
      const data = await res.json();
      console.log('Favorite API response:', data);
      
      return { 
        action: data.favorited ? 'added' : 'removed', 
        bidLineId, 
        data: data.data,
        favorited: data.favorited 
      };
    },
    onSuccess: async (result) => {
      console.log('Favorite mutation success:', result);
      
      // Set a timestamp to force cache-busting on next query
      queryClient.setQueryData(['cache-bust-timestamp'], Date.now());
      
      // Invalidate and refetch the dashboard data
      const queryKey = ['dashboard', selectedOperation, searchTerm, selectedStatus];
      queryClient.invalidateQueries({ queryKey });
      
      // Clear the timestamp after a short delay
      setTimeout(() => {
        queryClient.setQueryData(['cache-bust-timestamp'], null);
      }, 1000);
    },
    onError: (error) => {
      console.error('Favorite mutation error:', error);
    },
  });

  // Claim mutation (currently disabled)
  const claimMutation = useMutation({
    mutationFn: async ({ bidLineId }: ClaimMutationParams) => {
      const res = await fetch(`/api/bid-lines/${bidLineId}/claim`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to claim line');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Line claimed successfully!');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Emit real-time update
      const updateData: BidLineUpdateData = {
        bidLineId: data.id,
        lineNumber: data.lineNumber,
        status: 'TAKEN',
        takenBy: session?.user?.name || session?.user?.email || 'Unknown User',
        takenAt: new Date().toISOString(),
        claimedBy: session?.user?.id || ''
      };
      emitLineUpdate(updateData);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to claim line');
    },
  });

  // Management mutation (admin actions)
  const manageMutation = useMutation({
    mutationFn: async ({ bidLineId, action, data }: ManageMutationParams) => {
      const res = await fetch(`/api/bid-lines/${bidLineId}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Failed to ${action} line` }));
        throw new Error(errorData.message || errorData.error || `Failed to ${action} line`);
      }
      return { ...await res.json(), action };
    },
    onSuccess: (result) => {
      const actionMessages = {
        assign: 'Line assigned successfully!',
        release: 'Line released successfully!',
        blackout: 'Line blacked out successfully!',
      };
      
      toast.success(actionMessages[result.action as keyof typeof actionMessages]);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Emit real-time update
      let status: 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT' = 'AVAILABLE';
      let takenBy: string | undefined;
      
      if (result.action === 'assign') {
        status = 'TAKEN';
        takenBy = result.assignedUserName;
      } else if (result.action === 'blackout') {
        status = 'BLACKED_OUT';
      } else if (result.action === 'release') {
        status = 'AVAILABLE';
      }
      
      const updateData: BidLineUpdateData = {
        bidLineId: result.id,
        lineNumber: result.lineNumber,
        status,
        takenBy,
        takenAt: status === 'TAKEN' ? new Date().toISOString() : undefined,
        claimedBy: session?.user?.id || ''
      };
      emitLineUpdate(updateData);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to perform action');
    },
  });

  return {
    favoriteMutation,
    claimMutation,
    manageMutation,
  };
};