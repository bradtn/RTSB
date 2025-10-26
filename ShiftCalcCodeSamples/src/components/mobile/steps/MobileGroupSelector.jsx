// src/components/mobile/steps/MobileGroupSelector.jsx
import React, { useEffect, useCallback, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useFilter } from '@/contexts/FilterContext';

export default function MobileGroupSelector({ 
  selectedGroups: propSelectedGroups, 
  setSelectedGroups: propSetSelectedGroups, 
  groupWeight: propGroupWeight, 
  setGroupWeight: propSetGroupWeight, 
  availableGroups = [],
  onNext,
  onBack,
  initialViewMode = 'selection',
  onViewModeChange = () => {},
  showProgress = false,
  isCompactView = false
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { navigateToSection, navigateToSubsection } = useFilter();
  
  // Use props directly - no localStorage dependency
  const selectedGroups = propSelectedGroups || [];
  const groupWeight = propGroupWeight ?? 1;
  
  // Local state for view mode
  const [showImportanceScreen, setShowImportanceScreen] = useState(initialViewMode === 'importance');
  
  // Debug logging
  useEffect(() => {
    console.log("MobileGroupSelector mounted with view mode:", initialViewMode);
    console.log("Showing importance screen:", showImportanceScreen);
  }, [initialViewMode]);
  
  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash.startsWith('groups/')) {
        const subView = hash.split('/')[1];
        if (subView === 'selection') {
          setShowImportanceScreen(false);
        } else if (subView === 'importance') {
          setShowImportanceScreen(true);
        }
      }
    };
    
    handleHashChange(); // Handle initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Notify parent when view mode changes
  useEffect(() => {
    // Call the view mode change callback
    onViewModeChange(showImportanceScreen ? 'importance' : 'selection');
  }, [showImportanceScreen, onViewModeChange]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') onNext?.();
    if (e.key === 'ArrowLeft' && onBack) onBack();
  }, [onNext, onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // Update group selection
  const handleGroupSelection = (group) => {
    const updatedGroups = selectedGroups.includes(group)
      ? selectedGroups.filter(g => g !== group)
      : [...selectedGroups, group];
    
    // Update through props
    propSetSelectedGroups(updatedGroups);
  };
  
  // Update weight value
  const handleWeightChange = (weight) => {
    // Update through props
    propSetGroupWeight(weight);
  };
  
  // Toggle between selection and importance views
  const handleViewModeChange = (showImportance) => {
    // Update local state
    setShowImportanceScreen(showImportance);
    
    // Update URL hash
    navigateToSubsection('groups', showImportance ? 'importance' : 'selection');
  };
  
  // Handle navigation to next step
  const handleNext = () => {
    // If no groups selected, prevent navigation
    if (selectedGroups.length === 0) return;
    
    // If on selection screen, just go to importance screen
    if (!showImportanceScreen) {
      handleViewModeChange(true);
      return;
    }
    
    // Otherwise proceed to next step
    if (onNext) onNext();
  };
  
  // Determine padding and spacing based on compact view
  const headerPadding = isCompactView ? 'p-2' : 'p-3';
  const sectionMargin = isCompactView ? 'mb-1.5' : 'mb-2';
  const contentPadding = isCompactView ? 'pt-1 pb-24' : 'pt-2 pb-28';
  const buttonPadding = isCompactView ? 'py-2' : 'py-3';
  
  // Debug output
  console.log("Rendering MobileGroupSelector", { showImportanceScreen, selectedGroups, groupWeight });
  
  return (
    <div className="h-full flex flex-col">
      {/* Content container with scrollable area */}
      <div className={`flex-1 overflow-y-auto px-2 pt-2 ${contentPadding}`}>
        {/* Top section - fixed height with minimal spacing */}
        <div className="flex-none">
          {/* Only show progress if showProgress prop is true */}
          {showProgress && (
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
              <span>Step 1 of 5</span>
              <span>20%</span>
            </div>
          )}

          {/* Fixed blue header styling to be consistent in both themes */}
          <div className={`${theme === 'dark' ? 'bg-blue-900/80' : 'bg-blue-100'} rounded-lg ${headerPadding} ${sectionMargin}`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-blue-100' : 'text-blue-800'}`}>
              Which work operations would you prefer?
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-blue-200' : 'text-blue-600'}`}>
              Select one or more options
            </p>
          </div>

          {/* Explanation box - only show if not in compact view or if in selection mode */}
          {(!isCompactView || !showImportanceScreen) && (
            <div className={`${theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100'} p-2 rounded-lg ${sectionMargin}`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Your selection affects the types of schedules you'll see.
              </p>
            </div>
          )}
        </div>

        {/* Middle section - flexible grow with proper spacing */}
        <div className="flex-grow overflow-y-auto">
          {!showImportanceScreen ? (
            <>
              {/* Group buttons with improved vertical spacing */}
              <div className="grid grid-cols-3 gap-1.5 mb-3 mt-1">
                {availableGroups.map(group => (
                  <button
                    key={group}
                    onClick={() => handleGroupSelection(group)}
                    className={`${buttonPadding} rounded-lg text-center text-xs transition-all duration-200 
                      ${selectedGroups.includes(group)
                        ? (theme === 'dark' ? "bg-blue-600 text-white shadow" : "bg-blue-500 text-white shadow")
                        : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")}`}
                  >
                    {group}
                  </button>
                ))}
              </div>
              
              {/* Warning message for selection */}
              {selectedGroups.length === 0 && (
                <div className={`mt-2 mb-4 p-2 ${theme === 'dark' ? 'bg-yellow-900/20 border-l-2 border-yellow-600 rounded-lg' : 'bg-yellow-50 border-l-2 border-yellow-400 rounded-lg'}`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    Select at least one group to continue.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Importance selection view with improved layout for mobile */}
              <div className="flex flex-col space-y-2 mt-1">
                {/* Selected groups display */}
                <div className={`${theme === 'dark' ? 'bg-gray-800/90' : 'bg-gray-100'} p-2.5 rounded-lg`}>
                  <p className={`${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} font-medium mb-1.5 text-sm`}>
                    Your selected groups:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedGroups.map(group => (
                      <span 
                        key={group} 
                        className={`${theme === 'dark' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-500 text-white'} 
                          px-2.5 py-1 rounded-full text-xs font-medium`}
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Importance options with better visual hierarchy */}
                <div className="space-y-1.5">
                  {[
                    { label: "Not Important", desc: "Other criteria matter more", value: 0 },
                    { label: "Somewhat Important", desc: "Slight preference", value: 1.5 },
                    { label: "Important", desc: "Strong preference", value: 3 },
                    { label: "Essential", desc: "Only these groups", value: 5 },
                  ].map(({ label, desc, value }) => (
                    <button 
                      key={value}
                      onClick={() => handleWeightChange(value)}
                      className={`w-full ${isCompactView ? 'p-2' : 'p-2.5'} rounded-lg text-left flex justify-between items-center transition-all duration-200
                        ${Number(groupWeight) === Number(value) 
                          ? (theme === 'dark' 
                              ? "bg-blue-600 text-white ring-1 ring-blue-400" 
                              : "bg-blue-500 text-white ring-1 ring-blue-300")
                          : (theme === 'dark' 
                              ? "bg-gray-700/80 text-gray-100 hover:bg-gray-600/80" 
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300")}`}
                    >
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs opacity-80">{desc}</div>
                      </div>
                      {Number(groupWeight) === Number(value) && (
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-blue-400' : 'bg-white'}`}>
                          <svg className={`h-3 w-3 ${theme === 'dark' ? 'text-blue-900' : 'text-blue-600'}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
      
      {/* Bottom section - fixed at viewport bottom */}
      <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
          <div className="flex flex-col gap-2">
            {showImportanceScreen ? (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewModeChange(false)}
                    className={`flex-1 ${theme === 'dark' 
                      ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                      ${buttonPadding} rounded-lg font-medium`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className={`flex-1 ${theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-500 text-white"} 
                      ${buttonPadding} rounded-lg font-medium`}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleNext}
                  disabled={selectedGroups.length === 0}
                  className={`w-full ${
                    selectedGroups.length === 0
                      ? (theme === 'dark' ? "bg-gray-500 text-gray-300" : "bg-gray-300 text-gray-500")
                      : (theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-500 text-white")
                  } ${buttonPadding} rounded-lg font-medium`}
                >
                  Next
                </button>
              </>
            )}
            {/* Cancel button at bottom - matching who's working style */}
            {onBack && (
              <button
                onClick={onBack}
                className={`w-full ${theme === 'dark' 
                  ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                  ${buttonPadding} rounded-lg font-medium`}
              >
                Cancel
              </button>
            )}
          </div>
      </div>
    </div>
  );
}