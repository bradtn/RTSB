import { useEffect, useRef, useCallback } from 'react';

export default function useHashNavigation({
  isReady,
  step,
  showingResults,
  setStep,
  setShowingResults,
  onGroupViewModeChange,
  onDateViewModeChange,
  onShiftModeChange, 
  onWeekendTabChange,
  batchOperationInProgress
}) {
  const hashBeingProcessed = useRef(false);
  
  // Navigate to a section with optional subsection
  const navigateToSection = useCallback((section, subsection = null) => {
    // Don't set the ref as it can lead to blocking
    // Just change the hash directly
    let hash = section;
    if (subsection) {
      hash += `/${subsection}`;
    }
    
    window.location.hash = hash;
  }, []);
  
  // Handle hash changes
  useEffect(() => {
    if (!isReady) return;
    
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      console.log("Hash changed:", hash);
      
      // Skip if a batch operation is in progress
      if (batchOperationInProgress && batchOperationInProgress.current) {
        console.log("Skipping hash handling due to batch operation");
        return;
      }
      
      try {
        // Parse hash - format can be either "section" or "section/subsection"
        const [mainSection, subSection] = hash.split('/');
        
        // Process main section navigation
        if (mainSection === 'results') {
          if (!showingResults) {
            console.log("Setting showingResults based on hash");
            setShowingResults(true);
          }
        } else {
          // If we're showing results but hash is not 'results', go back to filter view
          if (showingResults) {
            console.log("Hiding results based on hash");
            setShowingResults(false);
          }
          
          // Map hash to step
          let newStep;
          if (mainSection === 'groups' || mainSection === '') newStep = 1;
          else if (mainSection === 'dates') newStep = 2;
          else if (mainSection === 'shifts') newStep = 3;
          else if (mainSection === 'stretches') newStep = 4;
          else if (mainSection === 'weekends') newStep = 5;
          
          if (newStep && newStep !== step) {
            console.log("Setting step based on hash:", newStep);
            setStep(newStep);
          }
        }
        
        // Process subsection navigation if present
        if (subSection && subSection.length > 0) {
          console.log("Processing subsection:", subSection);
          
          // Update subModes based on the current section and subsection
          switch (mainSection) {
            case 'groups':
              if (onGroupViewModeChange) onGroupViewModeChange(subSection);
              break;
              
            case 'dates':
              if (onDateViewModeChange) onDateViewModeChange(subSection === 'calendar');
              break;
              
            case 'shifts':
              if (onShiftModeChange) {
                // Parse shift subsections
                const shiftParts = subSection.split('/');
                
                if (shiftParts.length > 1) {
                  onShiftModeChange(shiftParts[0], shiftParts[1], { 
                    screen: shiftParts[0],
                    selectedTab: shiftParts[1]
                  });
                } else {
                  onShiftModeChange(subSection, '', { screen: subSection });
                }
              }
              break;
              
            case 'weekends':
              if (onWeekendTabChange) onWeekendTabChange(subSection);
              break;
          }
        }
      } catch (error) {
        console.error("Error processing hash change:", error);
      }
    };
    
    // Set initial hash if needed
    if (!window.location.hash && !showingResults) {
      window.location.hash = 'groups';
    }
    
    // Handle initial hash on mount
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [
    isReady, step, showingResults, setStep, setShowingResults,
    onGroupViewModeChange, onDateViewModeChange, onShiftModeChange, 
    onWeekendTabChange, batchOperationInProgress
  ]);
  
  // We'll remove this effect which can cause issues
  // Let the components that change state handle their own hash updates
  
  return {
    navigateToSection,
    navigateToSubsection: (section, subsection) => navigateToSection(section, subsection)
  };
}