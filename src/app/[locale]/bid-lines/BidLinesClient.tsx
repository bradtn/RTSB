'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import BidLineCard from '@/components/BidLine/BidLineCard';
import Header from '@/components/Layout/Header';
import { Search, Filter, RefreshCw, ChevronDown, ChevronRight, X, Info, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import ActivityTicker from '@/components/BidLine/ActivityTicker';
import AdminNotificationModal from '@/components/Admin/AdminNotificationModal';
import DayOffRequestsSection from '@/components/BidLine/DayOffRequestsSection';
import { emitLineUpdate, BidLineUpdateData } from '@/lib/socket';

// Extracted components and utilities
import ModernToggle from '@/components/UI/ModernToggle';
import ModernSelect from '@/components/UI/ModernSelect';
import { BidLinesClientProps, DayOffMatch, BidLineStatus, SortByOption } from '@/types/BidLinesClient.types';
import { naturalSort } from '@/utils/sorting';
import { getLocalizedOperationName, getLocalizedCategoryName } from '@/utils/localization';
import { BID_LINE_CATEGORIES } from '@/constants/bidLineCategories';
import { CAN_CLAIM_LINES } from '@/constants/permissions';
import { useBidLineData } from '@/hooks/useBidLineData';
import { useMetricSettings } from '@/hooks/useMetricSettings';
import { useBidLineFilters } from '@/hooks/useBidLineFilters';
import { useBidLineUI } from '@/hooks/useBidLineUI';
import { useBidLineMutations } from '@/hooks/useBidLineMutations';
import { useScrollPersistence } from '@/hooks/usePersistentState';
import { useDayOffMatches } from '@/hooks/useDayOffMatches';
import { useWebSocketManager } from '@/hooks/useWebSocketManager';
import { useGroupedBidLines } from '@/hooks/useGroupedBidLines';
import FavoritesSection from '@/components/BidLine/FavoritesSection';
import FilterSection from '@/components/BidLine/FilterSection';
import OperationHeader from '@/components/BidLine/OperationHeader';




export default function BidLinesClient({ locale, translations }: BidLinesClientProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const params = useParams();
  const { t } = useTranslation(params.locale as string);
  
  
  // Activity ticker ref
  const activityTickerRef = useRef<{ addMessage: (data: BidLineUpdateData) => void } | null>(null);
  
  // Use extracted hooks for state management
  const filterHooks = useBidLineFilters();
  const {
    selectedOperation,
    setSelectedOperation,
    searchTerm,
    setSearchTerm,
    selectedCategories,
    setSelectedCategories,
    categoryFilterMode,
    setCategoryFilterMode,
    selectedStatus,
    setSelectedStatus,
    sortBy,
    setSortBy,
    unfilteredCounts,
    setUnfilteredCounts,
    expandedOperations,
    setExpandedOperations,
    operationSearchTerms,
    setOperationSearchTerms,
    clearFilters,
  } = filterHooks;
  
  const {
    isFavoritesExpanded,
    setIsFavoritesExpanded,
    favoritesSearchTerm,
    setFavoritesSearchTerm,
    isFiltersExpanded,
    setIsFiltersExpanded,
  } = useBidLineUI();

  // Use extracted hooks for data fetching
  const {
    dashboardData,
    bidLines,
    favoriteBidLines,
    operations,
    allBidLines,
    statusCounts,
    isLoading,
    refetch,
  } = useBidLineData({
    selectedOperation,
    searchTerm,
    selectedStatus,
    selectedCategories,
    categoryFilterMode,
  });

  // Persist scroll position - only restore after data is loaded
  const { lastScrollPosition, clearScrollPosition } = useScrollPersistence('bidlines-scroll-position', !isLoading && bidLines !== undefined);
  
  console.log('BidLinesClient selectedOperation:', selectedOperation);
  const { metricSettings } = useMetricSettings({ selectedOperation });
  
  const { favoriteMutation, claimMutation, manageMutation } = useBidLineMutations(
    selectedOperation,
    searchTerm,
    selectedStatus
  );

  // Day-off match management
  const { dayOffMatches, isLoadingDayOffMatches, userHasDayOffRequests } = useDayOffMatches(bidLines);

  // WebSocket management for real-time updates
  useWebSocketManager({ activityTickerRef });

  // Grouped bid lines management
  const { groupedBidLines, toggleOperation, expandAll, collapseAll, filterOperationLines } = useGroupedBidLines({
    bidLines,
    sortBy,
    dayOffMatches,
    expandedOperations,
    setExpandedOperations,
    operationSearchTerms,
    selectedStatus,
  });

  
  // Monitor actual data and reset filter when it becomes empty
  useEffect(() => {
    if (selectedStatus !== 'all' && !isLoading && dashboardData) {
      const currentFilterCount = statusCounts[selectedStatus] || 0;
      console.log(`Debug (useEffect): selectedStatus='${selectedStatus}', currentFilterCount=${currentFilterCount}, statusCounts=`, statusCounts);
      if (currentFilterCount === 0 && statusCounts.total > 0) {
        console.log(`Filter '${selectedStatus}' is empty but total > 0, resetting to 'all'`);
        setSelectedStatus('all');
      }
    }
  }, [selectedStatus, statusCounts, isLoading, dashboardData]);
  
  // Cache unfiltered counts when we have complete data (status = 'all')
  useEffect(() => {
    if (selectedStatus === 'all' && bidLines && bidLines.length > 0) {
      const operationCounts: {[operation: string]: {available: number, taken: number, blackedOut: number, total: number}} = {};
      
      // Group by operation and count
      bidLines.forEach((line: any) => {
        const operationName = line.operation?.name || 'Unknown Operation';
        if (!operationCounts[operationName]) {
          operationCounts[operationName] = { available: 0, taken: 0, blackedOut: 0, total: 0 };
        }
        
        operationCounts[operationName].total++;
        if (line.status === 'AVAILABLE') operationCounts[operationName].available++;
        else if (line.status === 'TAKEN') operationCounts[operationName].taken++;
        else if (line.status === 'BLACKED_OUT') operationCounts[operationName].blackedOut++;
      });
      
      setUnfilteredCounts(operationCounts);
    }
  }, [selectedStatus, bidLines]);

  // Extract bid period start date from any bid line (they should all have the same bid period)
  const bidPeriodStartDate = bidLines?.length > 0 
    ? bidLines[0]?.bidPeriod?.startDate
    : null;

  // Removed aggressive auto-clear logic that was resetting filters when users explicitly selected a status
  // Users should be able to see empty state with their selected filter rather than having it auto-reset
  // This was causing the issue where clicking "assigned" would immediately reset to "all" when no assigned items exist




  const handleFavoriteToggle = async (bidLineId: string, favoriteId?: string, isFavorited?: boolean) => {
    await favoriteMutation.mutateAsync({ 
      bidLineId, 
      favoriteId, 
      isFavorited: isFavorited || false 
    });
  };

  const handleClaim = async (bidLineId: string) => {
    // Find the bid line to get its details before claiming
    const bidLine = bidLines?.find((line: any) => line.id === bidLineId);
    
    try {
      const result = await claimMutation.mutateAsync({ bidLineId });
      
      // Emit real-time update after successful claim
      if (bidLine && session?.user) {
        const updateData = {
          bidLineId,
          lineNumber: bidLine.lineNumber,
          status: 'TAKEN' as const,
          takenBy: session.user.name || session.user.email,
          takenAt: new Date().toISOString(),
          claimedBy: session.user.id,
        };
        
        emitLineUpdate(updateData);
        
        // Also add to local ticker immediately
        if (activityTickerRef.current) {
          activityTickerRef.current.addMessage(updateData);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Failed to claim line:', error);
      throw error;
    }
  };

  const handleManage = async (bidLineId: string, action: 'assign' | 'release' | 'blackout', data?: any) => {
    // Find the bid line to get its details
    const bidLine = bidLines?.find((line: any) => line.id === bidLineId);
    
    try {
      const result = await manageMutation.mutateAsync({ bidLineId, action, data });
      
      // Emit real-time update after successful management action
      if (bidLine) {
        let newStatus: 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT' = 'AVAILABLE';
        let takenBy: string | undefined;
        
        if (action === 'assign' && data?.officerName) {
          newStatus = 'TAKEN';
          takenBy = data.officerName;
        } else if (action === 'blackout') {
          newStatus = 'BLACKED_OUT';
        } else if (action === 'release') {
          newStatus = 'AVAILABLE';
        }
        
        // Add to local ticker immediately for instant feedback
        // The server will also emit a WebSocket update for other clients
        const updateData = {
          bidLineId,
          lineNumber: bidLine.lineNumber,
          status: newStatus,
          takenBy,
          takenAt: newStatus === 'TAKEN' ? new Date().toISOString() : undefined,
          operationName: bidLine.operation?.name,
        };
        
        if (activityTickerRef.current) {
          activityTickerRef.current.addMessage(updateData);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to ${action} line:`, error);
      throw error;
    }
  };

  const canClaimLines = CAN_CLAIM_LINES; // Self-bidding disabled - officers cannot claim lines directly
  
  const isAdmin = !!session?.user?.role && ['SUPER_ADMIN', 'SUPERVISOR'].includes(session.user.role);



  return (
    <div className="relative">
      <Header
        locale={locale}
        translations={{
          appTitle: translations.appTitle,
          navHome: translations.navHome,
          navBidLines: translations.navBidLines,
          
          navAdmin: translations.navAdmin,
          navLogin: translations.navLogin,
          navLogout: translations.navLogout,
        }}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-7xl px-1 sm:px-6 lg:px-8 py-2 sm:py-8">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 transition-all duration-500 hover:scale-105 cursor-default">{translations.navBidLines}</h1>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300 hover:text-gray-800 dark:hover:text-gray-100">{translations.appDescription}</p>
        </div>

        {/* Real-time Activity Ticker */}
        <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
          <ActivityTicker 
            ref={activityTickerRef}
            className="w-full"
            locale={locale}
          />
        </div>

        {/* Day-Off Requests Section */}
        {session?.user && (
          <div className="mb-6 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <DayOffRequestsSection 
              locale={locale}
              translations={{
                ...translations.dayOffRequests,
                expand: t('bidLine.clickToExpand'),
                collapse: t('bidLine.clickToCollapse')
              }}
              bidPeriodStartDate={bidPeriodStartDate}
            />
            {isLoadingDayOffMatches && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                  Calculating day-off matches...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modern Filter Section */}
        <FilterSection
          isFiltersExpanded={isFiltersExpanded}
          setIsFiltersExpanded={setIsFiltersExpanded}
          selectedOperation={selectedOperation}
          setSelectedOperation={setSelectedOperation}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          categoryFilterMode={categoryFilterMode}
          setCategoryFilterMode={setCategoryFilterMode}
          operations={operations}
          clearFilters={clearFilters}
          locale={locale}
          t={t}
        />
        


        {/* Favorites Section */}
        {session?.user && (
          <FavoritesSection
            favoriteBidLines={favoriteBidLines}
            isFavoritesExpanded={isFavoritesExpanded}
            setIsFavoritesExpanded={setIsFavoritesExpanded}
            favoritesSearchTerm={favoritesSearchTerm}
            setFavoritesSearchTerm={setFavoritesSearchTerm}
            userHasDayOffRequests={userHasDayOffRequests}
            metricSettings={metricSettings}
            translations={translations}
            handleFavoriteToggle={handleFavoriteToggle}
            handleClaim={handleClaim}
            canClaimLines={canClaimLines}
            isAdmin={isAdmin}
            handleManage={async (params: { bidLineId: string; action: string; data?: any }) => {
              await handleManage(params.bidLineId, params.action as 'assign' | 'release' | 'blackout', params.data);
            }}
            t={t}
          />
        )}

        {/* Operation Controls */}
        {!isLoading && Object.keys(groupedBidLines).length > 0 && (
          <div className="flex items-center justify-between mb-6 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {Object.keys(groupedBidLines).length} {translations.bidLine?.operations || 'operations'} • {bidLines?.length || 0} lines {translations.bidLine?.total || 'total'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Clear all persisted state and reset view
                  if (confirm('Reset all filters, expanded sections, and saved preferences?')) {
                    filterHooks.clearAllPersistedState();
                    clearScrollPosition();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-md hover:scale-105 transform font-medium"
                title="Clear all saved preferences and reset view"
              >
                <RefreshCw className="inline-block w-4 h-4 mr-1" />
                Reset View
              </button>
              <button
                onClick={expandAll}
                className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-all duration-300 hover:shadow-md hover:scale-105 transform font-medium"
              >
                {translations.bidLine?.expandAll || 'Expand All'}
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 hover:shadow-md hover:scale-105 transform font-medium"
              >
                {translations.bidLine?.collapseAll || 'Collapse All'}
              </button>
            </div>
          </div>
        )}

        {/* Grouped Bid Lines */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading bid lines...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedBidLines)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([operationName, operationBidLines]) => {
                const isExpanded = expandedOperations.has(operationName);
                const filteredLines = filterOperationLines(operationBidLines, operationName);
                
                // Get total counts for this operation - use cached unfiltered counts when available
                const cachedCounts = unfilteredCounts[operationName];
                let totalAvailableCount, totalTakenCount, totalBlackedOutCount, totalCount;
                
                if (cachedCounts && selectedStatus !== 'all') {
                  // Use cached unfiltered counts when status filter is active
                  totalAvailableCount = cachedCounts.available;
                  totalTakenCount = cachedCounts.taken;
                  totalBlackedOutCount = cachedCounts.blackedOut;
                  totalCount = cachedCounts.total;
                } else {
                  // Calculate from current data when no status filter or no cache
                  const allOperationLines = allBidLines?.filter((line: any) => line.operation?.name === operationName) || [];
                  totalAvailableCount = allOperationLines.filter((line: any) => line.status === 'AVAILABLE').length;
                  totalTakenCount = allOperationLines.filter((line: any) => line.status === 'TAKEN').length;
                  totalBlackedOutCount = allOperationLines.filter((line: any) => line.status === 'BLACKED_OUT').length;
                  totalCount = allOperationLines.length;
                }
                
                // Get filtered counts from currently displayed data
                const filteredAvailableCount = operationBidLines.filter((line: any) => line.status === 'AVAILABLE').length;
                const filteredTakenCount = operationBidLines.filter((line: any) => line.status === 'TAKEN').length;
                const filteredBlackedOutCount = operationBidLines.filter((line: any) => line.status === 'BLACKED_OUT').length;
                const filteredTotalCount = operationBidLines.length;
                
                return (
                  <div key={operationName} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 mb-4">
                    <OperationHeader
                      operationName={operationName}
                      operationBidLines={operationBidLines}
                      isExpanded={isExpanded}
                      onToggle={() => toggleOperation(operationName)}
                      selectedStatus={selectedStatus}
                      setSelectedStatus={setSelectedStatus}
                      operationSearchTerm={operationSearchTerms?.[operationName] || ''}
                      setOperationSearchTerm={(term) => setOperationSearchTerms(prev => ({
                        ...(prev || {}),
                        [operationName]: term
                      }))}
                      filteredLines={filteredLines}
                      totalAvailableCount={totalAvailableCount}
                      totalTakenCount={totalTakenCount}
                      totalBlackedOutCount={totalBlackedOutCount}
                      totalCount={totalCount}
                      locale={locale}
                      translations={translations}
                      t={t}
                    />
                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 auto-rows-fr px-2 sm:px-6 pb-6">
                          {filteredLines.map((bidLine: any, index: number) => (
                            <div key={bidLine.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                              <BidLineCard
                                bidLine={bidLine}
                                shouldFetchDayOffMatch={userHasDayOffRequests === true}
                                metricSettings={metricSettings}
                              translations={{
                                favoriteRemoved: translations.favoriteRemoved,
                                favoriteAdded: translations.favoriteAdded,
                                changesError: translations.changesError,
                                lineClaimedSuccess: translations.lineClaimedSuccess,
                                lineClaimedError: translations.lineClaimedError,
                                bidLineNumber: translations.bidLineNumber,
                                bidLineClaim: translations.bidLineClaim,
                                bidLineAvailable: translations.bidLineAvailable,
                                bidLineTaken: translations.bidLineTaken,
                                bidLineBlackedOut: translations.bidLineBlackedOut,
                                daysMon: translations.daysMon,
                                daysTue: translations.daysTue,
                                daysWed: translations.daysWed,
                                daysThu: translations.daysThu,
                                daysFri: translations.daysFri,
                                daysSat: translations.daysSat,
                                daysSun: translations.daysSun,
                                // Pass metric translations for AllMetricsModal from scheduleMetrics
                                ...(translations.scheduleMetrics || {}),
                                // Day-off match modal translations
                                dayOffMatch: translations.dayOffMatch,
                              }}
                              onFavoriteToggle={(bidLineId) => handleFavoriteToggle(bidLineId, bidLine.favoriteId, bidLine.isFavorited)}
                              onClaim={canClaimLines ? handleClaim : undefined}
                              canClaim={canClaimLines}
                              isAdmin={isAdmin}
                              onManage={isAdmin ? (id: string, action: 'assign' | 'release' | 'blackout', data?: any) => {
                                handleManage(id, action, data);
                              } : undefined}
                            />
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })}
          </div>
        )}

        {!isLoading && Object.keys(groupedBidLines).length === 0 && (
          <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-600">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors duration-300 hover:text-gray-600 dark:hover:text-gray-300">{translations.noData}</p>
          </div>
        )}
        </div>
      </div>

      {/* Admin Notification Modal */}
      <AdminNotificationModal locale={locale} />
    </div>
  );
}