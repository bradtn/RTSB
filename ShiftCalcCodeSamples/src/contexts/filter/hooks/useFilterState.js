// src/contexts/filter/hooks/useFilterState.js
// Core state management for filter context

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { 
  DEFAULT_CRITERIA, 
  DEFAULT_SUB_MODES, 
  DEFAULT_ACTIVE_VIEW,
  DEFAULT_SUBSECTIONS
} from "../constants";
import { getLocalStorageItem, saveToLocalStorage } from "../utils/localStorage";
// Remove this import:
// import { queueServerUpdate } from "../utils/serverSync";

export function useFilterState() {
  const { status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  
  // State to coordinate overall application readiness
  const [isReady, setIsReady] = useState(false);
  const hasInitialized = useRef(false);
  
  // State for UI feedback
  const [isSaving, setIsSaving] = useState(false);
  const [showFakeLoading, setShowFakeLoading] = useState(false);
  
  // State for fake sync indication
  const [fakeSyncDone, setFakeSyncDone] = useState(false);
  
  // Refs for tracking state
  const autoRefreshExecutedRef = useRef(false);
  const loadingTimerRef = useRef(null);
  const schedulesLoadedRef = useRef(false);
  const criteriaLoadedRef = useRef(false);
  const filtersAppliedRef = useRef(false);
  const waitingForApplyRef = useRef(false);
  const refreshTimerRef = useRef(null);
  const navigationLockRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const calculationInProgressRef = useRef(false);
  const waitingForSchedulesRef = useRef(false);
  
  // State for current subsections
  const [currentSubsections, setCurrentSubsections] = useState(() => {
    const saved = getLocalStorageItem("shiftbid.currentSubsections", null);
    return saved || DEFAULT_SUBSECTIONS;
  });
  
  // Page state with loading indicators
  const [pageState, setPageState] = useState({
    isInitializing: true,
    isLoadingData: true,
    isLoadingCriteria: true,
    isApplyingFilters: false,
    resultsReady: false,
    hasAttemptedFiltering: false,
    hasLoadError: false,
    hasFilterError: false,
  });
  
  // Local state - stored immediately in localStorage
  const [step, setStepInternal] = useState(() => {
    return getLocalStorageItem("shiftbid.step", 1);
  });
  
  const [criteria, setCriteriaInternal] = useState(() => {
    return getLocalStorageItem("shiftbid.criteria", DEFAULT_CRITERIA);
  });
  
  const [showingResults, setShowingResultsInternal] = useState(() => {
    return getLocalStorageItem("shiftbid.showingResults", false);
  });
  
  const [subModes, setSubModesInternal] = useState(() => {
    return getLocalStorageItem("shiftbid.subModes", DEFAULT_SUB_MODES);
  });
  
  const [activeView, setActiveViewInternal] = useState(() => {
    return getLocalStorageItem("shiftbid.activeView", DEFAULT_ACTIVE_VIEW);
  });
  
  // Initialize sorting state from URL parameters
  const [resultsSortState, setResultsSortStateInternal] = useState(() => {
    return {
      sortBy: searchParams.get("sortBy") || "matchScore",
      sortDirection: searchParams.get("sortDirection") || "desc"
    };
  });
  
  // State for schedules
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  
  // Current parsed criteria
  const [parsedCriteria, setParsedCriteria] = useState(null);
  
  // Clean up any scheduled timers on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Save to localStorage only for step
  const setStep = (newStep) => {
    setStepInternal(newStep);
    saveToLocalStorage("shiftbid.step", newStep);
    
    // Remove the server update code:
    // if (sessionStatus === "authenticated") {
    //   queueServerUpdate("step", newStep);
    // }
  };
  
  // Save to localStorage only for criteria
  const setCriteria = (newCriteria) => {
    // Check if values have actually changed
    if (JSON.stringify(criteria) === JSON.stringify(newCriteria)) {
      // Skip update if nothing changed
      return;
    }
    
    // Deep clone to avoid reference issues
    const clonedCriteria = JSON.parse(JSON.stringify(newCriteria));
    setCriteriaInternal(clonedCriteria);
    saveToLocalStorage("shiftbid.criteria", clonedCriteria);
    
    // Remove the server update code:
    // if (sessionStatus === "authenticated") {
    //   queueServerUpdate("criteria", clonedCriteria);
    // }
  };
  
  // Save to localStorage only for showingResults
  const setShowingResults = (newValue) => {
    setShowingResultsInternal(newValue);
    saveToLocalStorage("shiftbid.showingResults", newValue);
    
    // Remove the server update code:
    // if (sessionStatus === "authenticated") {
    //   queueServerUpdate("showingResults", newValue);
    // }
  };
  
  // Save to localStorage only for subModes
  const setSubModes = (newValueOrFn) => {
    try {
      const newValue = typeof newValueOrFn === "function"
        ? newValueOrFn(subModes)
        : newValueOrFn;
      
      // Make sure newValue is valid
      if (!newValue || typeof newValue !== "object") {
        console.error("Invalid subModes structure:", newValue);
        return; // Early return to prevent error
      }
      
      // Skip update if the new value is the same as current
      if (JSON.stringify(subModes) === JSON.stringify(newValue)) {
        return;
      }
      
      setSubModesInternal(newValue);
      saveToLocalStorage("shiftbid.subModes", newValue);
      
      // Remove the server update code:
      // if (sessionStatus === "authenticated") {
      //   queueServerUpdate("subModes", newValue);
      // }
    } catch (error) {
      console.error("Error updating subModes:", error);
    }
  };
  
  // Save to localStorage only for activeView
  const setActiveView = (newValueOrFn) => {
    try {
      const newValue = typeof newValueOrFn === "function"
        ? newValueOrFn(activeView)
        : newValueOrFn;
      
      // Skip update if the new value is the same as current
      if (JSON.stringify(activeView) === JSON.stringify(newValue)) {
        return;
      }
      
      setActiveViewInternal(newValue);
      saveToLocalStorage("shiftbid.activeView", newValue);
      
      // Remove the server update code:
      // if (sessionStatus === "authenticated") {
      //   queueServerUpdate("activeView", newValue);
      // }
    } catch (error) {
      console.error("Error in setActiveView:", error);
    }
  };
  
  // Save to localStorage only for resultsSortState
  const setResultsSortState = (newValueOrFn) => {
    try {
      const newValue = typeof newValueOrFn === "function"
        ? newValueOrFn(resultsSortState)
        : newValueOrFn;
      
      // Skip update if the new value is the same as current
      if (JSON.stringify(resultsSortState) === JSON.stringify(newValue)) {
        return;
      }
      
      setResultsSortStateInternal(newValue);
      
      // Update URL parameters
      const params = new URLSearchParams(window.location.search);
      params.set("sortBy", newValue.sortBy);
      params.set("sortDirection", newValue.sortDirection);
      window.history.replaceState({}, "", `?${params}`);
      
      // Remove the server update code:
      // if (sessionStatus === "authenticated") {
      //   queueServerUpdate("resultsSortState", newValue);
      // }
    } catch (error) {
      console.error("Error in setResultsSortState:", error);
    }
  };
  
  // Listen for the fake sync event
  useEffect(() => {
    const handleFakeSyncDone = () => {
      console.log("Fake sync done event received");
      setFakeSyncDone(true);
    };
    
    window.addEventListener("fakeSyncDone", handleFakeSyncDone);
    return () => window.removeEventListener("fakeSyncDone", handleFakeSyncDone);
  }, []);
  
  // Update nested state for things like weights
  const updateNestedState = (section, newValues) => {
    if (section === "weights") {
      setCriteria(prevCriteria => ({
        ...prevCriteria,
        weights: {
          ...prevCriteria.weights,
          ...newValues
        }
      }));
    } else if (section === "subModes") {
      setSubModes(prev => ({
        ...prev,
        ...newValues
      }));
    }
  };

  return {
    // State
    isReady,
    setIsReady,
    hasInitialized,
    isSaving,
    setIsSaving,
    showFakeLoading,
    setShowFakeLoading,
    fakeSyncDone,
    setFakeSyncDone,
    
    // Page state
    pageState,
    setPageState,
    
    // Core state
    step,
    setStep: setStep,
    criteria,
    setCriteria: setCriteria,
    showingResults,
    setShowingResults: setShowingResults,
    subModes,
    setSubModes: setSubModes,
    activeView,
    setActiveView: setActiveView,
    resultsSortState,
    setResultsSortState: setResultsSortState,
    
    // Schedules
    schedules,
    setSchedules,
    filteredSchedules,
    setFilteredSchedules,
    
    // Criteria
    parsedCriteria,
    setParsedCriteria,
    
    // Subsections
    currentSubsections,
    setCurrentSubsections,
    
    // Ref tracking
    autoRefreshExecutedRef,
    loadingTimerRef,
    schedulesLoadedRef,
    criteriaLoadedRef,
    filtersAppliedRef,
    waitingForApplyRef,
    refreshTimerRef,
    navigationLockRef,
    saveTimeoutRef,
    calculationInProgressRef,
    waitingForSchedulesRef,
    
    // Helper functions
    updateNestedState,
    
    // Session status
    sessionStatus
  };
}