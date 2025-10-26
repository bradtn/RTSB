// src/components/mobile/steps/mirrored-lines/MobileResultsList.tsx
import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useMirroredLines } from '@/contexts/MirroredLinesContext';

interface MobileResultsListProps {
  onViewDetail: () => void;
  onBack?: () => void;
  isCompactView?: boolean;
}

export default function MobileResultsList({
  onViewDetail,
  onBack,
  isCompactView = false
}: MobileResultsListProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const {
    lineNumber,
    selectedOperation,
    userLine,
    mirrorResults,
    selectedMirror,
    setSelectedMirror,
    loading,
    error,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    fetchMirrorLines
  } = useMirroredLines();
  
  // Add state hook here at the top level
  const [showHelp, setShowHelp] = React.useState(false);
  
  // Override the default sort field to prioritize meaningful differences
  useEffect(() => {
    // Changed default sort from userShiftPatternScore to significantDifferenceCount
    // This will show lines with more significant time differences at the top
    setSortField("significantDifferenceCount");
    setSortDirection("desc");
  }, [setSortField, setSortDirection]);
  
  // Fetch mirror lines data once when component mounts, but only if we don't already have results
  // Using useEffect with dependencies on whether we have results already
  useEffect(() => {
    // Skip fetching if we already have mirror results
    if (mirrorResults.length > 0) {
      console.log("Already have mirror results, skipping fetch");
      return;
    }
    
    // Track if the component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    // Store the executed state to prevent repeated calls
    let hasExecuted = false;
    
    const fetchData = async () => {
      // Prevent execution more than once
      if (hasExecuted || !isMounted) return;
      hasExecuted = true;
      
      // Only proceed if we have a line number and operation
      if (!lineNumber || !selectedOperation) {
        return;
      }
      
      try {
        console.log("Fetching schedules data for mirrored lines, lineNumber:", lineNumber);
        const response = await fetch('/api/schedules');
        const data = await response.json();
        
        // Only continue if still mounted
        if (!isMounted) return;
        
        if (Array.isArray(data)) {
          const matchingLine = data.find((line: any) => 
            line.LINE === lineNumber && line.GROUP === selectedOperation
          );
          
          if (matchingLine && isMounted) {
            console.log("Found matching line, ID:", matchingLine.id);
            fetchMirrorLines(matchingLine.id);
          } else if (isMounted) {
            console.error(`Line ${lineNumber} not found in ${selectedOperation}`);
          }
        }
      } catch (err) {
        console.error('Error fetching line ID:', err);
      }
    };
    
    // Run fetch only if not already loading
    if (!loading) {
      fetchData();
    }
    
    // Cleanup function to prevent updates after unmount
    return () => {
      isMounted = false;
    };
    
    // Include mirrorResults.length as a dependency to skip fetching if we already have results
  }, [mirrorResults.length, lineNumber, selectedOperation, loading, fetchMirrorLines]);
  
  // Handle sort column click
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default direction
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Sort mirror results
  const sortedResults = [...mirrorResults].sort((a, b) => {
    let valueA: number, valueB: number;
    
    switch (sortField) {
      case "userShiftPatternScore":
        valueA = a.userShiftPatternScore || 0;
        valueB = b.userShiftPatternScore || 0;
        break;
      case "patternScore":
        valueA = a.patternScore;
        valueB = b.patternScore;
        break;
      case "shiftDiffScore":
        valueA = a.shiftDiffScore;
        valueB = b.shiftDiffScore;
        break;
      case "differentCategoryCount":
        valueA = a.differentCategoryCount;
        valueB = b.differentCategoryCount;
        break;
      case "significantDifferenceCount":
        valueA = a.significantDifferenceCount || 0;
        valueB = b.significantDifferenceCount || 0;
        break;
      default:
        // Default to user shift pattern score if no valid sort field is specified
        valueA = a.userShiftPatternScore || 0;
        valueB = b.userShiftPatternScore || 0;
        break;
    }
    
    return sortDirection === "asc" 
      ? valueA - valueB 
      : valueB - valueA;
  });
  
  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  // Handle selection and view detail
  const handleSelectResult = (result: any) => {
    setSelectedMirror(result);
    onViewDetail();
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
        <p className={`text-center ${styles.textPrimary}`}>Finding mirror matches for your line...</p>
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
  
  // No results state
  if (sortedResults.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-4 rounded-lg max-w-md text-center`}>
          <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className={`text-lg font-medium ${styles.textPrimary} mb-2`}>No Mirror Matches Found</h3>
          <p className={`text-sm ${styles.textSecondary} mb-4`}>We couldn't find any good mirror matches for your line. Try selecting different operations or a different line.</p>
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
      <div className={`flex flex-col h-full ${contentPadding} relative z-10`}>
        {/* Top section with results header and sort tabs */}
        <div className="flex-none">
          {/* Results count and filter bar - similar to shift calculator */}
          <div className={`${styles.cardBg} border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} rounded-t-lg mb-2`}>
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center">
                <h1 className={`text-xl font-bold ${styles.textPrimary} mr-1`}>{sortedResults.length}</h1>
                <span className={`${styles.textSecondary} text-xs`}>Mirror Matches</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} p-1`}
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={onBack}
                  className={`${theme === 'dark' ? 'bg-blue-900/60 text-blue-50' : 'bg-blue-100 text-blue-800'} 
                           py-1 px-2.5 text-xs rounded-md flex items-center`}
                  type="button"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              </div>
            </div>
          </div>
          
          {/* Collapsible explanation box */}
          {showHelp && (
            <div className={`${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'} p-2 rounded-lg mb-2 text-xs`}>
              <p className={`${theme === 'dark' ? 'text-blue-100' : 'text-blue-800'} mb-1`}>
                <strong>User Pattern:</strong> % of your work days that match
              </p>
              <p className={`${theme === 'dark' ? 'text-blue-100' : 'text-blue-800'}`}>
                <strong>Sig. Diff:</strong> Shifts with 45+ min start or 60+ min end time difference
              </p>
            </div>
          )}
          
          {/* Sort tabs - like shift calculator */}
          <div className="flex text-xs border rounded-lg mb-2 overflow-hidden divide-x divide-gray-300 dark:divide-gray-700">
            <button
              onClick={() => handleSort("userShiftPatternScore")}
              className={`flex-1 py-1.5 px-1 text-center transition-colors ${
                sortField === "userShiftPatternScore" 
                  ? (theme === 'dark' ? 'bg-blue-900/60 text-blue-50' : 'bg-blue-100 text-blue-800')
                  : (theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700')
              }`}
              type="button"
            >
              Pattern {sortField === "userShiftPatternScore" && (sortDirection === "desc" ? "↓" : "↑")}
            </button>
            <button
              onClick={() => handleSort("differentCategoryCount")}
              className={`flex-1 py-1.5 px-1 text-center transition-colors ${
                sortField === "differentCategoryCount" 
                  ? (theme === 'dark' ? 'bg-blue-900/60 text-blue-50' : 'bg-blue-100 text-blue-800')
                  : (theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700')
              }`}
              type="button"
            >
              Different {sortField === "differentCategoryCount" && (sortDirection === "desc" ? "↓" : "↑")}
            </button>
            <button
              onClick={() => handleSort("significantDifferenceCount")}
              className={`flex-1 py-1.5 px-1 text-center transition-colors ${
                sortField === "significantDifferenceCount" 
                  ? (theme === 'dark' ? 'bg-blue-900/60 text-blue-50' : 'bg-blue-100 text-blue-800')
                  : (theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700')
              }`}
              type="button"
            >
              Sig. Diff {sortField === "significantDifferenceCount" && (sortDirection === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>
        
        {/* Results list with cards like shiftbid calculator */}
        <div className="flex-grow overflow-y-auto pb-4">
          <div className="space-y-2">
            {sortedResults.map((result) => (
              <div
                key={result.line.id}
                className={`${styles.cardBg} rounded-lg overflow-hidden ${
                  theme === 'dark' ? 'shadow-md' : 'shadow-md border border-gray-200'
                }`}
              >
                {/* Card header with line info and score */}
                <div className={`px-3 py-1.5 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} flex justify-between items-center`}>
                  <div>
                    <h3 className={`text-base font-bold ${styles.textPrimary}`}>
                      Line {result.line.LINE}
                    </h3>
                    <p className={`text-xs ${styles.textMuted}`}>
                      {result.line.GROUP}
                    </p>
                  </div>
                  
                  {/* Score circle like in shiftbid calculator */}
                  <div className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold shadow-sm 
                    ${Math.round(result.userShiftPatternScore || 0) >= 85 ? 'bg-emerald-500 text-white' : 
                      Math.round(result.userShiftPatternScore || 0) >= 70 ? 'bg-green-500 text-white' : 
                      Math.round(result.userShiftPatternScore || 0) >= 60 ? 'bg-blue-500 text-white' : 
                      Math.round(result.userShiftPatternScore || 0) >= 50 ? 'bg-yellow-500 text-black' : 
                      Math.round(result.userShiftPatternScore || 0) >= 40 ? 'bg-orange-500 text-white' : 
                      'bg-red-500 text-white'}`}
                  >
                    {Math.round(result.userShiftPatternScore || 0)}
                  </div>
                </div>
                
                {/* Stats grid like shiftbid calculator */}
                <div className="grid grid-cols-3 gap-1 p-1.5 text-xs">
                  {/* User Pattern Match */}
                  <div className="p-1 flex flex-col items-center">
                    <div className="text-center text-xs font-semibold text-blue-900 dark:text-blue-200">Pattern</div>
                    {(() => {
                      // Calculate the actual on-days count
                      const percent = result.userShiftPatternScore || 0;
                      const totalOnDays = result.shiftComparison ? 
                        result.shiftComparison.filter(day => day.userShift !== '----').length : 
                        (result.sameCategoryCount + result.differentCategoryCount);
                      
                      return (
                        <div className="flex flex-col items-center">
                          <div className="font-bold text-blue-800 dark:text-blue-300 text-sm">
                            {formatPercent(percent)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {Math.round(percent * totalOnDays / 100)}/{totalOnDays}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Different Shifts */}
                  <div className="p-1 flex flex-col items-center">
                    <div className="text-center text-xs font-semibold text-amber-900 dark:text-amber-200">Different</div>
                    <div className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                      {result.differentCategoryCount}
                    </div>
                  </div>
                  
                  {/* Significant Differences */}
                  <div className="p-1 flex flex-col items-center">
                    <div className="text-center text-xs font-semibold text-purple-900 dark:text-purple-200">Sig. Diff</div>
                    <div className="font-bold text-purple-800 dark:text-purple-300 text-sm">
                      {result.significantDifferenceCount || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      of {result.sameCategoryCount + result.differentCategoryCount}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons like shiftbid calculator */}
                <div className="grid grid-cols-1 border-t border-gray-700">
                  <button
                    onClick={() => handleSelectResult(result)}
                    className={`py-2 text-center ${theme === 'dark' ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-600 hover:bg-gray-100'} text-xs transition flex items-center justify-center`}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
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
            Back to Filters
          </button>
        </div>
      </div>
    </div>
  );
}