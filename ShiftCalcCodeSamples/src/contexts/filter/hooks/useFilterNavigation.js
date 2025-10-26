// src/contexts/filter/hooks/useFilterNavigation.js
// Navigation and subsection management

import { useState, useCallback, useEffect } from "react";
import useHashNavigation from "@/hooks/useHashNavigation";

export function useFilterNavigation({
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
  setSubModes
}) {
  // Define resultsSortState at the beginning of the component
  const [resultsSortState, setResultsSortState] = useState({
    sortBy: 'score',
    sortDirection: 'desc'
  });

  // Use the hash navigation hook
  const { navigateToSection } = useHashNavigation({
    isReady,
    step,
    showingResults,
    setStep,
    setShowingResults,
    batchOperationInProgress: navigationLockRef
  });
  
  // Enhanced navigateToSubsection that also updates current subsections
  const navigateToSubsection = useCallback((section, subsection) => {
    // Update URL hash
    window.location.hash = `${section}/${subsection}`;
    
    // Update tracked subsection
    setCurrentSubsections(prev => ({
      ...prev,
      [section]: subsection
    }));
  }, [setCurrentSubsections]);
  
  // Listen for hash changes to update current subsections
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash.includes("/")) {
        const [section, subsection] = hash.split("/");
        
        // Update the current subsection for this section
        setCurrentSubsections(prev => ({
          ...prev,
          [section]: subsection
        }));
      }
    };
    
    // Handle initial hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [setCurrentSubsections]);
  
  // Memoized callbacks for views with fix for infinite loop
  const onGroupViewModeChange = useCallback((viewMode) => {
    // Prevent unnecessary updates in setSubModes
    setSubModes(prev => {
      if (!prev || prev.groupSelector?.viewMode === viewMode) return prev;
      return {
        ...prev, 
        groupSelector: { viewMode }
      };
    });
    
    // Prevent unnecessary updates in setCurrentSubsections
    setCurrentSubsections(prev => {
      if (prev.groups === viewMode) return prev; // Skip update if unchanged
      return {
        ...prev,
        groups: viewMode
      };
    });
  }, [setSubModes, setCurrentSubsections]);
  
  const onDateViewModeChange = useCallback((viewMode) => {
    setSubModes(prev => {
      if (!prev || prev.dateSelector?.showWeightView === viewMode) return prev;
      return {
        ...prev, 
        dateSelector: { showWeightView: viewMode }
      };
    });
    
    // Prevent unnecessary updates
    setCurrentSubsections(prev => {
      const newValue = viewMode ? "weight" : "calendar";
      if (prev.dates === newValue) return prev;
      return {
        ...prev,
        dates: newValue
      };
    });
  }, [setSubModes, setCurrentSubsections]);
  
  const onShiftModeChange = useCallback((mode, filterChoice, additionalState = {}) => {
    setSubModes(prev => {
      if (!prev) return prev;
      
      console.log(`FilterFlow: Updating shiftSelector state with mode=${mode}, screen=${additionalState.screen || mode}`);
      
      // Ensure all values are strings for consistency
      const safeMode = String(mode || "");
      const safeFilter = String(filterChoice || "");
      const safeScreen = String(additionalState.screen || mode || "");
      const safeTab = String(additionalState.selectedTab || filterChoice || "");
      
      // Create new object with safe values
      const newShiftSelector = { 
        mode: safeMode, 
        filterChoice: safeFilter,
        screen: safeScreen,
        selectedTab: safeTab
      };
      
      // Add any additional state properties
      Object.keys(additionalState).forEach(key => {
        if (key !== "screen" && key !== "selectedTab") {
          newShiftSelector[key] = additionalState[key];
        }
      });
      
      // Only update if there's actually a change
      if (JSON.stringify(prev.shiftSelector) === JSON.stringify(newShiftSelector)) {
        return prev;
      }
      
      return {
        ...prev, 
        shiftSelector: newShiftSelector
      };
    });
    
    // Prevent unnecessary updates
    setCurrentSubsections(prev => {
      if (prev.shifts === mode) return prev;
      return {
        ...prev,
        shifts: mode
      };
    });
  }, [setSubModes, setCurrentSubsections]);
  
  const onWeekendTabChange = useCallback((activeTab) => {
    setSubModes(prev => {
      if (!prev || prev.weekendPreferences?.activeTab === activeTab) return prev;
      return {
        ...prev, 
        weekendPreferences: { activeTab }
      };
    });
    
    // Prevent unnecessary updates
    setCurrentSubsections(prev => {
      if (prev.weekends === activeTab) return prev;
      return {
        ...prev,
        weekends: activeTab
      };
    });
  }, [setSubModes, setCurrentSubsections]);
  
  // Track stretch subsections
  const onStretchTabChange = useCallback((activeTab) => {
    setSubModes(prev => {
      if (!prev || prev.workStretchSelector?.activeTab === activeTab) return prev;
      return {
        ...prev, 
        workStretchSelector: { activeTab }
      };
    });
    
    // Prevent unnecessary updates
    setCurrentSubsections(prev => {
      if (prev.stretches === activeTab) return prev;
      return {
        ...prev,
        stretches: activeTab
      };
    });
  }, [setSubModes, setCurrentSubsections]);
  
  // Handle results state changes (for sorting)
  const onResultsStateChange = useCallback((newState) => {
    setResultsSortState(prev => {
      if (prev.sortBy === newState.sortBy && 
          prev.sortDirection === newState.sortDirection) {
        return prev;
      }
      return newState;
    });
  }, []);

  return {
    // Results state
    resultsSortState,
    // Navigation
    navigateToSection,
    navigateToSubsection,
    
    // UI callbacks
    onGroupViewModeChange,
    onDateViewModeChange,
    onShiftModeChange,
    onWeekendTabChange,
    onStretchTabChange,
    onResultsStateChange
  };
}