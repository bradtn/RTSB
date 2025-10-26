// src/contexts/filter/FilterContext.jsx
// Main context provider that uses the extracted hooks

import React, { createContext, useContext, useMemo, useEffect } from "react";
import { 
  useFilterState, 
  useFilterActions, 
  useFilterNavigation,
  useInitializationEffects
} from "./hooks";
import { DEFAULT_CRITERIA } from "./constants";
// Add our recovery utility imports
import { backupCriteria, restoreFromBackup, getFilterCount, wasReset } from "@/utils/recoveryHandlers";

// Create the context
const FilterContext = createContext(null);

export function FilterProvider({ children, shiftCodes, allGroups }) {
  // Add state for filtered shift codes
  const [filteredShiftCodes, setFilteredShiftCodes] = React.useState(shiftCodes || []);
  
  // Add a debug effect to monitor initialization
  useEffect(() => {
    console.log("=== FilterProvider mounted ===");
    return () => {
      console.log("=== FilterProvider unmounted ===");
    };
  }, []);

  // Load all state from the hook
  const filterState = useFilterState();
  
  // Extract required items for the other hooks
  const {
    // State
    parsedCriteria,
    setParsedCriteria,
    schedules,
    setSchedules,
    filteredSchedules,
    setFilteredSchedules,
    showingResults,
    setShowingResults,
    step,
    setStep,
    subModes,
    setSubModes,
    activeView,
    setActiveView,
    currentSubsections,
    setCurrentSubsections,
    pageState,
    setPageState,
    isReady,
    setIsReady,
    criteria,
    setCriteria,
    resultsSortState,
    setResultsSortState,
    
    // Refs
    filtersAppliedRef,
    navigationLockRef,
    schedulesLoadedRef,
    waitingForSchedulesRef,
    waitingForApplyRef,
    refreshTimerRef,
    hasInitialized,
    criteriaLoadedRef,
    calculationInProgressRef,
    autoRefreshExecutedRef,
    
    // Other
    sessionStatus,
    updateNestedState,
    showFakeLoading,
    fakeSyncDone
  } = filterState;
  
  // Debug effect for initialization status (simplified)
  useEffect(() => {
    if (hasInitialized.current || isReady) {
      console.log(`Initialization status: isReady=${isReady}, hasInitialized=${hasInitialized.current}, schedulesLoaded=${schedulesLoadedRef.current}`);
    }
  }, [isReady, hasInitialized, schedulesLoadedRef]);

  // Get navigation functions first (we need them for actions)
  const navigation = useFilterNavigation({
    // State
    isReady,
    step,
    showingResults,
    setStep,
    setShowingResults,
    
    // Refs
    navigationLockRef,
    
    // Subsections
    currentSubsections,
    setCurrentSubsections,
    
    // UI state updaters
    setSubModes,
    setResultsSortState
  });
  
  // Extract navigation functions
  const {
    navigateToSection,
    navigateToSubsection,
    onGroupViewModeChange,
    onDateViewModeChange,
    onShiftModeChange,
    onWeekendTabChange,
    onStretchTabChange,
    onResultsStateChange
  } = navigation;
  
  // Get filter actions with the navigateToSection function
  const filterActions = useFilterActions({
    // State
    parsedCriteria,
    setParsedCriteria,
    schedules,
    setFilteredSchedules,
    setShowingResults,
    setStep,
    setCriteria,
    setSubModes,
    setPageState,
    step,
    
    // Navigation
    navigateToSection,
    
    // Refs
    filtersAppliedRef,
    autoRefreshExecutedRef,
    refreshTimerRef,
    waitingForApplyRef,
    waitingForSchedulesRef,
    calculationInProgressRef,
    navigationLockRef,
    
    // Subsections
    setCurrentSubsections,
    
    // Other
    shiftCodes,
    sessionStatus
  });
  
  // Function to fetch filtered shift codes based on selected groups
  const fetchFilteredShiftCodes = async (selectedGroups) => {
    try {
      if (!selectedGroups || selectedGroups.length === 0) {
        setFilteredShiftCodes(shiftCodes || []);
        return;
      }
      
      const response = await fetch('/api/shift-codes/by-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groups: selectedGroups }),
      });
      
      if (response.ok) {
        const filteredCodes = await response.json();
        setFilteredShiftCodes(filteredCodes);
        console.log(`Filtered shift codes for groups ${selectedGroups.join(', ')}: ${filteredCodes.length} codes`);
      } else {
        console.log('Using all shift codes (user not authenticated or API unavailable)');
        setFilteredShiftCodes(shiftCodes || []);
      }
    } catch (error) {
      console.log('Using all shift codes (API error):', error.message);
      setFilteredShiftCodes(shiftCodes || []);
    }
  };

  // Extract actions 
  const {
    applyFilters,
    reapplyFilters,
    updateCriteria,
    updateWeight,
    set5DayWeight,
    set4DayWeight,
    setProvince,
    nextStep,
    prevStep,
    resetFilters,
    backToFilters,
    // Extract our new recovery function
    checkAndRestoreCriteria
  } = filterActions;
  
  // Effect to fetch filtered shift codes when selected groups change
  useEffect(() => {
    if (parsedCriteria?.selectedGroups) {
      fetchFilteredShiftCodes(parsedCriteria.selectedGroups);
    }
  }, [parsedCriteria?.selectedGroups]);

  // Manually fetch schedules if they haven't loaded
  useEffect(() => {
    if (!schedulesLoadedRef.current && schedules.length === 0) {
      console.log("Manually triggering schedule fetch");
      const fetchSchedules = async () => {
        try {
          const response = await fetch("/api/schedules");
          if (!response.ok) {
            throw new Error(`Failed to fetch schedules: ${response.status}`);
          }
          const data = await response.json();
          if (Array.isArray(data)) {
            console.log(`Fetched ${data.length} schedules manually`);
            setSchedules(data);
            schedulesLoadedRef.current = true;
          }
        } catch (error) {
          console.error("Manual schedule fetch failed:", error);
        }
      };
      fetchSchedules();
    }
  }, [schedules.length, schedulesLoadedRef, setSchedules]);
  
  // Run initialization effects
  useInitializationEffects({
    // State
    parsedCriteria, 
    criteria,
    schedules,
    showingResults,
    activeView,
    step,
    isReady,
    
    // State setters
    setParsedCriteria,
    setCriteria,
    setPageState,
    setIsReady,
    setActiveView,
    setSchedules,
    
    // Refs
    hasInitialized,
    schedulesLoadedRef,
    criteriaLoadedRef,
    waitingForApplyRef,
    calculationInProgressRef,
    refreshTimerRef,
    waitingForSchedulesRef,
    
    // Actions
    applyFilters,
    
    // Default values
    DEFAULT_CRITERIA
  });
  
  // Calculate loading state for the results view
  const isLoadingResults = pageState.isLoadingData || 
                      pageState.isLoadingCriteria || 
                      pageState.isApplyingFilters || 
                      waitingForApplyRef.current || 
                      !parsedCriteria || 
                      (showingResults && !filtersAppliedRef.current);
  
  // Set up monitoring for criteria issues (optimized)
  useEffect(() => {
    if (!isReady || !parsedCriteria) return;
    
    // Check criteria integrity on component mount
    if (getFilterCount(parsedCriteria) <= 2) {
      console.log("Context detected possible reset on mount, checking for backup");
      checkAndRestoreCriteria(true);
    } else {
      // If we have good criteria, back it up
      backupCriteria(parsedCriteria);
    }
    
    // Set up periodic check for criteria integrity (less frequent)
    const intervalId = setInterval(() => {
      if (parsedCriteria && getFilterCount(parsedCriteria) <= 2) {
        console.log("Context periodic check detected possible reset, checking for backup");
        checkAndRestoreCriteria(true);
      }
    }, 30000); // Check every 30 seconds (increased from 10 seconds)
    
    return () => clearInterval(intervalId);
  }, [isReady, parsedCriteria, checkAndRestoreCriteria]);
  
  // Create a memoized context value
  const contextValue = useMemo(() => ({
    // State
    step,
    showingResults,
    parsedCriteria,
    subModes,
    activeView,
    schedules,
    filteredSchedules,
    pageState,
    isReady,
    isLoadingResults,
    showFakeLoading,
    isSyncing: false, // Always false since we're not waiting for server
    fakeSyncDone,
    currentSubsections,
    resultsSortState,
    
    // UI state handlers
    onGroupViewModeChange,
    onDateViewModeChange,
    onShiftModeChange,
    onWeekendTabChange,
    onStretchTabChange,
    onResultsStateChange,
    
    // Filter operations
    updateCriteria,
    updateWeight,
    set5DayWeight,
    set4DayWeight,
    applyFilters,
    reapplyFilters,
    setProvince, // Added for holiday support
    
    // Navigation
    nextStep,
    prevStep,
    resetFilters,
    backToFilters,
    navigateToSection,
    navigateToSubsection,
    
    // Other
    shiftCodes: filteredShiftCodes,
    allGroups,
    filtersAppliedRef,
    
    // For compatibility with existing components
    updateState: setCriteria, 
    updateNestedState,
    setResultsSortState,
    
    // Recovery methods
    backupCriteria,
    restoreFromBackup,
    checkAndRestoreCriteria,
    getFilterCount,
    wasReset
  }), [
    step, showingResults, parsedCriteria, subModes, activeView, 
    schedules, filteredSchedules, pageState, isReady, isLoadingResults,
    showFakeLoading, fakeSyncDone, currentSubsections, resultsSortState,
    onGroupViewModeChange, onDateViewModeChange, onShiftModeChange, 
    onWeekendTabChange, onStretchTabChange, onResultsStateChange,
    updateCriteria, updateWeight, set5DayWeight, set4DayWeight, 
    applyFilters, reapplyFilters, setProvince,
    nextStep, prevStep, resetFilters, 
    backToFilters, navigateToSection, navigateToSubsection,
    filteredShiftCodes, allGroups, setCriteria, updateNestedState, setResultsSortState,
    // Recovery methods
    backupCriteria, restoreFromBackup, checkAndRestoreCriteria, getFilterCount, wasReset
  ]);
  
  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

// Custom hook to access the filter context
export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}