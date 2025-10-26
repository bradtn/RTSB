import React from 'react';
import { Star, Settings, UserCheck, UserX, Ban } from 'lucide-react';

interface StatusActionsProps {
  bidLine: {
    id: string;
    status: 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT';
    isFavorited?: boolean;
    favoriteRank?: number;
  };
  translations: {
    bidLineClaim: string;
  };
  isLoading: boolean;
  canClaim: boolean;
  isAdmin: boolean;
  showAdminMenu: boolean;
  onFavoriteClick: () => void;
  onClaimClick: () => void;
  onToggleAdminMenu: () => void;
  onAdminAction: (action: 'assign' | 'release' | 'blackout', data?: any) => void;
  onShowAssignModal: () => void;
  t: (key: string, params?: any) => string;
}

export default function StatusActions({
  bidLine,
  translations,
  isLoading,
  canClaim,
  isAdmin,
  showAdminMenu,
  onFavoriteClick,
  onClaimClick,
  onToggleAdminMenu,
  onAdminAction,
  onShowAssignModal,
  t,
}: StatusActionsProps) {
  return (
    <>
      {/* Action Buttons Row */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={onFavoriteClick}
          disabled={isLoading}
          className={`flex-1 p-2 rounded transition-all duration-300 relative ${
            bidLine.isFavorited
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-black/20 hover:bg-black/30'
          } disabled:opacity-50`}
          title={bidLine.isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
        >
          <Star className={`h-4 w-4 mx-auto ${bidLine.isFavorited ? 'fill-current' : ''}`} />
          {/* Favorite rank badge disabled - was causing race conditions
          {bidLine.isFavorited && bidLine.favoriteRank && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
              {bidLine.favoriteRank}
            </span>
          )}
          */}
        </button>

        {canClaim && bidLine.status === 'AVAILABLE' && (
          <button
            onClick={onClaimClick}
            disabled={isLoading}
            className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform disabled:opacity-50 disabled:hover:scale-100 text-sm font-medium"
          >
            {translations.bidLineClaim}
          </button>
        )}

        {/* Admin Management Buttons */}
        {isAdmin && (
          <button
            onClick={onToggleAdminMenu}
            disabled={isLoading}
            className="flex-1 p-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-all duration-300 disabled:opacity-50"
            title="Manage Line"
          >
            <Settings className="h-4 w-4 mx-auto" />
          </button>
        )}
      </div>
      
      {/* Admin Dropdown Menu */}
      {isAdmin && (
        <div className="relative">
          {showAdminMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[160px]">
                {bidLine.status === 'AVAILABLE' && (
                  <button
                    onClick={onShowAssignModal}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    {t('bidLine.assignToOfficer')}
                  </button>
                )}

                {bidLine.status === 'TAKEN' && (
                  <button
                    onClick={() => onAdminAction('release')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    {t('bidLine.releaseLine')}
                  </button>
                )}

                {bidLine.status !== 'BLACKED_OUT' && (
                  <button
                    onClick={() => onAdminAction('blackout')}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Ban className="h-4 w-4" />
                    {t('bidLine.blackOut')}
                  </button>
                )}

                {bidLine.status === 'BLACKED_OUT' && (
                  <button
                    onClick={() => onAdminAction('release')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Make Available
                  </button>
                )}
            </div>
          )}
        </div>
      )}
    </>
  );
}