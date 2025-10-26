import React from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { BidLineStatus } from '@/types/BidLinesClient.types';
import { getLocalizedOperationName } from '@/utils/localization';

interface OperationHeaderProps {
  operationName: string;
  operationBidLines: any[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedStatus: BidLineStatus;
  setSelectedStatus: (status: BidLineStatus) => void;
  operationSearchTerm: string;
  setOperationSearchTerm: (term: string) => void;
  filteredLines: any[];
  totalAvailableCount: number;
  totalTakenCount: number;
  totalBlackedOutCount: number;
  totalCount: number;
  locale: string;
  translations: any;
  t: (key: string, params?: any) => string;
}

export default function OperationHeader({
  operationName,
  operationBidLines,
  isExpanded,
  onToggle,
  selectedStatus,
  setSelectedStatus,
  operationSearchTerm,
  setOperationSearchTerm,
  filteredLines,
  totalAvailableCount,
  totalTakenCount,
  totalBlackedOutCount,
  totalCount,
  locale,
  translations,
  t,
}: OperationHeaderProps) {
  const filteredAvailableCount = operationBidLines.filter((line: any) => line.status === 'AVAILABLE').length;
  const filteredTakenCount = operationBidLines.filter((line: any) => line.status === 'TAKEN').length;
  const filteredBlackedOutCount = operationBidLines.filter((line: any) => line.status === 'BLACKED_OUT').length;
  const filteredTotalCount = operationBidLines.length;

  return (
    <>
      {/* Operation Header */}
      <button
        onClick={onToggle}
        className={`w-full px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50/80 dark:hover:bg-gray-750 transition-all duration-300 hover:shadow-md group ${isExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          {/* Mobile: Operation name and chevron on top */}
          <div className="flex items-center gap-3">
            <ChevronRight 
              className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`} 
            />
            <span className="px-3 py-1.5 text-sm bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-800 dark:text-green-200 rounded-full font-semibold shadow-sm group-hover:shadow-md transition-all duration-300">
              {getLocalizedOperationName(operationBidLines[0]?.operation, locale)}
            </span>
            <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400">
              {isExpanded ? 'Collapse' : 'Expand'}
            </div>
          </div>
          
          {/* Status badges - stacked on mobile */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStatus('AVAILABLE');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedStatus('AVAILABLE');
                  }
                }}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg ${
                  selectedStatus === 'AVAILABLE' 
                    ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-300 dark:ring-green-500 scale-105' 
                    : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 hover:shadow-md'
                }`}
                title={selectedStatus !== 'all' ? `${totalAvailableCount} total available lines (${filteredAvailableCount} shown in current filter). Click to filter by available only.` : `${totalAvailableCount} available lines. Click to filter by available only.`}
              >
                {totalAvailableCount} {translations.scheduleMetrics?.available || 'available'}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStatus('TAKEN');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedStatus('TAKEN');
                  }
                }}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg ${
                  selectedStatus === 'TAKEN' 
                    ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-300 dark:ring-red-500 scale-105' 
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 hover:shadow-md'
                }`}
                title={selectedStatus !== 'all' ? `${totalTakenCount} total assigned lines (${filteredTakenCount} shown in current filter). Click to filter by assigned only.` : `${totalTakenCount} assigned lines. Click to filter by assigned only.`}
              >
                {totalTakenCount} {translations.scheduleMetrics?.assigned || 'assigned'}
              </div>
              {totalBlackedOutCount > 0 && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatus('BLACKED_OUT');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedStatus('BLACKED_OUT');
                    }
                  }}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg ${
                    selectedStatus === 'BLACKED_OUT' 
                      ? 'bg-gray-600 text-white shadow-lg ring-2 ring-gray-300 dark:ring-gray-500 scale-105' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md'
                  }`}
                  title={selectedStatus !== 'all' ? `${totalBlackedOutCount} total blacked out lines (${filteredBlackedOutCount} shown in current filter). Click to filter by blacked out only.` : `${totalBlackedOutCount} blacked out lines. Click to filter by blacked out only.`}
                >
                  {totalBlackedOutCount} {translations.scheduleMetrics?.blackedOut || 'blacked out'}
                </div>
              )}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStatus('all');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedStatus('all');
                  }
                }}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg ${
                  selectedStatus === 'all' 
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 dark:ring-blue-500 scale-105' 
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 hover:shadow-md'
                }`}
                title={selectedStatus !== 'all' ? `${totalCount} total lines (${filteredTotalCount} shown in current filter). Click to show all lines.` : `${totalCount} total lines. Already showing all.`}
              >
                {totalCount} {translations.bidLine?.total || 'total'}
              </div>
          </div>
          
          {/* Desktop: expand/collapse text */}
          <div className="hidden sm:block text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isExpanded ? 'Click to collapse' : 'Click to expand'}
            </div>
          </div>
        </div>
      </button>

      {/* Operation Search Section (shown when expanded) */}
      {isExpanded && (
        <div className="px-2 sm:px-6 pb-6 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Operation Search */}
          <div 
            className="mb-6 bg-blue-50/50 dark:bg-gray-700/30 rounded-xl p-4 border border-blue-100 dark:border-gray-600 hover:bg-blue-50/70 dark:hover:bg-gray-700/40 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300">{t('bidLine.searchLines')}</h3>
              {operationSearchTerm && (
                <button
                  onClick={() => setOperationSearchTerm('')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded bg-white dark:bg-gray-600 transition-all duration-300 hover:shadow-md hover:scale-105 transform"
                >
                  <X className="h-3 w-3" />
                  {t('common.clear')}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={operationSearchTerm}
                onChange={(e) => setOperationSearchTerm(e.target.value)}
                placeholder={t('bidLine.searchPlaceholder')}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            {operationSearchTerm ? (
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {translations.bidLine?.found || 'Found'} <span className="font-medium text-blue-600 dark:text-blue-400">{filteredLines.length}</span> {translations.bidLine?.of || 'of'} {operationBidLines.length} {translations.bidLine?.lines || 'lines'}
                </span>
                {filteredLines.length === 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">{translations.bidLine?.noMatches || 'No matches'}</span>
                )}
              </div>
            ) : (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                {translations.bidLine?.searchPlaceholder || 'Search by line number, location, or assigned officer'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}