// src/components/wizard/DesktopResults.jsx
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useFilter } from "@/contexts/FilterContext";
import { useWizardState } from "@/contexts/WizardStateContext";
import { motion, AnimatePresence } from "framer-motion";

export default function DesktopResults() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { state } = useWizardState();
  
  // Get data from FilterContext, including hash navigation functions
  const { 
    filteredSchedules: schedules, 
    backToFilters: onFilterAgain, 
    resetFilters: onResetFilters, 
    parsedCriteria: appliedCriteria,
    reapplyFilters: onReapplyFilters,
    filtersAppliedRef,
    resultsSortState,
    onResultsStateChange,
    navigateToSection,
    navigateToSubsection,
    shiftCodes, // Get the shiftCodes directly from context
    // Recovery methods
    backupCriteria,
    restoreFromBackup,
    checkAndRestoreCriteria,
    getFilterCount,
    wasReset
  } = useFilter();
  
  // Use values from context with fallbacks
  const sortBy = resultsSortState?.sortBy || "matchScore";
  const sortDirection = resultsSortState?.sortDirection || "desc";
  
  const [expandedSchedules, setExpandedSchedules] = useState([]);
  const [totalHolidays, setTotalHolidays] = useState(9); // Added for holiday count
  const [allHolidays, setAllHolidays] = useState([]); // Added for full holiday list
  
  // State for criteria recovery
  const [lastKnownGoodCriteria, setLastKnownGoodCriteria] = useState(null);
  const initialCriteriaRef = useRef(null);
  const recoveryAttemptCountRef = useRef(0);
  const lastBackupTimeRef = useRef(0);
  const restoredFromBackupRef = useRef(false);
  const autoRefreshAfterRecoveryRef = useRef(false);
  const initialRefreshCompletedRef = useRef(false);

  // Initialize criteria when first loaded
  useEffect(() => {
    if (!initialCriteriaRef.current && appliedCriteria) {
      console.log('Initial criteria received in DesktopResults');
      initialCriteriaRef.current = JSON.parse(JSON.stringify(appliedCriteria));
      
      const filterCount = getFilterCount(appliedCriteria);
      console.log(`Initial criteria has ${filterCount} filters`);
      
      // Save good criteria
      if (filterCount > 2) {
        setLastKnownGoodCriteria(appliedCriteria);
        backupCriteria(appliedCriteria);
        lastBackupTimeRef.current = Date.now();
      }
    }
  }, [appliedCriteria, backupCriteria, getFilterCount]);
  
  // Monitor for criteria resets
  useEffect(() => {
    if (!appliedCriteria) return;
    
    const filterCount = getFilterCount(appliedCriteria);
    
    // If criteria looks reset, try to restore it
    if (filterCount <= 2) {
      console.log('DesktopResults: Detected possible criteria reset, attempting to restore');
      
      // First try context-level recovery
      const restored = checkAndRestoreCriteria(true);
      
      if (restored) {
        console.log('DesktopResults: Successfully restored criteria from backup');
        recoveryAttemptCountRef.current++;
        restoredFromBackupRef.current = true;
        autoRefreshAfterRecoveryRef.current = true;
      } else if (lastKnownGoodCriteria && getFilterCount(lastKnownGoodCriteria) > 2) {
        // Fall back to locally saved criteria if context recovery failed
        console.log('DesktopResults: Context recovery failed, using local backup');
        
        // Try to apply the good criteria
        if (typeof onReapplyFilters === 'function' && recoveryAttemptCountRef.current < 3) {
          console.log('DesktopResults: Attempting to reapply with local backup criteria');
          onReapplyFilters(lastKnownGoodCriteria);
          recoveryAttemptCountRef.current++;
          restoredFromBackupRef.current = true;
          autoRefreshAfterRecoveryRef.current = true;
        }
      }
    } else {
      // Criteria looks good, save it
      setLastKnownGoodCriteria(appliedCriteria);
      
      // Only backup if enough time has passed
      const now = Date.now();
      if (now - lastBackupTimeRef.current > 60000) { // Once per minute
        backupCriteria(appliedCriteria);
        lastBackupTimeRef.current = now;
      }
    }
  }, [appliedCriteria, backupCriteria, checkAndRestoreCriteria, getFilterCount, lastKnownGoodCriteria, onReapplyFilters]);
  
  // Set up periodic monitoring
  useEffect(() => {
    console.log('DesktopResults: Setting up recovery monitoring');
    
    // Create a backup on component mount if criteria is good
    if (appliedCriteria && getFilterCount(appliedCriteria) > 2) {
      backupCriteria(appliedCriteria);
      setLastKnownGoodCriteria(appliedCriteria);
      lastBackupTimeRef.current = Date.now();
    }
    
    // Periodically check criteria integrity
    const checkInterval = setInterval(() => {
      if (appliedCriteria) {
        const filterCount = getFilterCount(appliedCriteria);
        
        if (filterCount <= 2 && recoveryAttemptCountRef.current < 5) {
          // If criteria looks reset and we haven't tried too many times, restore
          if (!restoredFromBackupRef.current) {
            console.log('Periodic monitor detected possible reset, attempting recovery');
            checkAndRestoreCriteria(true);
          }
        } else if (filterCount > 2) {
          // If criteria looks good, back it up periodically (not too often)
          const now = Date.now();
          if (now - lastBackupTimeRef.current > 300000) { // Once every 5 minutes
            console.log('Periodic backup refresh');
            backupCriteria(appliedCriteria);
            setLastKnownGoodCriteria(appliedCriteria);
            lastBackupTimeRef.current = now;
          }
        }
      }
    }, 15000); // Check every 15 seconds
    
    return () => {
      console.log('DesktopResults: Cleaning up monitor');
      clearInterval(checkInterval);
    };
  }, [appliedCriteria, backupCriteria, checkAndRestoreCriteria, getFilterCount]);

  // Effect to automatically refresh results when criteria is recovered
  useEffect(() => {
    if (autoRefreshAfterRecoveryRef.current && appliedCriteria) {
      console.log('DesktopResults: Criteria was restored, automatically refreshing results');
      
      // Add a short delay to ensure everything is ready
      const refreshTimer = setTimeout(() => {
        handleRefresh();
        autoRefreshAfterRecoveryRef.current = false;
        console.log('DesktopResults: Auto-refresh complete after criteria recovery');
      }, 500);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [appliedCriteria]);
  
  // Effect to automatically refresh empty results when needed
  useEffect(() => {
    // Check if:
    // 1. We should be showing results (we're on results page)
    // 2. We have no schedules displayed
    // 3. We have valid criteria with filters
    // 4. We haven't already done the initial refresh
    const hasCurrentSchedules = Array.isArray(schedules) && schedules.length > 0;
    
    if (
      !initialRefreshCompletedRef.current &&
      !hasCurrentSchedules && 
      appliedCriteria && 
      getFilterCount(appliedCriteria) > 0 && 
      window.location.hash.startsWith('#results')
    ) {
      console.log('DesktopResults: Empty results but should show results, auto-refreshing');
      
      // Add a short delay to ensure everything is loaded
      const refreshTimer = setTimeout(() => {
        handleRefresh();
        initialRefreshCompletedRef.current = true;
        console.log('DesktopResults: Auto-refresh completed for empty results');
      }, 800);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [
    appliedCriteria, 
    schedules, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  ]);

  // Fetch total holidays
  useEffect(() => {
    console.log('Fetching total holidays from API...');
    // Fetch the total holiday count
    fetch('/api/holidays/total')
      .then(res => {
        console.log('Holidays API response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Holidays API response data:', data);
        if (data && typeof data.total === 'number') {
          console.log('Setting total holidays to:', data.total);
          setTotalHolidays(data.total);
          // Also store the full holidays list for showing worked/off holidays
          if (data.holidays && Array.isArray(data.holidays)) {
            setAllHolidays(data.holidays);
          }
        } else {
          console.warn('Invalid holidays API response format:', data);
        }
      })
      .catch(err => console.error('Error fetching total holidays:', err));
  }, []);
  
  // Listen for hash changes to update UI state when hash is 'results'
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      // If hash starts with 'results/', it might contain subsection info
      if (hash.startsWith('results/')) {
        const subSection = hash.split('/')[1];
        // Handle subsection for results (e.g., sorting or viewing modes)
        // Currently not implemented, but could be used for result-specific views
      }
    };
    
    handleHashChange(); // Handle initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Refs to track previous values
  const prevSortBy = useRef(sortBy);
  const prevSortDirection = useRef(sortDirection);
  
  // Modified to prevent competing updates
  useEffect(() => {
    if (prevSortBy.current !== sortBy || prevSortDirection.current !== sortDirection) {
      prevSortBy.current = sortBy;
      prevSortDirection.current = sortDirection;
      
      if (typeof onResultsStateChange === 'function') {
        onResultsStateChange({
          sortBy,
          sortDirection
        });
      }
    }
  }, [sortBy, sortDirection, onResultsStateChange]);
  
  // Enhanced score colors - more vibrant
  const getScoreColor = (score) => {
    score = Number(score);
    if (score >= 85) return "bg-emerald-500 text-white"; // Excellent
    if (score >= 70) return "bg-green-500 text-white";   // Very good
    if (score >= 60) return "bg-blue-500 text-white";    // Good
    if (score >= 50) return "bg-yellow-500 text-black";  // Fair
    if (score >= 40) return "bg-orange-500 text-white";  // Poor
    return "bg-red-500 text-white";                      // Very poor
  };
  
  // Get color for stat cells - improved for both dark and light modes
  const getStatCellColors = (index) => {
    // Define colors that work well in both modes
    const colors = {
      weekends: theme === 'dark' 
        ? 'bg-blue-800/80 text-blue-100 hover:bg-blue-700/80' 
        : 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      saturdays: theme === 'dark' 
        ? 'bg-purple-800/80 text-purple-100 hover:bg-purple-700/80' 
        : 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      sundays: theme === 'dark' 
        ? 'bg-indigo-800/80 text-indigo-100 hover:bg-indigo-700/80' 
        : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      fiveDay: theme === 'dark' 
        ? 'bg-cyan-800/80 text-cyan-100 hover:bg-cyan-700/80' 
        : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200',
      fourDay: theme === 'dark' 
        ? 'bg-violet-800/80 text-violet-100 hover:bg-violet-700/80' 
        : 'bg-violet-100 text-violet-800 hover:bg-violet-200',
      // New color for holidays
      holidays: theme === 'dark' 
        ? 'bg-rose-800/80 text-rose-100 hover:bg-rose-700/80' 
        : 'bg-rose-100 text-rose-800 hover:bg-rose-200',
    };
    
    const columnIndex = index % 6; // Updated from 5 to 6 columns
    
    switch(columnIndex) {
      case 0: return colors.weekends;
      case 1: return colors.saturdays;
      case 2: return colors.sundays;
      case 3: return colors.fiveDay;
      case 4: return colors.fourDay;
      case 5: return colors.holidays; // New case for holidays
      default: return colors.weekends;
    }
  };
  
  const handleSort = (field) => {
    // Calculate new sort states
    const newSortDirection = field === sortBy
      ? sortDirection === "asc" ? "desc" : "asc"
      : field === "line" ? "asc" : "desc";
    
    // Update state through context
    if (typeof onResultsStateChange === 'function') {
      onResultsStateChange({
        sortBy: field,
        sortDirection: newSortDirection
      });
    }
    
    // Direct URL update with query parameters
    setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('sortBy', field);
        url.searchParams.set('sortDirection', newSortDirection);
        url.searchParams.set('showingResults', 'true');
        url.searchParams.set('step', '6');
        window.history.replaceState({}, '', url);
      } catch (error) {
        console.error("Error updating URL in handleSort:", error);
      }
    }, 50);
  };
  
  const toggleDetails = (scheduleId) => {
    setExpandedSchedules(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };
  
  // Function to get shift time display using the same approach as DesktopShiftSelector
  const getShiftTimeDisplay = (code) => {
    if (!code) return "??:??-??:??";
    
    // First try to find the shift code from context
    if (Array.isArray(shiftCodes) && shiftCodes.length > 0) {
      const shiftCode = shiftCodes.find(sc => 
        sc.code?.toLowerCase() === code?.toLowerCase()
      );
      
      if (shiftCode) {
        // Try to extract from display pattern or code pattern
        const codePattern = shiftCode.display || shiftCode.code || "";
        const timePattern = shiftCode.display?.match(/\((.+?)\)/) || codePattern.match(/\((.+?)\)/);
        
        // Get times from display or use fallback with startTime/endTime
        if (timePattern) {
          return timePattern[1];
        } else if (shiftCode.startTime && shiftCode.endTime) {
          return `${shiftCode.startTime}–${shiftCode.endTime}`; // Using en dash for consistency
        }
      }
    }
    
    // Fallback to common shift time patterns if no match found
    const commonTimes = {
      "06BM": "06:00-14:30",
      "20AR": "20:00-04:30",
      "10BB": "10:00-18:30",
      "14AV": "14:00-22:30",
      "14BC": "14:00-22:30",
      "22AC": "22:00-06:30",
      "06AV": "06:00-14:30",
      "22BM": "22:00-06:30",
      // Add more mappings as needed
    };
    
    return commonTimes[code] || "??:??-??:??";
  };
  
  // Helper function to parse the explanation string into bullet points
  const parseExplanation = (explanation) => {
    if (!explanation) return [];
    
    const parts = explanation.split(';').map(part => part.trim()).filter(Boolean);
    
    // Filter out shift matching explanations as we'll handle those separately
    return parts
      .filter(part => !part.includes('shifts match selected codes'))
      .map(part => {
        part = part.trim();
        
        if (part.includes('Group matches')) {
          return 'Group preference matched';
        }
        
        return part;
      });
  };
  
  // Enhanced refresh function with better recovery support
  const handleRefresh = () => {
    console.log('DesktopResults: Refreshing results with criteria (filter count: ' + 
                (appliedCriteria ? getFilterCount(appliedCriteria) : 0) + ')');
    
    // Update URL to preserve state
    setTimeout(() => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('sortBy', sortBy);
        url.searchParams.set('sortDirection', sortDirection);
        url.searchParams.set('showingResults', 'true');
        window.history.replaceState({}, '', url);
      } catch (error) {
        console.error("Error updating URL in handleRefresh:", error);
      }
    }, 50);
    
    // Make sure we stay on results page
    navigateToSection('results');
    
    // Determine the best criteria to use for refresh
    let criteriaToUse = appliedCriteria;
    
    // If we don't have any criteria or criteria with very few filters, try to get from backup
    if (!criteriaToUse || getFilterCount(criteriaToUse) <= 2) {
      console.log('DesktopResults: No good criteria for refresh, trying backup sources');
      
      // Try first from local ref
      if (lastKnownGoodCriteria && getFilterCount(lastKnownGoodCriteria) > 2) {
        criteriaToUse = lastKnownGoodCriteria;
        console.log('DesktopResults: Using lastKnownGoodCriteria for refresh');
      } else {
        // Then from storage
        const backupCriteria = restoreFromBackup();
        if (backupCriteria && getFilterCount(backupCriteria) > 2) {
          criteriaToUse = backupCriteria;
          console.log('DesktopResults: Using backup storage criteria for refresh');
        }
      }
    }
    
    // Only proceed if we have valid criteria to use
    if (criteriaToUse && getFilterCount(criteriaToUse) > 0) {
      console.log(`DesktopResults: Applying refresh with criteria (filter count: ${getFilterCount(criteriaToUse)})`);
      onReapplyFilters(criteriaToUse);
    } else {
      console.log('DesktopResults: Could not find valid criteria for refresh');
    }
  };
  
  // Check if the schedules array is valid
  const hasSchedules = Array.isArray(schedules) && schedules.length > 0;
  
  // Check if results are verified
  const isVerified = filtersAppliedRef?.current === true;
  
  // Sort schedules if available
  const sortedSchedules = Array.isArray(schedules) ? [...schedules].sort((a, b) => {
    // For scores
    if (sortBy === "matchScore") {
      const aScore = Number(a.matchScore);
      const bScore = Number(b.matchScore);
      return sortDirection === "desc" ? bScore - aScore : aScore - bScore;
    }
    
    // For line numbers
    if (sortBy === "line") {
      const aLine = String(a.line).replace(/\D/g, '');
      const bLine = String(b.line).replace(/\D/g, '');
      const numA = parseInt(aLine) || 0;
      const numB = parseInt(bLine) || 0;
      return sortDirection === "asc" ? numA - numB : numB - numA;
    }
    
    // For groups
    if (sortBy === "group") {
      const aGroup = String(a.group);
      const bGroup = String(b.group);
      const compare = aGroup.localeCompare(bGroup);
      return sortDirection === "asc" ? compare : -compare;
    }
    
    return 0;
  }) : [];

  // Get visual indicator for sorting
  const getSortIndicator = (columnName) => {
    if (sortBy !== columnName) return null;
    
    return (
      <span className="ml-1 inline-block">
        {sortDirection === "desc" ? "↓" : "↑"}
      </span>
    );
  };
  
  // Create simple link with schedule ID
  const createSimpleLink = (baseUrl, scheduleId) => {
    try {
      return `${baseUrl}?scheduleId=${scheduleId}&returnPath=${encodeURIComponent(pathname + (searchParams.toString() ? '?' + searchParams.toString() : ''))}`;
    } catch (error) {
      console.error("Error creating link:", error);
      return `${baseUrl}?scheduleId=${scheduleId}`;
    }
  };
  
  return (
    <div className={`h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex-1 h-full overflow-auto pt-[48px]">
        {/* Recovery notification */}
        {restoredFromBackupRef.current && (
          <div className={`${theme === 'dark' ? 'bg-amber-900/30 text-amber-200 border-amber-600' : 'bg-amber-50 text-amber-800 border-amber-400'} border-l-4 p-4 rounded-md mb-2 mx-4`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5V7z" clipRule="evenodd" />
              </svg>
              <span>
                Criteria was recovered from backup
              </span>
            </div>
          </div>
        )}
        
        {/* Verification warning - only shown when not verified */}
        {!isVerified && (
          <div className={`${theme === 'dark' ? 'bg-yellow-900/30 border-yellow-600' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 rounded-md mb-6 mx-4`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between items-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  Results may not reflect your current filters
                </p>
                <button 
                  onClick={handleRefresh}
                  className={`${theme === 'dark' 
                    ? 'bg-yellow-600 hover:bg-yellow-500' 
                    : 'bg-yellow-500 hover:bg-yellow-600'} text-white px-4 py-2 rounded-md text-sm ml-4 transition-colors`}
                  type="button"
                >
                  Refresh Results
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Results table content */}
        <div className="pb-6 px-4">
          {!hasSchedules ? (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 text-center`}>
              <svg className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707L16 11.586V19a1 1 0 01-.293.707l-2 2A1 1 0 0112 21v-9.414l-4.707-4.707A1 1 0 017 6.586V4z" />
              </svg>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-6 text-lg`}>
                No schedules match your criteria. Try adjusting your filters.
              </p>
              <button
                onClick={onFilterAgain}
                className={`${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white px-5 py-2 rounded-md text-sm font-medium transition-colors`}
                type="button"
              >
                Adjust Filters
              </button>
            </div>
          ) : (
            <div className={`${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} rounded-lg shadow-md overflow-hidden`}>
              <table className="w-full">
                <colgroup>
                  <col className="w-auto" /> {/* Line # - auto width */}
                  <col className="w-auto" /> {/* Group - auto width */}
                  <col className="w-auto" /> {/* Score - auto width */}
                  <col /> {/* Weekends - flexible */}
                  <col /> {/* Saturdays - flexible */}
                  <col /> {/* Sundays - flexible */}
                  <col /> {/* 5-Day - flexible */}
                  <col /> {/* 4-Day - flexible */}
                  <col /> {/* Holidays - flexible - NEW */}
                  <col className="w-auto" /> {/* Actions - auto width */}
                </colgroup>
                <thead className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-200'} border-b`}>
                  <tr>
                    {/* Auto-sized columns */}
                    <th 
                      className="px-3 py-3 text-left cursor-pointer whitespace-nowrap" 
                      onClick={() => handleSort("line")}
                    >
                      Line # {getSortIndicator("line")}
                    </th>
                    <th 
                      className="px-3 py-3 text-center cursor-pointer whitespace-nowrap" 
                      onClick={() => handleSort("group")}
                    >
                      Group {getSortIndicator("group")}
                    </th>
                    <th 
                      className="px-3 py-3 text-center cursor-pointer whitespace-nowrap" 
                      onClick={() => handleSort("matchScore")}
                    >
                      Score {getSortIndicator("matchScore")}
                    </th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Weekends</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Saturdays</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Sundays</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">5-Day</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">4-Day</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap">Holidays</th> {/* NEW */}
                    <th className="px-3 py-3 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSchedules.map((schedule, index) => {
                    const isExpanded = expandedSchedules.includes(`details-${schedule.id}`);
                    const explanationPoints = parseExplanation(schedule.explanation);
                    
                    // Get values directly from the schedule data
                    // Extract the numeric values, handling both numeric and string inputs
                    const extractNumeric = (value) => {
                      if (typeof value === 'number') return value;
                      if (typeof value === 'string') {
                        const match = value.match(/^(\d+)/);
                        return match ? parseInt(match[1], 10) : 0;
                      }
                      return 0;
                    };
                    
                    const weekendsOn = extractNumeric(schedule.weekendsOn);
                    const saturdaysOn = extractNumeric(schedule.saturdaysOn);
                    const sundaysOn = extractNumeric(schedule.sundaysOn);
                    const blocks5day = extractNumeric(schedule.blocks5day);
                    const blocks4day = extractNumeric(schedule.blocks4day);
                    
                    // Get totals from the schedule or use sensible defaults 
                    const totalWeekends = schedule.totalWeekends || 24;
                    
                    // Process holiday data with robust property access
                    const getHolidayData = (schedule) => {
                      // Extract numeric value safely
                      const extractNumeric = (value) => {
                        if (typeof value === 'number') return value;
                        if (typeof value === 'string') {
                          const match = value.match(/^(\d+)/);
                          return match ? parseInt(match[1], 10) : 0;
                        }
                        return 0;
                      };
                      
                      // Try all possible property names systematically
                      const holidayCountProperties = [
                        'holidays_on',         // snake_case (database format)
                        'holidaysOn',          // camelCase
                        'HOLIDAYS_ON',         // UPPERCASE
                        'holidays_on_count',   // snake_case alternate
                        'holidaysOnCount',     // camelCase alternate
                        'HOLIDAYS_ON_COUNT'    // UPPERCASE alternate
                      ];
                      
                      // Try direct property access first
                      let holidaysOn = 0;
                      
                      for (const prop of holidayCountProperties) {
                        if (schedule[prop] !== undefined) {
                          const count = extractNumeric(schedule[prop]);
                          if (count > 0) {
                            holidaysOn = count;
                            break;
                          }
                        }
                      }
                      
                      // If still zero, check nested properties or try to derive from data
                      if (holidaysOn === 0) {
                        // Check nested properties
                        const checks = [
                          schedule.statistics?.holidaysOn,
                          schedule.holidays?.on,
                          schedule.holidays?.count,
                          schedule.holidayCount,
                          schedule.totals?.holidays
                        ];
                        
                        for (const value of checks) {
                          if (value) {
                            const count = extractNumeric(value);
                            if (count > 0) {
                              holidaysOn = count;
                              break;
                            }
                          }
                        }
                      }
                      
                      return holidaysOn;
                    };
                    
                    // Get holiday count using comprehensive extraction
                    const holidaysOn = getHolidayData(schedule);
                    
                    // Get holiday data for expanded view - more robust approach
                    let holidaysData = null;
                    const possibleDataProps = [
                      'holidays_data',    // snake_case (database format)
                      'holidaysData',     // camelCase
                      'HOLIDAYS_DATA',    // UPPERCASE
                      'holiday_data',     // alternate snake_case
                      'holidayData',      // alternate camelCase
                      'HOLIDAY_DATA'      // alternate UPPERCASE
                    ];
                    
                    // Try each possible property name
                    for (const prop of possibleDataProps) {
                      if (schedule[prop] !== undefined && schedule[prop] !== null) {
                        holidaysData = schedule[prop];
                        break;
                      }
                    }
                    
                    // Parse string data if needed
                    if (typeof holidaysData === 'string' && holidaysData.trim()) {
                      try {
                        holidaysData = JSON.parse(holidaysData);
                      } catch (e) {
                        // Fail silently - production code
                        holidaysData = null;
                      }
                    }
                    
                    return (
                      <React.Fragment key={index}>
                        <tr 
                          className={`${
                            index % 2 === 0 
                              ? theme === 'dark' ? 'bg-gray-800' : 'bg-white' 
                              : theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
                          } border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <td className={`px-3 py-3 font-medium whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                            {schedule.line}
                          </td>
                          <td className={`px-3 py-3 text-center whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {schedule.group}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-center">
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getScoreColor(schedule.matchScore)}`}
                              >
                                {typeof schedule.matchScore === 'number' 
                                  ? Math.round(schedule.matchScore) 
                                  : schedule.matchScore}
                              </div>
                            </div>
                          </td>
                          
                          {/* Stat columns with improved colors - CORRECTLY DISPLAYING VALUES */}
                          <td className="p-0 h-full">
                            <div className={`h-full w-full flex items-center justify-center py-3 ${getStatCellColors(0)}`}>
                              {weekendsOn} of {totalWeekends}
                            </div>
                          </td>
                          <td className="p-0 h-full">
                            <div className={`h-full w-full flex items-center justify-center py-3 ${getStatCellColors(1)}`}>
                              {saturdaysOn}
                            </div>
                          </td>
                          <td className="p-0 h-full">
                            <div className={`h-full w-full flex items-center justify-center py-3 ${getStatCellColors(2)}`}>
                              {sundaysOn}
                            </div>
                          </td>
                          <td className="p-0 h-full">
                            <div className={`h-full w-full flex items-center justify-center py-3 ${getStatCellColors(3)}`}>
                              {blocks5day}
                            </div>
                          </td>
                          <td className="p-0 h-full">
                            <div className={`h-full w-full flex items-center justify-center py-3 ${getStatCellColors(4)}`}>
                              {blocks4day}
                            </div>
                          </td>
                          <td className="p-0 h-full">
                            <div className={`h-full w-full flex items-center justify-center py-3 ${getStatCellColors(5)}`}>
                              {holidaysOn} of {totalHolidays}
                            </div>
                          </td>
                          
                          {/* Action buttons - larger and thicker */}
                          <td className="px-3 py-3">
                            <div className="flex justify-center items-center space-x-2">
                              <button
                                onClick={() => toggleDetails(`details-${schedule.id}`)}
                                className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${
                                  theme === 'dark' 
                                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                type="button"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                                </svg>
                                {isExpanded ? "Hide Details" : "Show Details"}
                              </button>
                              
                              <Link
                                href={createSimpleLink(`/schedules/${schedule.id}`, schedule.id)}
                                className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </Link>
                              
                              <Link
                                href={createSimpleLink(`/comparison`, schedule.id)}
                                className={`px-3 py-2 text-sm font-medium rounded-md flex items-center ${theme === 'dark' ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-green-500 text-white hover:bg-green-600'}`}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a1 1 0 011-1h2a1 1 0 011 1v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Compare
                              </Link>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expandable details row with improved shift time display */}
                        {isExpanded && (
                          <tr 
                            className={`${theme === 'dark' ? 'bg-gray-750 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}
                          >
                            <td colSpan={10}>
                              <div className="space-y-4 px-6 py-4">
                                {/* Shift Breakdown Section with times */}
                                {schedule.shiftCounts && (
                                  <div className={`p-3 rounded-lg ${
                                    theme === 'dark' 
                                      ? 'bg-blue-900/30 border border-blue-800' 
                                      : 'bg-blue-50 border border-blue-200'
                                  }`}>
                                    <h3 className={`text-sm font-medium mb-2 ${
                                      theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                                    }`}>Shift Breakdown</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(schedule.shiftCounts).map(([code, count]) => {
                                        const timeDisplay = getShiftTimeDisplay(code);
                                        return (
                                          <div 
                                            key={code} 
                                            className={`text-sm ${theme === 'dark' ? 'text-blue-100' : 'text-blue-700'}`}
                                          >
                                            {code} ({timeDisplay}): {count}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Holidays Section - Both Worked and Off */}
                                {(() => {
                                  // Parse the holidays_data from the schedule
                                  let holidaysWorked = [];
                                  
                                  if (holidaysData) {
                                    try {
                                      // If it's not already an array, try to parse it
                                      if (!Array.isArray(holidaysData)) {
                                        holidaysWorked = typeof holidaysData === 'string' 
                                          ? JSON.parse(holidaysData) 
                                          : holidaysData;
                                      } else {
                                        holidaysWorked = holidaysData;
                                      }
                                      
                                      // Ensure each holiday has a formatted date
                                      holidaysWorked = holidaysWorked.map(holiday => {
                                        if (!holiday.formattedDate && holiday.date) {
                                          try {
                                            // Parse date manually to avoid timezone issues
                                            const [year, month, day] = holiday.date.split('-');
                                            const monthNames = [
                                              'January', 'February', 'March', 'April', 'May', 'June',
                                              'July', 'August', 'September', 'October', 'November', 'December'
                                            ];
                                            const formattedDate = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
                                            return { ...holiday, formattedDate };
                                          } catch (e) {
                                            return { ...holiday, formattedDate: holiday.date };
                                          }
                                        }
                                        return holiday;
                                      });
                                    } catch (error) {
                                      console.error("Error processing holiday data:", error);
                                    }
                                  }
                                  
                                  // Calculate holidays that are OFF (not worked)
                                  const holidaysOff = allHolidays.filter(holiday => {
                                    return !holidaysWorked.some(worked => worked.date === holiday.date);
                                  });
                                  
                                  const holidaysOffCount = holidaysOff.length;
                                  
                                  return (holidaysWorked.length > 0 || holidaysOffCount > 0) ? (
                                    <div className="space-y-3">
                                      {/* Holidays Worked */}
                                      {holidaysWorked.length > 0 && (
                                        <div className={`p-3 rounded-lg ${
                                          theme === 'dark' 
                                            ? 'bg-rose-900/30 border border-rose-800' 
                                            : 'bg-rose-50 border border-rose-200'
                                        }`}>
                                          <h3 className={`text-sm font-medium mb-2 ${
                                            theme === 'dark' ? 'text-rose-300' : 'text-rose-800'
                                          }`}>🔴 Holidays Worked ({holidaysWorked.length})</h3>
                                          <div className="space-y-1">
                                            {holidaysWorked.map((holiday, i) => (
                                              <div 
                                                key={i} 
                                                className={`text-sm ${theme === 'dark' ? 'text-rose-100' : 'text-rose-700'}`}
                                              >
                                                {holiday.name} ({holiday.formattedDate || holiday.date}) - Shift: {holiday.shiftCode}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Holidays Off */}
                                      {holidaysOffCount > 0 && (
                                        <div className={`p-3 rounded-lg ${
                                          theme === 'dark' 
                                            ? 'bg-green-900/30 border border-green-800' 
                                            : 'bg-green-50 border border-green-200'
                                        }`}>
                                          <h3 className={`text-sm font-medium mb-2 ${
                                            theme === 'dark' ? 'text-green-300' : 'text-green-800'
                                          }`}>🟢 Holidays Off ({holidaysOffCount})</h3>
                                          <div className="space-y-1">
                                            {holidaysOff.map((holiday, i) => (
                                              <div 
                                                key={i} 
                                                className={`text-sm ${theme === 'dark' ? 'text-green-100' : 'text-green-700'}`}
                                              >
                                                {holiday.name} ({holiday.formattedDate || holiday.date}) - Day Off
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Summary */}
                                      <div className={`text-xs text-center ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        Total: {holidaysWorked.length} worked + {holidaysOffCount} off = {totalHolidays} holidays
                                      </div>
                                    </div>
                                  ) : holidaysOn > 0 ? (
                                    <div className={`p-3 rounded-lg ${
                                      theme === 'dark' 
                                        ? 'bg-rose-900/30 border border-rose-800' 
                                        : 'bg-rose-50 border border-rose-200'
                                    }`}>
                                      <h3 className={`text-sm font-medium mb-2 ${
                                        theme === 'dark' ? 'text-rose-300' : 'text-rose-800'
                                      }`}>🔴 Holidays Worked ({holidaysOn} of {totalHolidays})</h3>
                                      <div className="space-y-2">
                                        <div className={`text-sm ${theme === 'dark' ? 'text-rose-100' : 'text-rose-700'}`}>
                                          This schedule includes {holidaysOn} holidays (detailed data not available)
                                        </div>
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                                
                                {/* Other Explanation Points Section */}
                                {explanationPoints.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    {explanationPoints.map((point, i) => (
                                      <div 
                                        key={i} 
                                        className={`flex items-start ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                                      >
                                        <span className={`flex-shrink-0 w-6 h-6 rounded-full ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'} flex items-center justify-center text-xs mr-3`}>
                                          {i + 1}
                                        </span>
                                        <span className="text-sm">{point}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Fixed refresh button */}
        <div className="fixed bottom-6 right-6">
          <button 
            onClick={handleRefresh}
            className={`${theme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-500' 
              : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-3 rounded-full shadow-lg transition-colors flex items-center`}
            type="button"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Results
          </button>
        </div>
      </div>
    </div>
  );
}