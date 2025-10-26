'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSeniorityData } from '../hooks/useSeniorityData';
import { OfficerCard } from '../shared/OfficerCard';
import { Pagination } from '@/components/shared/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { useSearchAndFilter, createOfficerSearchFunction } from '@/hooks/useSearchAndFilter';
import { notificationService } from '@/services/NotificationService';

interface QueueTabProps {
  locale: string;
}

export function QueueTab({ locale }: QueueTabProps) {
  const { t } = useTranslation(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Fetch seniority data (excluding completed officers)
  const { 
    seniorityList, 
    loading: dataLoading, 
    refreshData,
    getRecentNotificationInfo 
  } = useSeniorityData({ 
    includeCompleted: false,
    autoRefresh: true,
    refreshInterval: 30000 
  });

  // Search and filter
  const searchFunction = createOfficerSearchFunction('name', 'badge');
  const filterFunctions = statusFilter === 'all' 
    ? [] 
    : [(officer: any) => officer.status === statusFilter];
  
  const { 
    searchTerm, 
    setSearchTerm, 
    filteredItems,
    resultCount 
  } = useSearchAndFilter(seniorityList, searchFunction, filterFunctions);

  // Sort by rank
  const sortedList = [...filteredItems].sort((a, b) => Number(a.rank) - Number(b.rank));

  // Pagination
  const pagination = usePagination(sortedList, 20, [searchTerm, statusFilter]);

  // Send notification handler
  const handleSendNotification = async (officer: any) => {
    const notificationType = officer.status === 'up_next' ? 'your_turn' : 'next_in_line';
    const recentNotification = getRecentNotificationInfo(officer.id, notificationType);
    
    // Check if confirmation needed
    if (notificationService.shouldShowConfirmation(recentNotification)) {
      const message = notificationService.getConfirmationMessage(
        officer.name,
        recentNotification!.minutesAgo,
        recentNotification!.typeText
      );
      if (!confirm(message)) return;
    }
    
    setIsLoading(true);
    const success = await notificationService.sendNotification({
      userId: officer.id,
      type: notificationType,
      sendMethod: 'email',
    });
    
    if (success) {
      await refreshData();
    }
    setIsLoading(false);
  };

  // Mark as completed handler
  const handleMarkCompleted = async (officer: any) => {
    setIsLoading(true);
    const success = await notificationService.markAsCompleted({
      userId: officer.id,
    });
    
    if (success) {
      await refreshData();
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Bidding Queue
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Active officers awaiting to bid ({pagination.totalItems} in queue)
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or badge number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 cursor-pointer hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="up_next">Up Next</option>
            <option value="next_in_line">Next in Line</option>
            <option value="waiting">Waiting</option>
          </select>
          <button
            onClick={() => {
              setStatusFilter('up_next');
              setSearchTerm('');
            }}
            className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 transition-colors whitespace-nowrap font-medium shadow-sm"
            title="Show only officers who are up next"
          >
            Show Active
          </button>
        </div>
        
        {/* Results summary */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing {resultCount} of {seniorityList.length} officers
            {searchTerm && <span> matching "{searchTerm}"</span>}
            {statusFilter !== 'all' && <span> with status "{statusFilter.replace('_', ' ')}"</span>}
          </div>
        )}
      </div>
      
      {/* Officer List */}
      <div className="space-y-2">
        {dataLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading officers...
          </div>
        ) : pagination.paginatedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'No officers match your search criteria' 
              : 'No officers found'}
          </div>
        ) : (
          pagination.paginatedItems.map((officer) => (
            <OfficerCard
              key={officer.id}
              officer={officer}
              recentNotification={getRecentNotificationInfo(officer.id)}
              highlighted={officer.status === 'up_next'}
              actions={
                (officer.status === 'up_next' || officer.status === 'next_in_line') && (
                  <>
                    <button 
                      onClick={() => handleSendNotification(officer)}
                      disabled={isLoading}
                      className={`px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        getRecentNotificationInfo(officer.id, officer.status === 'up_next' ? 'your_turn' : 'next_in_line')?.isMatchingType && 
                        getRecentNotificationInfo(officer.id, officer.status === 'up_next' ? 'your_turn' : 'next_in_line')?.isRecent
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isLoading ? 'Sending...' : 
                        (getRecentNotificationInfo(officer.id, officer.status === 'up_next' ? 'your_turn' : 'next_in_line')?.isMatchingType && 
                         getRecentNotificationInfo(officer.id, officer.status === 'up_next' ? 'your_turn' : 'next_in_line')?.isRecent) 
                          ? 'Send Again' : 'Send Notification'}
                    </button>
                    {officer.status === 'up_next' && (
                      <button 
                        onClick={() => handleMarkCompleted(officer)}
                        disabled={isLoading}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Updating...' : 'Mark as Completed'}
                      </button>
                    )}
                  </>
                )
              }
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!dataLoading && pagination.totalPages > 1 && (
        <Pagination
          className="mt-4"
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          itemsPerPage={20}
          onPageChange={pagination.setCurrentPage}
          onNext={pagination.goToNextPage}
          onPrevious={pagination.goToPreviousPage}
          pageNumbers={pagination.pageNumbers}
        />
      )}
    </div>
  );
}