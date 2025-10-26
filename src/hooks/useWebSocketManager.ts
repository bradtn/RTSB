import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { initSocket, subscribeToLineUpdates, subscribeToNotifications, BidLineUpdateData, NotificationData } from '@/lib/socket';

interface UseWebSocketManagerProps {
  activityTickerRef: React.RefObject<{ addMessage: (data: BidLineUpdateData) => void } | null>;
}

/**
 * Custom hook for managing WebSocket connections and real-time updates
 */
export const useWebSocketManager = ({ activityTickerRef }: UseWebSocketManagerProps) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user?.id) return;
    
    // For HTTPS production, use polling instead of WebSocket
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      console.log('Using polling for HTTPS production environment');
      
      // Poll for updates every 5 seconds in production for near real-time experience
      const pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }, 5000);
      
      return () => clearInterval(pollInterval);
    }

    console.log('Initializing WebSocket for user:', session.user.id);
    const socket = initSocket();
    
    // Subscribe to real-time bid line updates
    const unsubscribeLineUpdates = subscribeToLineUpdates((data: BidLineUpdateData) => {
      console.log('Real-time bid line update received:', data);
      
      // Add to activity ticker
      if (activityTickerRef.current) {
        activityTickerRef.current.addMessage(data);
      }
      
      // Invalidate queries to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Show toast notification for status changes
      if (data.status === 'TAKEN') {
        toast.success(`Line ${data.lineNumber} has been taken by ${data.takenBy || 'someone'}`, {
          duration: 4000,
        });
      } else if (data.status === 'AVAILABLE') {
        toast(`Line ${data.lineNumber} is now available`, {
          duration: 4000,
          icon: 'ℹ️',
        });
      }
    });

    // Subscribe to user notifications
    const unsubscribeNotifications = subscribeToNotifications(session.user.id, (data: NotificationData) => {
      console.log('Real-time notification received:', data);
      
      // Show notification toast
      if (data.type === 'LINE_TAKEN') {
        toast.error(data.message, {
          duration: 6000,
        });
      } else {
        toast(data.message, {
          duration: 4000,
          icon: 'ℹ️',
        });
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeLineUpdates();
      unsubscribeNotifications();
    };
  }, [session?.user?.id, queryClient, activityTickerRef]);
};