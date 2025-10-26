import { useState, useEffect, useCallback } from 'react';

export interface SeniorityOfficer {
  id: string;
  name: string;
  badge: string;
  rank: number;
  status: 'completed' | 'up_next' | 'next_in_line' | 'waiting';
  email: string | null;
  phone: string | null;
  bidAt?: string;
  notificationLanguage?: 'EN' | 'FR';
}

interface RecentNotification {
  timestamp: string;
  type: string;
}

interface UseSeniorityDataOptions {
  includeCompleted?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSeniorityData(options: UseSeniorityDataOptions = {}) {
  const { 
    includeCompleted = false, 
    autoRefresh = false, 
    refreshInterval = 30000 
  } = options;

  const [seniorityList, setSeniorityList] = useState<SeniorityOfficer[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Record<string, RecentNotification>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch seniority list from API
  const fetchSeniorityList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seniority/upload');
      
      if (!response.ok) {
        throw new Error('Failed to fetch seniority list');
      }

      const data = await response.json();
      
      // Transform and filter data
      let transformedData = data.map((entry: any) => ({
        id: entry.userId,
        name: `${entry.user.firstName} ${entry.user.lastName}`,
        badge: entry.user.badgeNumber,
        rank: Number(entry.seniorityRank),
        status: entry.currentBiddingStatus,
        email: entry.personalEmail || entry.workEmail || entry.user.email,
        phone: entry.personalPhone || entry.workPhone || entry.user.phoneNumber || '5199806363',
        bidAt: entry.bidAt,
        notificationLanguage: entry.user.notificationLanguage || 'EN',
      }));

      // Filter based on includeCompleted option
      if (!includeCompleted) {
        transformedData = transformedData.filter((officer: SeniorityOfficer) => 
          officer.status !== 'completed'
        );
      } else {
        // If we want only completed, filter for those
        transformedData = transformedData.filter((officer: SeniorityOfficer) => 
          officer.status === 'completed'
        );
      }

      setSeniorityList(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching seniority list:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      // Fallback to empty list on error
      setSeniorityList([]);
    } finally {
      setLoading(false);
    }
  }, [includeCompleted]);

  // Fetch recent notifications
  const fetchRecentNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications/history?recent=30');
      
      if (!response.ok) {
        console.warn('Failed to fetch recent notifications');
        return;
      }

      const data = await response.json();
      const recentMap: Record<string, RecentNotification> = {};
      
      data.forEach((notification: any) => {
        // Keep only the most recent notification per user
        if (!recentMap[notification.userId] || 
            new Date(notification.sentAt) > new Date(recentMap[notification.userId].timestamp)) {
          recentMap[notification.userId] = {
            timestamp: notification.sentAt,
            type: notification.type
          };
        }
      });
      
      setRecentNotifications(recentMap);
    } catch (err) {
      console.error('Error fetching recent notifications:', err);
      // Don't set error for notification fetch failure
    }
  }, []);

  // Combined refresh function
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchSeniorityList(),
      fetchRecentNotifications()
    ]);
  }, [fetchSeniorityList, fetchRecentNotifications]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  // Get recent notification info for a specific officer
  const getRecentNotificationInfo = useCallback((
    officerId: string, 
    checkType?: 'your_turn' | 'next_in_line'
  ) => {
    const recent = recentNotifications[officerId];
    if (!recent) return null;
    
    const minutesAgo = Math.floor(
      (new Date().getTime() - new Date(recent.timestamp).getTime()) / (1000 * 60)
    );
    
    const typeText = recent.type === 'your_turn' 
      ? 'Turn to Bid' 
      : recent.type === 'next_in_line' 
        ? 'Next in Line' 
        : recent.type;
    
    const isMatchingType = !checkType || recent.type === checkType;
    
    return {
      minutesAgo,
      typeText,
      isRecent: minutesAgo < 30,
      isMatchingType,
      type: recent.type
    };
  }, [recentNotifications]);

  return {
    seniorityList,
    recentNotifications,
    loading,
    error,
    refreshData,
    getRecentNotificationInfo,
  };
}