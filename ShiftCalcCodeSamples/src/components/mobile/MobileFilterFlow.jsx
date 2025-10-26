// src/components/mobile/MobileFilterFlow.jsx
import React, { useState, useEffect, useRef } from "react";
import { FilterProvider, useFilter } from "@/contexts/FilterContext";
import MobileHeader from "./MobileHeader";
import { MobileLoadingView } from "./MobileLoadingView";
import MobileErrorView from "./MobileErrorView";
import MobileResults from "./MobileResults";
import MobileStepNavigator from "./MobileStepNavigator";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

// The FilterFlow content component - uses the FilterContext
function FilterFlowContent() {
  const { 
    showingResults, pageState, isLoadingResults, 
    filteredSchedules, backToFilters, resetFilters, parsedCriteria,
    reapplyFilters, isSyncing, fakeSyncDone, schedules, 
    filtersAppliedRef, navigateToSection, step, updateCriteria
  } = useFilter();
  
  // Use theme context
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Simplified error state
  const [error, setError] = useState(null);
  
  // Session status for UI indication only
  const [sessionStatus, setSessionStatus] = useState("unauthenticated");
  
  // Manually controlled loading state
  const [showLoadingView, setShowLoadingView] = useState(false);
  
  // NEW: Track whether loading was explicitly requested by user
  const [userRequestedLoad, setUserRequestedLoad] = useState(false);
  
  // NEW: Add a ref to track initial mount/refresh to prevent showing loading on refresh
  const isInitialMount = useRef(true);
  
  // NEW: Keep a reference to the full criteria for persistence
  const fullCriteriaRef = useRef(null);
  
  // Check session status for UI indicator
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        setSessionStatus(data?.user ? "authenticated" : "unauthenticated");
      } catch (error) {
        console.error("Error checking session:", error);
        setSessionStatus("unauthenticated");
      }
    };
    
    checkSession();
  }, []);
  
  // NEW: Effect runs once after component mounts to mark initialization complete
  useEffect(() => {
    // After a small delay, mark initialization as complete
    const initTimer = setTimeout(() => {
      isInitialMount.current = false;
      console.log("Initial mount period complete");
    }, 500);
    
    return () => clearTimeout(initTimer);
  }, []);
  
  // NEW: Save full criteria to sessionStorage when in results view
  useEffect(() => {
    if (showingResults && parsedCriteria) {
      console.log("Results view active, backing up complete criteria");
      
      // Save full criteria to our ref
      fullCriteriaRef.current = {...parsedCriteria};
      
      // Also save to sessionStorage as backup
      try {
        const CRITERIA_BACKUP_KEY = 'mobileCriteriaBackup';
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(CRITERIA_BACKUP_KEY, JSON.stringify(parsedCriteria));
          console.log("Saved full criteria to backup storage");
        }
      } catch (error) {
        console.error("Error saving criteria to backup:", error);
      }
    }
  }, [showingResults, parsedCriteria]);
  
  // NEW: Detect and restore incomplete criteria after refresh
  useEffect(() => {
    // Only run this on initial mount when showing results
    if (isInitialMount.current && showingResults && parsedCriteria) {
      console.log("Checking for incomplete criteria after refresh");
      
      // Check if we have potential backup criteria
      const CRITERIA_BACKUP_KEY = 'mobileCriteriaBackup';
      let backupCriteria = null;
      
      // Try to get from our ref first (in-memory)
      if (fullCriteriaRef.current) {
        backupCriteria = fullCriteriaRef.current;
      } 
      // Otherwise try session storage
      else if (typeof window !== 'undefined') {
        try {
          const storedCriteria = sessionStorage.getItem(CRITERIA_BACKUP_KEY);
          if (storedCriteria) {
            backupCriteria = JSON.parse(storedCriteria);
          }
        } catch (error) {
          console.error("Error loading criteria from backup:", error);
        }
      }
      
      // If we have backup criteria, check if current criteria appear incomplete
      if (backupCriteria) {
        console.log("Found backup criteria, comparing with current", {
          current: parsedCriteria,
          backup: backupCriteria
        });
        
        // Check for specific issues with weights being reset to defaults
        const hasDefaultWeights = 
          parsedCriteria?.weights?.blocks5dayWeight === 0 && 
          parsedCriteria?.weights?.blocks4dayWeight === 0;
        
        // Count how many non-empty criteria we have
        const criteriaCount = Object.entries(parsedCriteria || {})
          .filter(([key, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
            return value !== null && value !== undefined;
          }).length;
        
        // Determine if we need to restore
        const needsRestore = hasDefaultWeights && criteriaCount < 3;
        
        if (needsRestore) {
          console.log("Detected incomplete criteria, restoring from backup");
          
          // Apply all criteria values
          if (typeof updateCriteria === 'function') {
            // First update array values
            ['selectedGroups', 'dayOffDates', 'selectedShiftCodes', 
             'selectedShiftCategories', 'selectedShiftLengths'].forEach(key => {
              if (Array.isArray(backupCriteria[key]) && backupCriteria[key].length > 0) {
                console.log(`Restoring array: ${key} with ${backupCriteria[key].length} items`);
                updateCriteria(key, [...backupCriteria[key]]);
              }
            });
            
            // Then update weights
            if (backupCriteria.weights) {
              Object.entries(backupCriteria.weights).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                  console.log(`Restoring weight: ${key} = ${value}`);
                  updateCriteria(['weights', key], value);
                }
              });
            }
            
            // After restoring, reapply filters without showing loading
            setTimeout(() => {
              console.log("Criteria restored, reapplying filters");
              if (filtersAppliedRef) filtersAppliedRef.current = false;
              reapplyFilters();
            }, 300);
          }
        }
      }
    }
  }, [showingResults, parsedCriteria, updateCriteria, filtersAppliedRef, reapplyFilters]);
  
  // MODIFIED: Monitor isLoadingResults to control loading view, but only when user requested it
  useEffect(() => {
    // Skip during initial render/refresh
    if (isInitialMount.current) {
      console.log("Skipping load view during initial mount/refresh");
      return;
    }
    
    // Only show loading when it was explicitly requested by the user
    if (isLoadingResults && userRequestedLoad) {
      console.log("User-requested loading in progress, showing loading view");
      setShowLoadingView(true);
      
      // Reset the user request flag - it's been consumed
      setUserRequestedLoad(false);
    }
  }, [isLoadingResults, userRequestedLoad]);
  
  // DISABLED: Aggressive auto-reapply causing flickering
  // This effect was causing constant re-triggers and flickering
  /*
  useEffect(() => {
    // Only run this effect if we're showing results
    if (showingResults) {
      console.log("Results view detected, checking for refresh scenario");
      
      // Create a refresh detection mechanism using sessionStorage
      const isPageRefresh = () => {
        if (typeof window !== 'undefined') {
          const pageLoadKey = 'mobileResultsPageLoad';
          // Check if this is a new page load
          if (!sessionStorage.getItem(pageLoadKey)) {
            // Set the flag to indicate we've loaded the page
            sessionStorage.setItem(pageLoadKey, Date.now().toString());
            return true; // First time we're setting it, must be a fresh load
          }
          
          // Check if the filtered results are empty but we have schedules and criteria
          const hasEmptyResults = !filteredSchedules || filteredSchedules.length === 0;
          const hasSchedules = schedules && schedules.length > 0;
          const hasCriteria = parsedCriteria && Object.keys(parsedCriteria).length > 0;
          
          // Return true if we need to refresh anyway
          return hasEmptyResults && hasSchedules && hasCriteria;
        }
        return false;
      };
      
      // Check if this is a page refresh
      const isRefresh = isPageRefresh();
      
      if (isRefresh) {
        console.log("Detected browser refresh in results view!");
        
        // Give more time for all data to be initialized
        const reapplyTimer = setTimeout(() => {
          // Force reset the filters applied flag
          if (filtersAppliedRef) {
            filtersAppliedRef.current = false;
          }
          
          console.log("Force reapplying filters after refresh with criteria:", parsedCriteria);
          try {
            reapplyFilters();
          } catch (error) {
            console.error("Error reapplying filters after refresh:", error);
          }
        }, 1000); // Longer delay to ensure everything is loaded
        
        return () => clearTimeout(reapplyTimer);
      }
    }
  }, [showingResults, filteredSchedules, schedules, parsedCriteria, reapplyFilters, filtersAppliedRef]);
  */
  
  // Debug logging - this will help us see what's happening
  useEffect(() => {
    console.log("Current state:", {
      showingResults,
      isLoadingResults,
      showLoadingView,
      userRequestedLoad,
      hasSchedules: schedules?.length > 0,
      hasResults: filteredSchedules?.length > 0,
      criteriaCount: parsedCriteria ? Object.keys(parsedCriteria).length : 0,
      step,
      filtersApplied: filtersAppliedRef?.current
    });
  }, [showingResults, isLoadingResults, showLoadingView, userRequestedLoad, schedules, filteredSchedules, step, filtersAppliedRef, parsedCriteria]);
  
  // Error handling for filter operations - directly from pageState
  useEffect(() => {
    if (pageState.hasFilterError) {
      setError({
        message: "Failed to apply filters. Please try resetting your filters or refreshing the page."
      });
    } else {
      setError(null);
    }
  }, [pageState.hasFilterError]);
  
  // MODIFIED: Handle wizard completion - user explicitly requesting to see results
  const handleWizardComplete = () => {
    console.log("Wizard completed, user requested to see results");
    setUserRequestedLoad(true);
  };
  
  // Simple reset handler - uses FilterContext directly
  const handleResetFilters = () => {
    setError(null);
    resetFilters();
    navigateToSection('groups');
  };
  
  // MODIFIED: Manual refresh handler with more aggressive implementation
  const handleManualRefresh = () => {
    console.log("User manually requested refresh, current criteria:", parsedCriteria);
    
    // Force update the filters to be applied flag
    if (filtersAppliedRef && typeof filtersAppliedRef.current !== 'undefined') {
      filtersAppliedRef.current = false;
    }
    
    // Set user intent flag to show loading view
    setUserRequestedLoad(true);
    
    // Force-reapply even if there are checks in reapplyFilters
    setTimeout(() => {
      try {
        reapplyFilters();
      } catch (error) {
        console.error("Error in manual refresh:", error);
      }
    }, 50);
  };
  
  // Always show loading view when our state says to
  if (showLoadingView) {
    console.log("Rendering loading view");
    return (
      <MobileLoadingView 
        scheduleCount={schedules?.length || 0} 
        preferences={parsedCriteria ? Object.entries(parsedCriteria)
          .filter(([key, value]) => value !== null && value !== undefined)
          .map(([key, value]) => typeof value === "string" ? value : `${key}: ${value}`)
          .slice(0, 3) : []}
        onComplete={() => {
          console.log("User clicked continue, hiding loading view");
          setShowLoadingView(false);
        }}
      />
    );
  }
  
  // Render results view if filters have been applied
  if (showingResults) {
    // Show error view if there's an error
    if (error || pageState.hasFilterError) {
      return (
        <div className={`flex flex-col h-full ${styles.pageBg}`}>
          <MobileHeader 
            isSyncing={isSyncing && !fakeSyncDone} 
            isLoading={false} 
          />
          <MobileErrorView
            error={error || "Filter error occurred"}
            title="Filter Error"
            message="We couldn't apply your filters correctly."
            onReset={handleResetFilters}
            onRetry={handleManualRefresh}
          />
        </div>
      );
    }

    // Add a check for empty results in the results view
    if (!filteredSchedules || filteredSchedules.length === 0) {
      // Show a loading spinner or trigger a refresh
      console.log("Results view but no results detected, trying to recover");
      
      // If not currently loading, try to refresh the results
      if (!isLoadingResults) {
        setTimeout(() => {
          if (filtersAppliedRef) {
            filtersAppliedRef.current = false;
          }
          reapplyFilters();
        }, 100);
      }
    }

    // Show results
    return (
      <div className={`flex flex-col h-full ${styles.pageBg}`}>
        <MobileHeader 
          isSyncing={isSyncing && !fakeSyncDone} 
          isLoading={false} 
        />
        <MobileResults
          schedules={filteredSchedules}
          onFilterAgain={backToFilters}
          onResetFilters={resetFilters}
          appliedCriteria={parsedCriteria}
          isSynced={sessionStatus === "authenticated"}
          onReapplyFilters={handleManualRefresh}
          isVerified={filtersAppliedRef.current}
        />
      </div>
    );
  }
  
  // Render the filter steps
  return (
    <div className={`flex flex-col h-full ${styles.pageBg}`}>
      <MobileHeader 
        isSyncing={isSyncing && !fakeSyncDone} 
        isLoading={pageState.isLoadingData || pageState.isLoadingCriteria} 
      />
      <MobileStepNavigator 
        onFinalStepComplete={handleWizardComplete}
      />
    </div>
  );
}

// Main component that sets up the context
export default function MobileFilterFlow({ shiftCodes, allGroups }) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Simple error state
  const [initError, setInitError] = useState(null);
  
  // Simple error handling for initialization
  const handleRetryInit = () => {
    setInitError(null);
  };
  
  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className={`flex flex-col h-full ${styles.pageBg}`}>
        <MobileHeader />
        <MobileErrorView 
          error={initError}
          title="Application Error"
          message="We couldn't initialize the application correctly."
          onRetry={handleRetryInit}
        />
      </div>
    );
  }
  
  // Normal render path
  return (
    <FilterProvider shiftCodes={shiftCodes} allGroups={allGroups}>
      <FilterFlowContent />
    </FilterProvider>
  );
}