// src/components/mobile/steps/mirrored-lines/MobileResultDetail.tsx
import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useMirroredLines } from '@/contexts/MirroredLinesContext';
import formatScheduleDate from "@/utils/formatScheduleDate";

interface MobileResultDetailProps {
  onBack?: () => void;
  isCompactView?: boolean;
}

export default function MobileResultDetail({
  onBack,
  isCompactView = false
}: MobileResultDetailProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const {
    userLine,
    selectedMirror,
    loading,
    error
  } = useMirroredLines();
  
  // Local state for active tab
  const [activeTab, setActiveTab] = useState<'all' | 'different' | 'workoff' | 'same'>('all');
  
  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  // Filter comparisons based on active tab
  const filteredComparisons = selectedMirror ? selectedMirror.shiftComparison.filter(comparison => {
    if (activeTab === 'all') return true;
    if (activeTab === 'different') return comparison.isDifferent && !comparison.isWorkDayMismatch;
    if (activeTab === 'workoff') return comparison.isWorkDayMismatch;
    if (activeTab === 'same') return !comparison.isDifferent && !comparison.isWorkDayMismatch;
    return true;
  }) : [];
  
  // Format date string using our shared utility function
  const formatDate = (dateString: string) => {
    // Format as "MMM d" (e.g., "Apr 24") - short month for mobile
    return formatScheduleDate(dateString, 'MMM d');
  };
  
  // Determine padding and spacing based on compact view
  const headerPadding = isCompactView ? 'p-2' : 'p-3';
  const contentPadding = isCompactView ? 'pt-1 pb-2' : 'pt-2 pb-2';
  const buttonPadding = isCompactView ? 'py-2' : 'py-3';
  
  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-t-blue-500 border-r-blue-500 border-b-blue-200 border-l-blue-200 rounded-full animate-spin mb-4"></div>
        <p className={`text-center ${styles.textPrimary}`}>Loading comparison details...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Reload
        </button>
      </div>
    );
  }
  
  // No mirror selected state
  if (!selectedMirror) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-4 rounded-lg max-w-md text-center`}>
          <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className={`text-lg font-medium ${styles.textPrimary} mb-2`}>No Line Selected</h3>
          <p className={`text-sm ${styles.textSecondary} mb-4`}>Please select a mirror line to view the detailed comparison.</p>
          <button
            onClick={onBack}
            className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded-lg`}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mobile-full-height flex flex-col safe-area-inset-bottom">
      {/* Content container with full page background like shiftbid calculator */}
      <div className={`flex flex-col h-full px-2 ${contentPadding} relative z-10`}>
        {/* Top section */}
        <div className="flex-none">
          {/* Header with comparison info - similar to shift calculator */}
          <div className={`${styles.cardBg} border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-t-lg mb-3`}>
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center">
                <h1 className={`text-lg font-bold ${styles.textPrimary} mr-1`}>Mirror Comparison</h1>
                <span className={`${styles.textSecondary} text-xs ml-2`}>Line {userLine?.LINE} vs. Line {selectedMirror.line.LINE}</span>
              </div>
            </div>
          </div>
          
          {/* Score circle and lines comparison in card header */}
          <div className={`${styles.cardBg} rounded-lg overflow-hidden mb-3 ${
            theme === 'dark' ? 'shadow-md' : 'shadow-md border border-gray-200'
          }`}>
            <div className={`px-3 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} flex justify-between items-center`}>
              <div className="flex items-center">
                <div className="mr-3">
                  <h3 className={`text-base font-bold ${styles.textPrimary} mb-0.5`}>
                    Match Details
                  </h3>
                  <p className={`text-xs ${styles.textMuted}`}>
                    {userLine?.GROUP} ⟷ {selectedMirror.line.GROUP}
                  </p>
                </div>
              </div>
              
              {/* Score circle like in shiftbid calculator */}
              <div className={`w-11 h-11 flex items-center justify-center rounded-full text-sm font-bold shadow-sm 
                ${Math.round(selectedMirror.userShiftPatternScore || 0) >= 85 ? 'bg-emerald-500 text-white' : 
                  Math.round(selectedMirror.userShiftPatternScore || 0) >= 70 ? 'bg-green-500 text-white' : 
                  Math.round(selectedMirror.userShiftPatternScore || 0) >= 60 ? 'bg-blue-500 text-white' : 
                  Math.round(selectedMirror.userShiftPatternScore || 0) >= 50 ? 'bg-yellow-500 text-black' : 
                  Math.round(selectedMirror.userShiftPatternScore || 0) >= 40 ? 'bg-orange-500 text-white' : 
                  'bg-red-500 text-white'}`}
              >
                {Math.round(selectedMirror.userShiftPatternScore || 0)}
              </div>
            </div>
            
            {/* Lines comparison on same card */}
            <div className="p-3 grid grid-cols-2 gap-3">
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded`}>
                <div className={`text-sm font-medium ${styles.textPrimary} mb-1`}>Your Line</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className={`font-medium ${styles.textPrimary}`}>Line:</div>
                  <div className={`${styles.textSecondary}`}>{userLine?.LINE}</div>
                  <div className={`font-medium ${styles.textPrimary}`}>Group:</div>
                  <div className={`${styles.textSecondary}`}>{userLine?.GROUP}</div>
                </div>
              </div>
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-2 rounded`}>
                <div className={`text-sm font-medium ${styles.textPrimary} mb-1`}>Mirror Line</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className={`font-medium ${styles.textPrimary}`}>Line:</div>
                  <div className={`${styles.textSecondary}`}>{selectedMirror.line.LINE}</div>
                  <div className={`font-medium ${styles.textPrimary}`}>Group:</div>
                  <div className={`${styles.textSecondary}`}>{selectedMirror.line.GROUP}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats cards like shiftbid calculator */}
          <div className={`mb-3 grid grid-cols-3 gap-1 p-2 text-xs ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
            {/* User Pattern Match */}
            <div className={`${theme === 'dark' 
              ? 'bg-blue-900/40 text-blue-100 border border-blue-800' 
              : 'bg-blue-100 text-blue-800 border border-blue-200'} p-1.5 rounded shadow-sm flex flex-col items-center`}
            >
              <div className="text-center">User Pattern</div>
              <div className="font-medium text-center">{formatPercent(selectedMirror.userShiftPatternScore || 0)}</div>
            </div>
            
            {/* Different Shifts */}
            <div className={`${theme === 'dark' 
              ? 'bg-amber-900/40 text-amber-100 border border-amber-800' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'} p-1.5 rounded shadow-sm flex flex-col items-center`}
            >
              <div className="text-center">Different</div>
              <div className="font-medium text-center">{selectedMirror.differentCategoryCount}</div>
            </div>
            
            {/* Significant Differences */}
            <div className={`${theme === 'dark' 
              ? 'bg-blue-900/40 text-blue-100 border border-blue-800' 
              : 'bg-blue-100 text-blue-800 border border-blue-200'} p-1.5 rounded shadow-sm flex flex-col items-center`}
            >
              <div className="text-center">Sig. Diff</div>
              <div className="font-medium text-center">{selectedMirror.significantDifferenceCount || 0}/{selectedMirror.sameCategoryCount + selectedMirror.differentCategoryCount}</div>
            </div>
          </div>
          
          {/* Tab selector */}
          <div className={`grid grid-cols-4 gap-1 mb-3 ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'} p-1 rounded-lg`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 text-xs font-medium rounded-md ${
                activeTab === 'all'
                  ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
              }`}
            >
              All Days
            </button>
            <button
              onClick={() => setActiveTab('different')}
              className={`py-2 text-xs font-medium rounded-md ${
                activeTab === 'different'
                  ? (theme === 'dark' ? 'bg-yellow-600 text-white' : 'bg-yellow-500 text-white')
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
              }`}
            >
              Different
            </button>
            <button
              onClick={() => setActiveTab('workoff')}
              className={`py-2 text-xs font-medium rounded-md ${
                activeTab === 'workoff'
                  ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
              }`}
            >
              Work/Off
            </button>
            <button
              onClick={() => setActiveTab('same')}
              className={`py-2 text-xs font-medium rounded-md ${
                activeTab === 'same'
                  ? (theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white')
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
              }`}
            >
              Identical
            </button>
          </div>
          
          {/* Comparisons list */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
            <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-2 text-xs font-medium grid grid-cols-4 ${styles.textSecondary}`}>
              <div>Date</div>
              <div className="col-span-1">Your Shift</div>
              <div className="col-span-1">Mirror Shift</div>
              <div>Difference</div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredComparisons.map((comparison) => (
                <div 
                  key={comparison.day}
                  className={`px-3 py-2 text-xs grid grid-cols-4 items-center ${
                    comparison.isDifferent
                      ? (theme === 'dark' ? 'bg-yellow-800/30' : 'bg-yellow-200')
                      : comparison.isWorkDayMismatch
                        ? (theme === 'dark' ? 'bg-blue-800/30' : 'bg-blue-200')
                        : ''
                  }`}
                >
                  <div className={`font-medium ${styles.textPrimary}`}>{formatDate(comparison.date || '') || `Day ${comparison.day}`}</div>
                  <div className="col-span-1">
                    <div className={`font-mono font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{comparison.userShift}</div>
                    {comparison.userTime && (
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>{comparison.userTime}</div>
                    )}
                  </div>
                  <div className="col-span-1">
                    <div className={`font-mono font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>{comparison.otherShift}</div>
                    {comparison.otherTime && (
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>{comparison.otherTime}</div>
                    )}
                  </div>
                  <div>
                    {comparison.isWorkDayMismatch ? (
                      <div className="text-xs font-bold px-2 py-1 rounded-md bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-100 shadow-sm text-center">
                        Work/Off
                      </div>
                    ) : comparison.isDifferent ? (
                      <div className="text-xs font-bold px-2 py-1 rounded-md bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-100 shadow-sm text-center">
                        Different
                      </div>
                    ) : (
                      <div className="text-xs font-bold px-2 py-1 rounded-md bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-100 shadow-sm text-center">
                        Identical
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredComparisons.length === 0 && (
                <div className="p-4 text-center text-sm">
                  <p className={styles.textSecondary}>No matching days found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom navigation - like shiftbid calculator */}
        <div className={`flex-none mt-4 p-2 ${styles.pageBg}`}>
          <button 
            onClick={onBack}
            className={`w-full ${theme === 'dark' 
              ? 'bg-blue-900/60 text-blue-50' 
              : 'bg-blue-500 text-white'} py-2 rounded-lg text-sm shadow-lg`}
            type="button"
          >
            Back to Results
          </button>
        </div>
      </div>
    </div>
  );
}