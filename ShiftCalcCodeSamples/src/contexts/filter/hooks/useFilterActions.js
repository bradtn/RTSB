// src/contexts/filter/hooks/useFilterActions.js
// Actions for filtering, navigation, and state updates

import { useCallback, useEffect } from "react";
import { calculateScheduleScore } from "@/lib/scheduler/scoring";
import { expandShiftCategoriesAndLengths, validateCriteria } from "../utils/criteriaHelpers";
import { DEFAULT_CRITERIA, DEFAULT_SUB_MODES, DEFAULT_SUBSECTIONS } from "../constants";
import { clearFilterStorage } from "../utils/localStorage";
// Add our recovery utilities
import { backupCriteria, restoreFromBackup, getFilterCount, wasReset } from "@/utils/recoveryHandlers";

export function useFilterActions({
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
}) {
  // Add recovery function to handle criteria resets
  const checkAndRestoreCriteria = useCallback((forcedRestore = false) => {
    // Skip if we're currently navigating or calculating
    if (navigationLockRef.current || calculationInProgressRef.current) {
      console.log("Skipping criteria recovery - navigation or calculation in progress");
      return false;
    }
    
    // Only check if we have criteria context
    if (!parsedCriteria) {
      console.log("Skipping criteria recovery - no current criteria");
      return false;
    }
    
    const filterCount = getFilterCount(parsedCriteria);
    
    // Check if we need to restore (criteria has low filter count or forced)
    if (filterCount <= 2 || forcedRestore) {
      console.log(`Checking for backup - current filter count: ${filterCount}`);
      
      // Try to get backup
      const backupData = restoreFromBackup();
      
      if (backupData) {
        const backupFilterCount = getFilterCount(backupData);
        
        // Only restore if backup has more filters
        if (backupFilterCount > filterCount) {
          console.log(`RESTORING FROM BACKUP: ${filterCount} -> ${backupFilterCount} filters`);
          
          // Update both state variables
          setParsedCriteria(backupData);
          setCriteria(backupData);
          
          return true;
        } else {
          console.log(`Backup has ${backupFilterCount} filters - not better than current`);
        }
      } else {
        console.log("No valid backup found for criteria");
      }
    } else {
      // We have good criteria, make sure it's backed up
      backupCriteria(parsedCriteria);
    }
    
    return false;
  }, [parsedCriteria, setParsedCriteria, setCriteria, navigationLockRef, calculationInProgressRef]);

  // Update a specific criteria field
  const updateCriteria = useCallback((field, value) => {
    // Verify we have parsedCriteria before updating
    if (!parsedCriteria) {
      console.error("Cannot update criteria - parsedCriteria is null");
      return;
    }
    
    // Only update if the value has actually changed
    if (JSON.stringify(parsedCriteria[field]) !== JSON.stringify(value)) {
      const updatedCriteria = {
        ...parsedCriteria,
        [field]: value
      };
      setParsedCriteria(updatedCriteria);
      setCriteria(updatedCriteria);
      
      // Backup if it has sufficient filters
      if (getFilterCount(updatedCriteria) > 2) {
        backupCriteria(updatedCriteria);
      }
    }
  }, [parsedCriteria, setCriteria, setParsedCriteria]);
  
  // Update a weight value - ensure weight values are always stored as numbers
  const updateWeight = useCallback((weightName, value) => {
    // Verify we have parsedCriteria before updating
    if (!parsedCriteria || !parsedCriteria.weights) {
      console.error("Cannot update weight - parsedCriteria or weights is null");
      return;
    }
    
    // Convert value to a number
    const numericValue = Number(value);
    
    // Add debugging
    console.log(`Attempting to update ${weightName} to:`, numericValue);
    console.log("Current value is:", parsedCriteria.weights[weightName]);
    
    // Only update if the value has actually changed
    if (parsedCriteria.weights[weightName] !== numericValue) {
      console.log("Value is different, updating...");
      const updatedCriteria = {
        ...parsedCriteria,
        weights: {
          ...parsedCriteria.weights,
          [weightName]: numericValue
        }
      };
      
      // Explicitly log to verify the update
      console.log(`New ${weightName} value in updated criteria:`, updatedCriteria.weights[weightName]);
      
      setParsedCriteria(updatedCriteria);
      setCriteria(updatedCriteria);
      
      // Backup if it has sufficient filters
      if (getFilterCount(updatedCriteria) > 2) {
        backupCriteria(updatedCriteria);
      }
    } else {
      console.log("Value is the same, not updating");
    }
  }, [parsedCriteria, setCriteria, setParsedCriteria]);
  
  // Memoized callbacks for work stretch selector
  const set5DayWeight = useCallback((val) => {
    updateWeight("blocks5dayWeight", val);
  }, [updateWeight]);
  
  const set4DayWeight = useCallback((val) => {
    updateWeight("blocks4dayWeight", val);
  }, [updateWeight]);
  
  // New function for setting province
  const setProvince = useCallback((province) => {
    updateCriteria("province", province);
  }, [updateCriteria]);
  
  // Apply filters to the schedules
  const applyFilters = useCallback((criteriaToUse = null) => {
    console.log("applyFilters called, schedules length:", schedules.length);
    
    // Don't start a new calculation if one is already in progress
    if (calculationInProgressRef.current) {
      console.log("Calculation already in progress, skipping redundant filter application");
      return Promise.resolve();
    }

    // Set flag to indicate calculation is starting
    calculationInProgressRef.current = true;
    
    // Update the page state to show we're applying filters
    setPageState(prev => ({
      ...prev,
      isApplyingFilters: true,
      resultsReady: false,
      hasFilterError: false
    }));
    
    try {
      // Safety check and normalization for wizard
      if (criteriaToUse) {
        criteriaToUse = validateCriteria(criteriaToUse);
      }
      
      // Check if we have schedules available
      if (schedules.length === 0) {
        console.log("No schedules available yet - setting waiting flag");
        
        // Set flag to indicate we're waiting for schedules
        waitingForSchedulesRef.current = true;
        waitingForApplyRef.current = true;
        
        // Clear the calculation flag since we're not proceeding now
        calculationInProgressRef.current = false;
        
        // Don't throw an error, just wait for schedules to load
        return;
      }
      
      // Check for criteria availability - if no criteria, try to restore
      if (!criteriaToUse && !parsedCriteria) {
        // Try to restore from backup
        const backupData = restoreFromBackup();
        if (backupData) {
          console.log("Restored criteria from backup for filter application");
          setParsedCriteria(backupData);
          criteriaToUse = backupData;
        } else {
          console.error("Cannot apply filters - no criteria available and no backup found");
          calculationInProgressRef.current = false; // Clear the flag
          throw new Error("No criteria available");
        }
      }
      
      // Always use the most reliable criteria
      const finalCriteria = criteriaToUse || parsedCriteria;
      console.log("Using criteria:", finalCriteria);
      
      // Backup criteria if it's good
      if (getFilterCount(finalCriteria) > 2) {
        backupCriteria(finalCriteria);
      }
      
      // Create a validated copy with proper defaults for everything
      const validatedCriteria = validateCriteria(finalCriteria);
      
      console.log("APPLYING FILTERS WITH VALIDATED CRITERIA:", JSON.stringify(validatedCriteria, null, 2));
      console.log("Using weight values:");
      console.table(validatedCriteria.weights);
      
      // Expand categories and lengths into specific shift codes
      const expandedCodes = expandShiftCategoriesAndLengths(validatedCriteria, shiftCodes);
      console.log("Expanded codes from categories:", expandedCodes.length);
      console.log("Final shift codes for scoring:", expandedCodes);
      
      // Create processed criteria with expanded codes
      const processedCriteria = {
        ...validatedCriteria,
        selectedShiftCodes: [
          ...(validatedCriteria.selectedShiftCodes || []), 
          ...expandedCodes
        ]
      };
      
      // Apply filters to schedules with error handling for each schedule
      const processed = [];
      
      for (const schedule of schedules) {
        try {
          // Check for required properties on the schedule
          if (!schedule || !schedule.id) {
            console.warn("Invalid schedule found, skipping:", schedule);
            continue;
          }
          
          // Try to get a score, with fallback to 0 on error
          let result;
          try {
            result = calculateScheduleScore(schedule, processedCriteria);
          } catch (scoreError) {
            console.error("Error calculating score for schedule:", schedule.id, scoreError);
            // Skip this schedule instead of adding it with a default score
            continue;
          }
          
          // Ensure we have a valid score (defensive coding)
          if (!result || typeof result.score !== "number") {
            console.warn("Invalid score result for schedule:", schedule.id, result);
            continue;
          }
          
          // Check if this schedule has holiday data
          const holidaysOn = schedule.holidays_on || schedule.holidaysOn || 0;
          const holidaysData = schedule.holidays_data || schedule.holidaysData || null;
          
          if (holidaysOn > 0) {
            console.log(`Schedule ${schedule.id} has ${holidaysOn} holidays`);
          }
          
          // Add to processed results with holiday data
          processed.push({
            id: schedule.id,
            line: String(schedule.LINE || "Unknown"),
            group: schedule.GROUP || "Unknown",
            matchScore: result.score,
            weekendsOn: result.weekendsOn || 0,
            saturdaysOn: result.saturdaysOn || 0,
            sundaysOn: result.sundaysOn || 0,
            blocks5day: result.blocks5day || 0,
            blocks4day: result.blocks4day || 0,
            holidays_on: schedule.holidays_on || 0,  // Use the actual field from DB
            holidays_data: schedule.holidays_data,   // Use the actual field from DB
            explanation: result.explanation || "",
            shifts: schedule.shifts,
            shiftCounts: result.shiftCounts || {},
            totalShifts: result.totalShifts || 0,
            dayOffDetails: result.dayOffDetails      // Add day off details for the modal
          });
        } catch (scheduleError) {
          console.error("Error processing schedule:", schedule.id, scheduleError);
          // Continue to next schedule rather than failing entire filter
          continue;
        }
      }
      
      // Filter out only truly invalid scores (keep 0-scoring schedules)
      const validScores = processed.filter(schedule => {
        const validScore = !isNaN(schedule.matchScore) && schedule.matchScore >= 0;
        if (!validScore) {
          console.log(`Filtered out schedule ${schedule.line}: invalid score=${schedule.matchScore}`);
        }
        return validScore;
      });
      
      console.log(`Schedules after filtering: ${validScores.length} of ${schedules.length}`);
      
      // Sort by score (descending)
      const sortedSchedules = [...validScores].sort((a, b) => b.matchScore - a.matchScore);
      
      // Update all state atomically
      setFilteredSchedules(sortedSchedules);
      setShowingResults(true);
      
      // Mark filters as applied
      filtersAppliedRef.current = true;
      
      // Update page state
      setPageState(prev => ({
        ...prev,
        isApplyingFilters: false,
        resultsReady: true,
        hasAttemptedFiltering: true
      }));
      
      // Clear the calculation flag
      calculationInProgressRef.current = false;
      
      console.log("Filter application complete");
    } catch (error) {
      // Clear the calculation flag in case of error
      calculationInProgressRef.current = false;
      
      console.error("Error applying filters:", error);
      
      // Update page state
      setPageState(prev => ({
        ...prev,
        isApplyingFilters: false,
        resultsReady: false,
        hasFilterError: true,
        hasAttemptedFiltering: true
      }));
      
      // Show error to console with full details
      console.error("Filter application failed with error:", error, error.stack);
      
      // Show a more helpful error message
      alert("Failed to apply filters. Please try again or check console for details.");
    }
  }, [
    schedules, 
    setFilteredSchedules, 
    setShowingResults, 
    setPageState, 
    parsedCriteria,
    setParsedCriteria,
    shiftCodes,
    calculationInProgressRef,
    waitingForSchedulesRef,
    waitingForApplyRef,
    filtersAppliedRef
  ]);
  
  // Function to force reapply filters with current criteria
  const reapplyFilters = useCallback((forcedCriteria = null) => {
    console.log("Forcing filter reapplication with criteria");
    
    // Check if we have forcedCriteria (for recovery scenarios)
    if (forcedCriteria) {
      console.log("Using provided forcedCriteria with filter count:", getFilterCount(forcedCriteria));
      
      // Update the main criteria first for persistence
      setParsedCriteria(forcedCriteria);
      setCriteria(forcedCriteria);
      
      // Update page state
      setPageState(prev => ({
        ...prev,
        isApplyingFilters: true,
        resultsReady: false,
        hasFilterError: false
      }));
      
      // Apply with a slight delay to ensure state updates
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      refreshTimerRef.current = setTimeout(() => {
        applyFilters(forcedCriteria);
      }, 100);
      
      return;
    }
    
    // If no forcedCriteria, proceed with normal reapply
    // Check for valid criteria before proceeding
    if (!parsedCriteria) {
      // Try to restore from backup
      const backupData = restoreFromBackup();
      if (backupData) {
        console.log("Restored criteria from backup for reapplyFilters");
        setParsedCriteria(backupData);
        
        // Call reapplyFilters recursively with the restored criteria
        setTimeout(() => {
          reapplyFilters(backupData);
        }, 10);
        return;
      }
      
      console.error("Cannot reapply filters - no valid criteria available");
      // Update page state
      setPageState(prev => ({
        ...prev,
        hasFilterError: true
      }));
      
      return;
    }
    
    // If already calculating, skip
    if (calculationInProgressRef.current) {
      console.log("Calculation already in progress, skipping reapply");
      return;
    }
    
    // Reset the filter applied flag
    filtersAppliedRef.current = false;
    
    // Update page state
    setPageState(prev => ({
      ...prev,
      isApplyingFilters: true,
      resultsReady: false,
      hasFilterError: false
    }));
    
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    // Apply filters with a slight delay to ensure state updates
    refreshTimerRef.current = setTimeout(() => {
      try {
        // Check if we have schedules loaded
        if (schedules.length === 0) {
          console.log("No schedules available for reapplyFilters - setting waiting flag");
          
          // Set flag to indicate we're waiting for schedules
          waitingForSchedulesRef.current = true;
          waitingForApplyRef.current = true;
          
          return;
        }
        
        // Backup criteria if it's good
        if (getFilterCount(parsedCriteria) > 2) {
          backupCriteria(parsedCriteria);
        }
        
        // Force the data to be seen as different by adding a timestamp
        const forcedRefreshCriteria = {
          ...parsedCriteria,
          _forceRefresh: Date.now()
        };
        
        applyFilters(forcedRefreshCriteria);
      } catch (error) {
        console.error("Error in reapplyFilters:", error);
        setPageState(prev => ({
          ...prev,
          isApplyingFilters: false,
          hasFilterError: true
        }));
      }
    }, 100);
  }, [
    applyFilters, 
    parsedCriteria, 
    schedules.length, 
    setPageState,
    refreshTimerRef,
    calculationInProgressRef,
    filtersAppliedRef,
    waitingForSchedulesRef,
    waitingForApplyRef,
    setParsedCriteria,
    setCriteria
  ]);

  // Reset all criteria and go back to step 1
  const resetFilters = useCallback(() => {
    console.log("Starting filter reset with local-first approach");
    
    // Apply lock to prevent navigation during reset
    navigationLockRef.current = true;
    
    // Update local state immediately
    setParsedCriteria(DEFAULT_CRITERIA);
    setFilteredSchedules([]);
    
    // Reset filter application tracking
    filtersAppliedRef.current = false;
    autoRefreshExecutedRef.current = false;
    
    // Update page state
    setPageState(prev => ({
      ...prev,
      isApplyingFilters: false,
      resultsReady: false,
      hasFilterError: false,
      hasAttemptedFiltering: false
    }));
    
    // Update stored values in order - with localStorage priority
    setShowingResults(false);
    setStep(1);
    setSubModes(DEFAULT_SUB_MODES);
    setCriteria(DEFAULT_CRITERIA);
    
    // Reset current subsections
    setCurrentSubsections(DEFAULT_SUBSECTIONS);
    
    // Navigate to groups using hook
    navigateToSection("groups");
    
    // Clear localStorage values explicitly
    clearFilterStorage();
    
    // Release navigation lock after a delay
    setTimeout(() => {
      navigationLockRef.current = false;
    }, 500);
  }, [
    setParsedCriteria,
    setFilteredSchedules,
    setPageState,
    setShowingResults,
    setStep,
    setSubModes,
    setCriteria,
    setCurrentSubsections,
    navigateToSection,
    navigationLockRef,
    filtersAppliedRef,
    autoRefreshExecutedRef
  ]);
  
  // Go back to filter view from results
  const backToFilters = useCallback(() => {
    // Apply lock to prevent navigation issues
    navigationLockRef.current = true;
    
    // Update state
    setShowingResults(false);
    
    // Reset filter application tracking
    filtersAppliedRef.current = false;
    
    // Navigate to the first step
    navigateToSection("groups");
    
    // Add a slight delay to prevent race conditions
    setTimeout(() => {
      setStep(1);
      navigationLockRef.current = false;
    }, 200);
  }, [
    setShowingResults,
    setStep,
    navigateToSection,
    navigationLockRef,
    filtersAppliedRef
  ]);
  
  // Go to next step, or apply filters if at the final step
  const nextStep = useCallback(() => {
    console.log("nextStep called, current schedules length:", schedules.length);
    
    if (step < 5) {
      const nextStepNumber = step + 1;
      setStep(nextStepNumber);
      
      // Use navigation hook instead of direct hash setting
      let section = "groups";
      if (nextStepNumber === 2) section = "dates";
      if (nextStepNumber === 3) section = "shifts";
      if (nextStepNumber === 4) section = "stretches";
      if (nextStepNumber === 5) section = "weekends";
      
      navigateToSection(section);
      window.scrollTo(0, 0);
    } else {
      // Check if we have schedules loaded before trying to apply filters
      if (schedules.length === 0) {
        console.log("Cannot apply filters yet - no schedules loaded.");
        
        // Set a flag to indicate we're waiting for schedules
        waitingForSchedulesRef.current = true;
        waitingForApplyRef.current = true;
        
        // Show loading state
        setPageState(prev => ({
          ...prev,
          isApplyingFilters: true,
          resultsReady: false,
          hasFilterError: false
        }));
        
        // Don't navigate yet - this will happen when schedules are loaded
        return;
      }
      
      // Apply lock to prevent navigation issues
      navigationLockRef.current = true;
      
      // Reset filter application tracking
      filtersAppliedRef.current = false;
      
      // Update page state
      setPageState(prev => ({
        ...prev,
        isApplyingFilters: true,
        resultsReady: false,
        hasFilterError: false
      }));
      
      // Backup criteria if it's good
      if (parsedCriteria && getFilterCount(parsedCriteria) > 2) {
        backupCriteria(parsedCriteria);
      }
      
      // Apply filters and navigate to results
      refreshTimerRef.current = setTimeout(() => {
        console.log("About to apply filters, schedules length:", schedules.length);
        applyFilters(parsedCriteria);
        navigateToSection("results");
        
        // Release navigation lock after a delay
        setTimeout(() => {
          navigationLockRef.current = false;
        }, 200);
      }, 100);
    }
  }, [
    step,
    setStep,
    schedules.length,
    navigateToSection,
    setPageState,
    applyFilters,
    parsedCriteria,
    refreshTimerRef,
    waitingForSchedulesRef,
    waitingForApplyRef,
    navigationLockRef,
    filtersAppliedRef
  ]);
  
  // Go to previous step
  const prevStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
      
      // Use the hook's navigation function instead of directly setting hash
      let section = "groups";
      if (step - 1 === 2) section = "dates";
      if (step - 1 === 3) section = "shifts";
      if (step - 1 === 4) section = "stretches";
      if (step - 1 === 5) section = "weekends";
      
      navigateToSection(section);
      window.scrollTo(0, 0);
    }
  }, [step, setStep, navigateToSection]);

  return {
    // Filter actions
    applyFilters,
    reapplyFilters,
    
    // Navigation
    nextStep,
    prevStep,
    resetFilters,
    backToFilters,
    
    // Criteria updates
    updateCriteria,
    updateWeight,
    set5DayWeight,
    set4DayWeight,
    setProvince,
    
    // Recovery
    checkAndRestoreCriteria
  };
}