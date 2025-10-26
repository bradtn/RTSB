// src/contexts/filter/hooks/useInitializationEffects.js
// Handles all the initialization and data loading effects

import { useEffect } from "react";
import { restoreFromBackup, backupCriteria, getFilterCount } from "@/utils/recoveryHandlers";

export function useInitializationEffects({
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
}) {
  // Debug effect for monitoring initialization
  useEffect(() => {
    console.log("InitializationEffects: Component mounted");
    
    return () => {
      console.log("InitializationEffects: Component unmounted");
    };
  }, []);

  // FETCH SCHEDULES EFFECT - run when criteria is loaded
  useEffect(() => {
    if (schedulesLoadedRef.current) {
      console.log("Schedules already loaded, skipping fetch");
      return;
    }
    
    // Wait for parsedCriteria to be available
    if (!parsedCriteria) {
      console.log("Waiting for criteria before fetching schedules");
      return;
    }
    
    const fetchSchedules = async () => {
      console.log("Fetching schedules from API...");
      
      // Update page state to show loading
      setPageState(prev => ({
        ...prev,
        isLoadingData: true,
        scheduleLoadError: null
      }));
      
      try {
        // Build URL with group filter if available
        let url = "/api/schedules";
        if (parsedCriteria?.selectedGroups?.length > 0) {
          // Use the first selected group for filtering
          const selectedGroup = parsedCriteria.selectedGroups[0];
          url += `?group=${encodeURIComponent(selectedGroup)}`;
          console.log(`Fetching schedules for group: ${selectedGroup}`);
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required - please log in again");
          }
          throw new Error(`Failed to fetch schedules: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          console.log(`Successfully loaded ${data.length} schedules`);
          
          setSchedules(data);
          schedulesLoadedRef.current = true;
          
          // Signal that schedules are ready if we were waiting for them
          if (waitingForSchedulesRef.current) {
            console.log("Schedules now loaded, processing pending operation");
            waitingForSchedulesRef.current = false;
            
            // If we were waiting for schedules to apply filters, do it now
            if (waitingForApplyRef.current) {
              waitingForApplyRef.current = false;
              
              // Apply filters with a slight delay to ensure state is updated
              setTimeout(() => {
                if (parsedCriteria) {
                  console.log("Applying filters after schedules loaded");
                  applyFilters(parsedCriteria);
                }
              }, 200);
            }
          }
          
          // Update page loading state
          setPageState(prev => ({
            ...prev,
            isLoadingData: false
          }));
        } else {
          console.error("Received invalid schedules data:", data);
          setSchedules([]);
          
          // Update page state with error
          setPageState(prev => ({
            ...prev,
            isLoadingData: false,
            scheduleLoadError: "Received invalid data from server"
          }));
        }
      } catch (error) {
        console.error("Error fetching schedules:", error);
        
        // Update page state with error details
        setPageState(prev => ({
          ...prev,
          isLoadingData: false,
          scheduleLoadError: error.message || "Failed to load schedules"
        }));
        
        // If it's an auth error, don't keep retrying
        if (error.message?.includes("Authentication")) {
          console.log("Authentication error - stopping schedule fetch attempts");
          return;
        }
        
        // Set empty array on error to prevent infinite loading
        setSchedules([]);
      }
    };
    
    console.log("Scheduling schedule fetch");
    fetchSchedules();
  }, [parsedCriteria]);
  
  // CRITICAL INITIALIZATION EFFECT - coordinates all data loading
  useEffect(() => {
    if (hasInitialized.current) {
      console.log("Already initialized, skipping initialization effect");
      return;
    }
    
    console.log("=== INITIALIZING APPLICATION STATE ===");
    
    // Set initial loading state
    setPageState(prev => ({
      ...prev,
      isInitializing: true,
      isLoadingData: true,
      isLoadingCriteria: true
    }));
    
    // Initialize parsedCriteria from criteria if available
    if (criteria && !parsedCriteria) {
      console.log("Setting parsedCriteria from local storage");
      setParsedCriteria(criteria);
      criteriaLoadedRef.current = true;
      
      // Update page state
      setPageState(prev => ({
        ...prev,
        isLoadingCriteria: false
      }));
      
      // If criteria is good, backup immediately
      if (getFilterCount(criteria) > 2) {
        backupCriteria(criteria);
      }
    } else if (parsedCriteria) {
      console.log("Already have parsedCriteria");
      criteriaLoadedRef.current = true;
      setPageState(prev => ({
        ...prev,
        isLoadingCriteria: false
      }));
      
      // If criteria is good, backup immediately
      if (getFilterCount(parsedCriteria) > 2) {
        backupCriteria(parsedCriteria);
      }
    }
    
    let initialDataTimeout;
    
    // Function to check if all data is loaded and initialize the app
    const completeInitialization = () => {
      console.log(`Checking initialization criteria: schedulesLoaded=${schedulesLoadedRef.current}, parsedCriteria=${!!parsedCriteria} ${parsedCriteria ? getFilterCount(parsedCriteria) : 0}`);
      
      // Only proceed if we have both schedules and criteria
      if (schedulesLoadedRef.current && parsedCriteria) {
        console.log("=== ALL CRITICAL DATA LOADED, READY TO PROCEED ===");
        
        // Cancel any pending timeout
        if (initialDataTimeout) {
          clearTimeout(initialDataTimeout);
        }
        
        // Set the component as ready
        hasInitialized.current = true;
        setIsReady(true);
        
        // Update page state
        setPageState(prev => ({
          ...prev,
          isInitializing: false,
          isLoadingData: false,
          isLoadingCriteria: false
        }));
        
        // Backup good criteria (if not done recently)
        if (getFilterCount(parsedCriteria) > 2) {
          backupCriteria(parsedCriteria);
        }
        
        // If we're supposed to show results, schedule filter application
        if (showingResults) {
          console.log("Results page detected after initialization, scheduling filter application");
          
          // Mark that we need to apply filters
          waitingForApplyRef.current = true;
          
          // Schedule the filter application with a delay
          refreshTimerRef.current = setTimeout(() => {
            console.log("Applying filters after initialization");
            waitingForApplyRef.current = false;
            
            // Only proceed if a calculation isn't already in progress
            if (!calculationInProgressRef.current) {
              // Update page state to show we're applying filters
              setPageState(prev => ({
                ...prev,
                isApplyingFilters: true
              }));
              
              // Apply filters with properly loaded criteria
              applyFilters(parsedCriteria);
            } else {
              console.log("Calculation already in progress, skipping initialization filter application");
            }
          }, 500);
        }
      }
    };
    
    // Set a maximum timeout for initialization (15 seconds)
    initialDataTimeout = setTimeout(() => {
      console.warn("Initialization timed out, proceeding with available data");
      
      // If we don't have criteria by now, try to restore from backup first
      if (!parsedCriteria) {
        // Try to get backup criteria first
        const backupData = restoreFromBackup();
        
        if (backupData) {
          console.log("Restored criteria from backup after timeout");
          setParsedCriteria(backupData);
          setCriteria(backupData);
        } else {
          // Only use defaults if no backup exists
          console.warn("No criteria loaded after timeout, using defaults");
          setParsedCriteria(DEFAULT_CRITERIA);
          setCriteria(DEFAULT_CRITERIA);
        }
      } else {
        // We have parsedCriteria, make sure it's backed up
        if (getFilterCount(parsedCriteria) > 2) {
          backupCriteria(parsedCriteria);
        }
      }
      
      // Force completion
      hasInitialized.current = true;
      setIsReady(true);
      
      setPageState(prev => ({
        ...prev,
        isInitializing: false,
        isLoadingData: schedulesLoadedRef.current ? false : true,
        isLoadingCriteria: parsedCriteria ? false : true,
        initializationTimedOut: true
      }));
    }, 15000);
    
    // Check immediately if we already have data
    completeInitialization();
    
    // Set up periodic checks for data loading completion
    const checkIntervalId = setInterval(() => {
      completeInitialization();
    }, 500); // Increased from 200ms to 500ms
    
    return () => {
      clearInterval(checkIntervalId);
      clearTimeout(initialDataTimeout);
    };
  }, []);
  
  // Update parsedCriteria when criteria changes
  useEffect(() => {
    if (!criteria) return;
    
    try {
      // Make a deep copy to ensure weight values are properly set
      const deepCopy = JSON.parse(JSON.stringify(criteria));
      
      // Ensure all numeric weight values are properly typed
      if (deepCopy.weights) {
        Object.keys(deepCopy.weights).forEach(key => {
          if (!isNaN(Number(deepCopy.weights[key]))) {
            deepCopy.weights[key] = Number(deepCopy.weights[key]);
          }
        });
      }
      
      // Validate the criteria has the expected structure before using it
      const hasCoreFields = deepCopy.hasOwnProperty("selectedGroups") &&
                          deepCopy.hasOwnProperty("weights");
                          
      if (hasCoreFields) {
        setParsedCriteria(deepCopy);
        criteriaLoadedRef.current = true;
        
        // Update page state
        setPageState(prev => ({
          ...prev,
          isLoadingCriteria: false
        }));
        
        // If we got valid criteria with more than minimal filters, backup
        if (getFilterCount(deepCopy) > 2) {
          backupCriteria(deepCopy);
        }
      } else {
        console.error("Invalid criteria structure:", deepCopy);
      }
    } catch (error) {
      console.error("Error parsing criteria:", error);
    }
  }, [criteria, criteriaLoadedRef, setPageState, setParsedCriteria]);
  
  // Update activeView when step or showingResults changes
  useEffect(() => {
    // Don't update during initial state loading
    if (!isReady) return;
    
    // Determine the new active view
    const newActiveView = showingResults 
      ? { screen: "results" }
      : { screen: "filter", step };
      
    // Only update if the value is actually different
    if (JSON.stringify(activeView) !== JSON.stringify(newActiveView)) {
      console.log("Setting activeView to:", newActiveView);
      setActiveView(newActiveView);
    }
  }, [activeView, isReady, setActiveView, showingResults, step]);
}