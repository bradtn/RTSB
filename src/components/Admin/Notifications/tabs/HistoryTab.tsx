'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { notificationService } from '@/services/NotificationService';
import { usePagination } from '@/hooks/usePagination';
import { useSearchAndFilter } from '@/hooks/useSearchAndFilter';
import { Pagination } from '@/components/shared/Pagination';

interface HistoryTabProps {
  locale: string;
}

interface NotificationHistoryItem {
  id: string;
  userId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  type: string;
  deliveryMethod: string;
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  error?: string;
  sentBy: string;
  sentAt: string;
  deliveredAt?: string;
  metadata?: any;
}

export function HistoryTab({ locale }: HistoryTabProps) {
  const { t } = useTranslation(locale);
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<string>('all'); // all, 1h, 24h, 7d

  // Fetch notification history
  const fetchHistory = async () => {
    setLoading(true);
    try {
      let data: NotificationHistoryItem[];
      
      switch (timeFilter) {
        case '1h':
          data = await notificationService.getNotificationHistory(60);
          break;
        case '24h':
          data = await notificationService.getNotificationHistory(1440);
          break;
        case '7d':
          data = await notificationService.getNotificationHistory(10080);
          break;
        default:
          data = await notificationService.getNotificationHistory();
      }
      
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching notification history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when time filter changes
  useEffect(() => {
    fetchHistory();
  }, [timeFilter]);

  // Search functionality
  const searchFunction = (item: NotificationHistoryItem, searchTerm: string) => {
    const recipient = item.recipientEmail || item.recipientPhone || '';
    const subject = item.subject || '';
    const message = item.message || '';
    const type = item.type || '';
    
    return recipient.toLowerCase().includes(searchTerm) ||
           subject.toLowerCase().includes(searchTerm) ||
           message.toLowerCase().includes(searchTerm) ||
           type.toLowerCase().includes(searchTerm);
  };

  const { searchTerm, setSearchTerm, filteredItems } = useSearchAndFilter(
    history,
    searchFunction
  );

  // Sort by sent date (most recent first)
  const sortedHistory = [...filteredItems].sort((a, b) => 
    new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  // Pagination
  const pagination = usePagination(sortedHistory, 10, [searchTerm, timeFilter]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs rounded-full';
    
    switch (status) {
      case 'delivered':
      case 'sent':
        return <span className={`${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}>Delivered</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}>Failed</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`}>Pending</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400`}>{status}</span>;
    }
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    const typeLabels = {
      'your_turn': 'Turn to Bid',
      'next_in_line': 'Next in Line',
      'reminder': 'Reminder',
      'custom': 'Custom'
    };
    
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Notification History
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Track all sent notifications ({pagination.totalItems} total)
        </p>
      </div>

      {/* Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <option value="all">All Time</option>
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors whitespace-nowrap font-medium shadow-sm"
          >
            Refresh
          </button>
        </div>

        {/* Results summary */}
        {(searchTerm || timeFilter !== 'all') && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredItems.length} of {history.length} notifications
            {searchTerm && <span> matching "{searchTerm}"</span>}
            {timeFilter !== 'all' && <span> from {timeFilter === '1h' ? 'last hour' : timeFilter === '24h' ? 'last 24 hours' : 'last 7 days'}</span>}
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="mt-2">Loading notification history...</span>
          </div>
        ) : pagination.paginatedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm || timeFilter !== 'all'
              ? 'No notifications match your criteria'
              : 'No notification history found'
            }
          </div>
        ) : (
          pagination.paginatedItems.map((item) => (
            <div key={item.id} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {item.recipientEmail || item.recipientPhone || 'Unknown'}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded">
                    {getTypeBadge(item.type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(item.status)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.deliveryMethod.toUpperCase()}
                  </span>
                </div>
              </div>
              
              {item.subject && (
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                  {item.subject}
                </div>
              )}
              
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {item.message.length > 100 ? `${item.message.substring(0, 100)}...` : item.message}
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <div>
                  Sent: {formatDate(item.sentAt)}
                  {item.deliveredAt && item.deliveredAt !== item.sentAt && (
                    <span> • Delivered: {formatDate(item.deliveredAt)}</span>
                  )}
                </div>
                {item.metadata?.automatic && (
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
                    Auto
                  </span>
                )}
              </div>
              
              {item.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
                  Error: {item.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Pagination
          className="mt-4"
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          itemsPerPage={10}
          onPageChange={pagination.setCurrentPage}
          onNext={pagination.goToNextPage}
          onPrevious={pagination.goToPreviousPage}
          pageNumbers={pagination.pageNumbers}
        />
      )}
    </div>
  );
}