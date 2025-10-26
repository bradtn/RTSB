import React from 'react';
import { ChevronRight, Star, Search, X } from 'lucide-react';
import BidLineCard from '@/components/BidLine/BidLineCard';
import { naturalSort } from '@/utils/sorting';

interface FavoritesSectionProps {
  favoriteBidLines: any[];
  isFavoritesExpanded: boolean;
  setIsFavoritesExpanded: (expanded: boolean) => void;
  favoritesSearchTerm: string;
  setFavoritesSearchTerm: (term: string) => void;
  userHasDayOffRequests: boolean | null;
  metricSettings: any;
  translations: any;
  handleFavoriteToggle: (bidLineId: string, favoriteId?: string, isFavorited?: boolean) => Promise<void>;
  handleClaim: ((bidLineId: string) => Promise<void>) | undefined;
  canClaimLines: boolean;
  isAdmin: boolean;
  handleManage: ((params: { bidLineId: string; action: string; data?: any }) => Promise<void>) | undefined;
  t: (key: string) => string;
}

export default function FavoritesSection({
  favoriteBidLines,
  isFavoritesExpanded,
  setIsFavoritesExpanded,
  favoritesSearchTerm,
  setFavoritesSearchTerm,
  userHasDayOffRequests,
  metricSettings,
  translations,
  handleFavoriteToggle,
  handleClaim,
  canClaimLines,
  isAdmin,
  handleManage,
  t,
}: FavoritesSectionProps) {
  
  const filterFavoriteLines = (favoriteLines: any[]) => {
    const searchTerm = favoritesSearchTerm.toLowerCase();
    if (!searchTerm) return favoriteLines;

    return favoriteLines.filter((line: any) => 
      line.lineNumber.toLowerCase().includes(searchTerm) ||
      line.location?.toLowerCase().includes(searchTerm) ||
      line.description?.toLowerCase().includes(searchTerm) ||
      line.takenBy?.toLowerCase().includes(searchTerm) ||
      line.operation?.name?.toLowerCase().includes(searchTerm)
    );
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-amber-900/20 rounded-xl shadow-lg ring-1 ring-yellow-200/50 dark:ring-yellow-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:ring-yellow-300/50 dark:hover:ring-yellow-600/50">
      {/* Favorites Header */}
      <button
        onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
        className={`w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 transition-all duration-300 hover:shadow-md group ${isFavoritesExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}
      >
        <div className="flex items-center gap-3">
          <ChevronRight 
            className={`h-5 w-5 text-yellow-600 dark:text-yellow-400 transition-all duration-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-300 ${
              isFavoritesExpanded ? 'rotate-90' : 'rotate-0'
            }`} 
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('bidLine.myFavorites')}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              {(() => {
                const availableCount = favoriteBidLines?.filter((line: any) => line.status === 'AVAILABLE').length || 0;
                const takenCount = favoriteBidLines?.filter((line: any) => line.status === 'TAKEN').length || 0;
                const blackedOutCount = favoriteBidLines?.filter((line: any) => line.status === 'BLACKED_OUT').length || 0;
                const totalCount = favoriteBidLines?.length || 0;
                
                return (
                  <>
                    {availableCount > 0 && (
                      <div className="px-3 py-1.5 rounded-lg font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 transition-all duration-300">
                        {availableCount} {translations.scheduleMetrics?.available || 'available'}
                      </div>
                    )}
                    {takenCount > 0 && (
                      <div className="px-3 py-1.5 rounded-lg font-semibold bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 transition-all duration-300">
                        {takenCount} {translations.scheduleMetrics?.assigned || 'assigned'}
                      </div>
                    )}
                    {blackedOutCount > 0 && (
                      <div className="px-3 py-1.5 rounded-lg font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 transition-all duration-300">
                        {blackedOutCount} {translations.scheduleMetrics?.blackedOut || 'blacked out'}
                      </div>
                    )}
                    <div className="px-3 py-1.5 rounded-lg font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 transition-all duration-300">
                      {totalCount} {translations.bidLine?.total || 'total'}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isFavoritesExpanded ? t('bidLine.clickToCollapse') : t('bidLine.clickToExpand')}
          </span>
        </div>
      </button>

      {/* Favorites Content */}
      {isFavoritesExpanded && (
        <div className="px-2 sm:px-6 pb-6 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Favorites Search */}
          <div className="mb-6 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800 hover:bg-yellow-50/70 dark:hover:bg-yellow-900/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300">{t('bidLine.searchFavorites')}</h3>
              {favoritesSearchTerm && (
                <button
                  onClick={() => setFavoritesSearchTerm('')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded bg-white dark:bg-gray-600 transition-all duration-300 hover:shadow-md hover:scale-105 transform"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={favoritesSearchTerm}
                onChange={(e) => setFavoritesSearchTerm(e.target.value)}
                placeholder={t('bidLine.searchFavoritesPlaceholder')}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 transition-all duration-200"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            {favoritesSearchTerm ? (
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {translations.bidLine?.found || 'Found'} <span className="font-medium text-yellow-600 dark:text-yellow-400">{filterFavoriteLines(favoriteBidLines).length}</span> {translations.bidLine?.of || 'of'} {favoriteBidLines.length} {translations.bidLine?.lines || 'lines'}
                </span>
                {filterFavoriteLines(favoriteBidLines).length === 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">{translations.bidLine?.noMatches || 'No matches'}</span>
                )}
              </div>
            ) : (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                {translations.bidLine?.searchPlaceholder || 'Search by line number, location, operation, or assigned officer'}
              </div>
            )}
          </div>
          {favoriteBidLines && favoriteBidLines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 auto-rows-fr">
              {filterFavoriteLines(favoriteBidLines)
                .sort((a: any, b: any) => {
                  // First sort by status (AVAILABLE first)
                  if (a.status !== b.status) {
                    if (a.status === 'AVAILABLE') return -1;
                    if (b.status === 'AVAILABLE') return 1;
                    return a.status.localeCompare(b.status);
                  }
                  // Then natural sort by line number
                  return naturalSort(a.lineNumber, b.lineNumber);
                })
                .map((bidLine: any, index: number) => (
                <div key={bidLine.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
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
                      // Schedule metrics translations
                      scheduleMetricsTitle: translations.scheduleMetrics?.title,
                      weekendsWorking: translations.scheduleMetrics?.weekendsWorking,
                      saturdays: translations.scheduleMetrics?.saturdays,
                      sundays: translations.scheduleMetrics?.sundays,
                      fiveDayBlocks: translations.scheduleMetrics?.fiveDayBlocks,
                      fourDayBlocks: translations.scheduleMetrics?.fourDayBlocks,
                      holidays: translations.scheduleMetrics?.holidays,
                      // Modal-specific translations
                      whatThisMeans: translations.scheduleMetrics?.whatThisMeans,
                      whyItMatters: translations.scheduleMetrics?.whyItMatters,
                      completeScheduleSummary: translations.scheduleMetrics?.completeScheduleSummary,
                      close: translations.scheduleMetrics?.close,
                      // Descriptions
                      weekendsDescription: translations.scheduleMetrics?.weekendsDescription,
                      saturdaysDescription: translations.scheduleMetrics?.saturdaysDescription,
                      sundaysDescription: translations.scheduleMetrics?.sundaysDescription,
                      fiveDayBlocksDescription: translations.scheduleMetrics?.fiveDayBlocksDescription,
                      fourDayBlocksDescription: translations.scheduleMetrics?.fourDayBlocksDescription,
                      holidaysDescription: translations.scheduleMetrics?.holidaysDescription,
                      // Explanations
                      weekendsExplanation: translations.scheduleMetrics?.weekendsExplanation,
                      saturdaysExplanation: translations.scheduleMetrics?.saturdaysExplanation,
                      sundaysExplanation: translations.scheduleMetrics?.sundaysExplanation,
                      fiveDayBlocksExplanation: translations.scheduleMetrics?.fiveDayBlocksExplanation,
                      fourDayBlocksExplanation: translations.scheduleMetrics?.fourDayBlocksExplanation,
                      holidaysExplanation: translations.scheduleMetrics?.holidaysExplanation,
                      // Day-off match modal translations
                      dayOffMatch: translations.dayOffMatch,
                    }}
                    onFavoriteToggle={(bidLineId) => handleFavoriteToggle(bidLineId, bidLine.favoriteId, bidLine.isFavorited)}
                    onClaim={canClaimLines ? handleClaim : undefined}
                    canClaim={canClaimLines}
                    isAdmin={isAdmin}
                    onManage={isAdmin ? (id: string, action: 'assign' | 'release' | 'blackout', data?: any) => {
                      handleManage?.({ bidLineId: id, action, data });
                    } : undefined}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No favorites yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">Click the ⭐ star on any bid line to add it to your favorites</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}