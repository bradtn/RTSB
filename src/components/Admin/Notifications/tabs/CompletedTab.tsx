'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useSeniorityData } from '../hooks/useSeniorityData';
import { OfficerCard } from '../shared/OfficerCard';
import { Pagination } from '@/components/shared/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { useSearchAndFilter, createOfficerSearchFunction } from '@/hooks/useSearchAndFilter';

interface CompletedTabProps {
  locale: string;
}

export function CompletedTab({ locale }: CompletedTabProps) {
  const { t } = useTranslation(locale);
  
  // Fetch completed officers only
  const { 
    seniorityList: completedOfficers, 
    loading: dataLoading,
    getRecentNotificationInfo 
  } = useSeniorityData({ 
    includeCompleted: true // This now fetches ONLY completed officers
  });

  // Search functionality
  const searchFunction = createOfficerSearchFunction('name', 'badge');
  const { 
    searchTerm, 
    setSearchTerm, 
    filteredItems
  } = useSearchAndFilter(completedOfficers, searchFunction);

  // Sort by completion time (most recent first), then by seniority rank
  const sortedList = [...filteredItems].sort((a, b) => {
    if (a.bidAt && b.bidAt) {
      return new Date(b.bidAt).getTime() - new Date(a.bidAt).getTime();
    }
    return Number(a.rank) - Number(b.rank);
  });

  // Pagination
  const pagination = usePagination(sortedList, 20, [searchTerm]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Completed Officers
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Officers who have finished their bidding ({pagination.totalItems} completed)
        </p>
      </div>

      {/* Search Controls */}
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
        </div>
        
        {/* Results summary */}
        {searchTerm && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing {filteredItems.length} of {completedOfficers.length} completed officers
            <span> matching "{searchTerm}"</span>
          </div>
        )}
      </div>
      
      {/* Officer List */}
      <div className="space-y-2">
        {dataLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading completed officers...
          </div>
        ) : pagination.paginatedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm 
              ? 'No completed officers match your search criteria' 
              : 'No officers have completed bidding yet'}
          </div>
        ) : (
          pagination.paginatedItems.map((officer) => (
            <OfficerCard
              key={officer.id}
              officer={officer}
              recentNotification={getRecentNotificationInfo(officer.id)}
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