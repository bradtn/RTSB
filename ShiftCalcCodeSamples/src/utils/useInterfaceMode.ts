// src/utils/useInterfaceMode.ts
// Handles storing and retrieving the user's interface preference (wizard vs advanced mode)

import { useState, useEffect } from 'react';

// Define the available interface modes
export type InterfaceMode = 'wizard' | 'advanced';

// Custom hook to manage interface mode preference
export default function useInterfaceMode() {
  // Initialize with null to detect first render
  const [mode, setMode] = useState<InterfaceMode | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
  
  // Load the preference from localStorage on mount
  useEffect(() => {
    // Check if this is the first visit
    const firstVisitCheck = localStorage.getItem('shiftbid-first-visit');
    
    if (firstVisitCheck === null) {
      // This is the first visit - default to wizard mode
      localStorage.setItem('shiftbid-first-visit', 'false');
      localStorage.setItem('shiftbid-ui-mode', 'wizard');
      setIsFirstVisit(true);
      setMode('wizard');
    } else {
      // Not first visit - load saved preference or default to wizard
      const savedMode = localStorage.getItem('shiftbid-ui-mode');
      setMode((savedMode === 'advanced' ? 'advanced' : 'wizard') as InterfaceMode);
    }
  }, []);
  
  // Function to change the mode
  const changeMode = (newMode: InterfaceMode) => {
    localStorage.setItem('shiftbid-ui-mode', newMode);
    setMode(newMode);
  };
  
  return {
    mode,
    isFirstVisit,
    changeMode,
    isLoading: mode === null,
    isWizardMode: mode === 'wizard',
    isAdvancedMode: mode === 'advanced'
  };
}