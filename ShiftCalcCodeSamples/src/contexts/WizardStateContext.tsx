// src/contexts/WizardStateContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Define the structure of the wizard state
interface WizardState {
  step: number;
  showingResults: boolean;
  selectedGroups?: string[];
  dayOffDates?: Date[];
  selectedShiftCategories?: string[];
  selectedShiftLengths?: string[];
  selectedShiftCodes?: string[];
  weights?: {
    groupWeight?: number;
    daysWeight?: number;
    shiftWeight?: number;
    blocks5dayWeight?: number;
    blocks4dayWeight?: number;
    weekendWeight?: number;
    saturdayWeight?: number;
    sundayWeight?: number;
  };
  subModes?: {
    groupSelector?: {
      viewMode?: string;
    };
    dateSelector?: {
      showWeightView?: boolean;
    };
    shiftSelector?: {
      mode?: string;
      filterChoice?: string;
      screen?: string;
      selectedTab?: string;
    };
    weekendPreferences?: {
      activeTab?: string;
    };
  };
  results?: {
    sortBy?: string;
    sortDirection?: string;
    showFilterSummary?: boolean;
  };
  returnPath?: string;
}

// Define the context type
interface WizardStateContextType {
  state: WizardState;
  updateState: (newState: Partial<WizardState>) => void;
  updateNestedState: <K extends keyof WizardState>(
    key: K,
    value: Partial<WizardState[K]>
  ) => void;
  syncToUrl: () => void;
}

// Create the context with a default value
const WizardStateContext = createContext<WizardStateContextType | null>(null);

// Default initial state
const DEFAULT_STATE: WizardState = {
  step: 1,
  showingResults: false,
  selectedGroups: [],
  dayOffDates: [],
  selectedShiftCategories: [],
  selectedShiftLengths: [],
  selectedShiftCodes: [],
  weights: {
    groupWeight: 1,
    daysWeight: 1,
    shiftWeight: 1,
    blocks5dayWeight: 0,
    blocks4dayWeight: 0,
    weekendWeight: 1,
    saturdayWeight: 1,
    sundayWeight: 1
  },
  subModes: {
    groupSelector: { viewMode: 'selection' },
    dateSelector: { showWeightView: false },
    shiftSelector: {
      mode: 'main',
      filterChoice: '',
      screen: 'main',
      selectedTab: ''
    },
    weekendPreferences: { activeTab: 'all' }
  },
  results: {
    sortBy: 'matchScore',
    sortDirection: 'desc',
    showFilterSummary: false
  }
};

// New utility functions that replace base64 encoding/decoding
// Simple function to get parameter from URL
const getParamFromUrl = (searchParams: URLSearchParams, key: string, defaultValue: any) => {
  const param = searchParams.get(key);
  if (param === null || param === undefined) return defaultValue;
  
  try {
    // Try to parse complex values
    if (param.startsWith('[') || param.startsWith('{')) {
      return JSON.parse(param);
    }
    
    // Parse numeric values
    if (!isNaN(Number(param)) && param !== '') {
      return Number(param);
    }
    
    // Parse boolean values
    if (param === 'true') return true;
    if (param === 'false') return false;
    
    // Return string value
    return param;
  } catch (e) {
    console.error(`Error parsing parameter ${key}:`, e);
    return defaultValue;
  }
};

// Function to restore state from URL parameters
const restoreStateFromUrl = (
  searchParams: URLSearchParams,
  defaultState: WizardState,
  transformers: { [key: string]: (value: any) => any } = {}
): WizardState => {
  const state = {...defaultState};
  
  // Common parameters
  state.step = getParamFromUrl(searchParams, 'step', defaultState.step);
  state.showingResults = getParamFromUrl(searchParams, 'showingResults', defaultState.showingResults);
  
  // Try to get other fields directly
  const possibleFields = [
    'selectedGroups', 'selectedShiftCategories', 'selectedShiftLengths', 
    'selectedShiftCodes', 'returnPath'
  ];
  
  possibleFields.forEach(field => {
    const value = getParamFromUrl(searchParams, field, defaultState[field as keyof WizardState]);
    if (value !== undefined) {
      state[field as keyof WizardState] = value;
    }
  });
  
  // Handle special transformations (like dates)
  if (searchParams.has('dayOffDates')) {
    const dates = getParamFromUrl(searchParams, 'dayOffDates', defaultState.dayOffDates);
    if (transformers.dayOffDates) {
      state.dayOffDates = transformers.dayOffDates(dates);
    } else {
      state.dayOffDates = dates;
    }
  }
  
  // Handle nested objects - results
  if (searchParams.has('sortBy')) {
    state.results = {
      ...state.results,
      sortBy: getParamFromUrl(searchParams, 'sortBy', defaultState.results?.sortBy)
    };
  }
  
  if (searchParams.has('sortDirection')) {
    state.results = {
      ...state.results,
      sortDirection: getParamFromUrl(searchParams, 'sortDirection', defaultState.results?.sortDirection)
    };
  }
  
  if (searchParams.has('showFilterSummary')) {
    state.results = {
      ...state.results,
      showFilterSummary: getParamFromUrl(searchParams, 'showFilterSummary', defaultState.results?.showFilterSummary)
    };
  }
  
  // Basic support for weights - just handle the top level ones
  ['groupWeight', 'daysWeight', 'shiftWeight', 'blocks5dayWeight', 'blocks4dayWeight',
   'weekendWeight', 'saturdayWeight', 'sundayWeight'].forEach(weightKey => {
    if (searchParams.has(weightKey)) {
      if (!state.weights) state.weights = {};
      state.weights[weightKey as keyof WizardState['weights']] = 
        getParamFromUrl(searchParams, weightKey, defaultState.weights?.[weightKey as keyof WizardState['weights']]);
    }
  });
  
  return state;
};

// Function to update URL with state without using base64
const updateUrlWithState = (state: WizardState) => {
  try {
    // Create a URL object from the current location
    const url = new URL(window.location.href);
    
    // Clean up existing parameters
    url.searchParams.delete('state'); // Remove any old encoded state
    
    // Add basic parameters
    url.searchParams.set('step', state.step.toString());
    url.searchParams.set('showingResults', state.showingResults.toString());
    
    // Add array values (in compressed form)
    if (state.selectedGroups?.length) {
      url.searchParams.set('selectedGroups', JSON.stringify(state.selectedGroups));
    }
    
    if (state.selectedShiftCategories?.length) {
      url.searchParams.set('selectedShiftCategories', JSON.stringify(state.selectedShiftCategories));
    }
    
    if (state.selectedShiftLengths?.length) {
      url.searchParams.set('selectedShiftLengths', JSON.stringify(state.selectedShiftLengths));
    }
    
    if (state.selectedShiftCodes?.length) {
      url.searchParams.set('selectedShiftCodes', JSON.stringify(state.selectedShiftCodes));
    }
    
    // Handle dates specially - convert to ISO strings
    if (state.dayOffDates?.length) {
      const dateStrings = state.dayOffDates
        .filter(d => d instanceof Date && !isNaN(d.getTime()))
        .map(d => d.toISOString());
      url.searchParams.set('dayOffDates', JSON.stringify(dateStrings));
    }
    
    // Add results info
    if (state.results?.sortBy) {
      url.searchParams.set('sortBy', state.results.sortBy);
    }
    
    if (state.results?.sortDirection) {
      url.searchParams.set('sortDirection', state.results.sortDirection);
    }
    
    if (state.results?.showFilterSummary !== undefined) {
      url.searchParams.set('showFilterSummary', state.results.showFilterSummary.toString());
    }
    
    // Add essential weight values
    if (state.weights) {
      Object.entries(state.weights).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, value.toString());
        }
      });
    }
    
    // Preserve the return path if we have one
    if (state.returnPath) {
      url.searchParams.set('returnPath', state.returnPath);
    }
    
    // Update browser history
    window.history.replaceState({}, '', url);
  } catch (error) {
    console.error("Error updating URL with state:", error);
  }
};

// Create the provider component
export const WizardStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  
  // Used to prevent infinite loops
  const stateUpdating = useRef(false);
  const hasInitialized = useRef(false);

  // Initialize state from URL on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    
    try {
      // Use our new helper function for state restoration
      const restoredState = restoreStateFromUrl(
        searchParams,
        DEFAULT_STATE,
        {
          // Transform dates properly
          dayOffDates: (dates) => {
            if (!Array.isArray(dates)) return [];
            
            return dates
              .map(date => {
                try {
                  if (typeof date === 'string') {
                    return new Date(date);
                  }
                  return date instanceof Date ? date : new Date(date);
                } catch (e) {
                  console.error("Invalid date in URL state:", date);
                  return null;
                }
              })
              .filter(Boolean) as Date[];
          }
        }
      );
      
      // Handle missing returnPath when navigating from other pages
      if (restoredState.returnPath === undefined && pathname) {
        restoredState.returnPath = pathname;
      }
      
      console.log("WizardState: Restored state from URL:", restoredState);
      
      // CRITICAL FIX: Ensure showingResults is properly respected and doesn't override step
      if (restoredState.step !== undefined && restoredState.showingResults === undefined) {
        // If we have a step but no showingResults, default to not showing results
        restoredState.showingResults = false;
      }
      
      // Apply restored state
      setState(restoredState);
      console.log("WizardState: Applied URL state to component");
    } catch (error) {
      console.error("WizardState: Error initializing from URL:", error);
    }
    
    hasInitialized.current = true;
  }, [searchParams, pathname]);

  // Function to update the state
  const updateState = (newState: Partial<WizardState>) => {
    setState(prevState => {
      // Create updated state
      const updatedState = { ...prevState, ...newState };
      
      // TEMPORARILY DISABLED - Use setTimeout to avoid race conditions when updating URL
      // setTimeout(() => {
      //   if (!stateUpdating.current) {
      //     stateUpdating.current = true;
      //     updateUrlWithState(updatedState);
      //     setTimeout(() => {
      //       stateUpdating.current = false;
      //     }, 500);
      //   }
      // }, 200);
      
      return updatedState;
    });
  };

  // Function to update nested properties
  const updateNestedState = <K extends keyof WizardState>(
    key: K,
    value: Partial<WizardState[K]>
  ) => {
    setState(prevState => {
      // Handle properly typed nested update
      const updatedState = {
        ...prevState,
        [key]: {
          ...(prevState[key] as any || {}),
          ...value
        }
      };
      
      // TEMPORARILY DISABLED - Use setTimeout to avoid race conditions
      // setTimeout(() => {
      //   if (!stateUpdating.current) {
      //     stateUpdating.current = true;
      //     updateUrlWithState(updatedState);
      //     setTimeout(() => {
      //       stateUpdating.current = false;
      //     }, 500);
      //   }
      // }, 200);
      
      return updatedState;
    });
  };

  // Function to manually sync state to URL
  const syncToUrl = () => {
    updateUrlWithState(state);
  };

  return (
    <WizardStateContext.Provider value={{ 
      state, 
      updateState,
      updateNestedState,
      syncToUrl
    }}>
      {children}
    </WizardStateContext.Provider>
  );
};

// Custom hook to use the context
export const useWizardState = () => {
  const context = useContext(WizardStateContext);
  if (!context) {
    throw new Error('useWizardState must be used within a WizardStateProvider');
  }
  return context;
};