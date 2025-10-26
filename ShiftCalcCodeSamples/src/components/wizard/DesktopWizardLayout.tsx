// src/components/wizard/DesktopWizardLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useFilter } from '@/contexts/FilterContext';
import ModeToggle from '@/components/common/ModeToggle';
import { InterfaceMode } from '@/utils/useInterfaceMode';
import DesktopStepNavigator from './DesktopStepNavigator';
import DesktopResults from './DesktopResults';
import DesktopResultsLoadingView from './DesktopLoadingView';
import SelectionsSummary from './SelectionsSummary';

interface DesktopWizardLayoutProps {
  onModeChange: (mode: InterfaceMode) => void;
  currentMode: InterfaceMode;
  currentHash?: string;
}

export default function DesktopWizardLayout({ 
  onModeChange, 
  currentMode,
  currentHash = ''
}: DesktopWizardLayoutProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { 
    showingResults, 
    filteredSchedules: schedules, 
    backToFilters: onFilterAgain, 
    resetFilters: onResetFilters, 
    parsedCriteria: appliedCriteria,
    reapplyFilters: onReapplyFilters,
    filtersAppliedRef,
    resultsSortState,
    onResultsStateChange,
    isSyncing = false,
    step,
    setStep,
    setShowingResults,
    navigateToSection,
    navigateToSubsection
  } = useFilter();
  
  // Add a loading state for results
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const isHandlingHash = useRef(false);
  
  // Add a reset key for the shifts component
  const [shiftsResetKey, setShiftsResetKey] = useState(Date.now());

  // Watch for changes to showingResults
  useEffect(() => {
    if (showingResults) {
      // When transitioning to results, show loading first
      setIsLoadingResults(true);
      
      // After a delay, hide loading and show actual results
      const timer = setTimeout(() => {
        setIsLoadingResults(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [showingResults]);
  
  // Handle refresh results with loading state
  const handleReapplyFilters = () => {
    setIsLoadingResults(true);
    
    // After a delay, refresh results and hide loading
    setTimeout(() => {
      onReapplyFilters();
      setIsLoadingResults(false);
    }, 2000);
  };
  
  // Helper function to get step-specific content
  const getStepTitle = () => {
    // Derive current UI step from the hash or the step state
    let currentStep = step;
    
    if (currentHash) {
      if (currentHash === 'groups') currentStep = 1;
      else if (currentHash === 'dates') currentStep = 2;
      else if (currentHash === 'shifts') currentStep = 3;
      else if (currentHash === 'stretches') currentStep = 4;
      else if (currentHash === 'weekends') currentStep = 5;
    }
    
    switch(currentStep) {
      case 1: return 'Work Group Selection';
      case 2: return 'Days Off Selection';
      case 3: return 'Shift Types Selection';
      case 4: return 'Work Stretches'; 
      case 5: return 'Weekend Preferences';
      default: return 'Filter Selection';
    }
  };
  
  const getStepDescription = () => {
    // Derive current UI step from the hash or the step state
    let currentStep = step;
    
    if (currentHash) {
      if (currentHash === 'groups') currentStep = 1;
      else if (currentHash === 'dates') currentStep = 2;
      else if (currentHash === 'shifts') currentStep = 3;
      else if (currentHash === 'stretches') currentStep = 4;
      else if (currentHash === 'weekends') currentStep = 5;
    }
    
    switch(currentStep) {
      case 1: return 'Selecting work groups helps find schedules that align with your team preferences.';
      case 2: return 'Choose your preferred days off to find matching schedules.';
      case 3: return 'Select shift types that work best for your schedule.';
      case 4: return 'Set your preferences for consecutive work days.';
      case 5: return 'Set your preferences for weekend work schedules.';
      default: return 'Configure your preferences to find the best schedule match.';
    }
  };
  
  // Handle section edit with specific subsections
  const handleSectionEdit = (section, options = {}) => {
    // Special handling for shifts to force a reset when needed
    if (section === 'shifts' && options?.resetToMain) {
      // Force component remount by changing the key
      setShiftsResetKey(Date.now());
      // Navigate to the main subsection for shifts
      navigateToSubsection('shifts', 'main');
      return;
    }
    
    // Navigate to specific subsections for each module
    switch(section) {
      case 'groups':
        navigateToSubsection('groups', 'selection');
        break;
      case 'dates':
        navigateToSubsection('dates', 'calendar');
        break;
      case 'shifts':
        navigateToSubsection('shifts', 'main');
        break;
      case 'stretches':
        navigateToSubsection('stretches', '5day');
        break;
      case 'weekends':
        navigateToSubsection('weekends', 'all');
        break;
      default:
        navigateToSection(section);
    }
  };
  
  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Minimal header with just mode toggle and sync indicator */}
      <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex justify-end items-center gap-4`}>
        {/* Sync indicator */}
        <div className="flex items-center bg-opacity-75 px-2 py-1 rounded-full">
          <div className={`w-2 h-2 ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'} rounded-full mr-1.5`}></div>
          <span className={`text-xs ${isSyncing ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') : (theme === 'dark' ? 'text-green-400' : 'text-green-600')}`}>
            {isSyncing ? 'Syncing' : 'Synced'}
          </span>
        </div>
        
        {/* Mode toggle */}
        <ModeToggle
          currentMode={currentMode}
          onChange={onModeChange}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className={`w-1/4 h-full overflow-auto ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} p-4 space-y-4`}>
          {/* Step-specific info */}
          {(!showingResults && currentHash !== 'results') && (
            <div className={`rounded-lg p-5 shadow-md ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <h3 className={`font-bold text-lg ${styles.textPrimary}`}>
                {getStepTitle()}
              </h3>
              <p className={`mb-3 ${styles.textSecondary}`}>
                {getStepDescription()}
              </p>
              
              {(currentHash === 'groups' || (!currentHash && step === 1)) && (
                <div className={`${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-blue-500' : 'border-blue-400'}`}>
                  <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Pro Tips</h4>
                  <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'} text-sm space-y-1`}>
                    <li>Select multiple groups to see more options</li>
                    <li>Set importance to "Essential" if you must be in these groups</li>
                    <li>Lower importance if you're flexible</li>
                    <li>Groups often represent teams or departments</li>
                    <li>Some groups may have better schedules than others</li>
                  </ul>
                </div>
              )}
              
              {(currentHash === 'dates' || (!currentHash && step === 2)) && (
                <div className={`${theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-purple-500' : 'border-purple-400'}`}>
                  <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>Pro Tips</h4>
                  <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-purple-200' : 'text-purple-800'} text-sm space-y-1`}>
                    <li>Select specific dates you need off</li>
                    <li>Use date ranges for vacations</li>
                    <li>Higher importance means greater priority</li>
                    <li>Consider holidays and special events</li>
                    <li>Being flexible increases your schedule options</li>
                  </ul>
                </div>
              )}
              
              {(currentHash === 'shifts' || (!currentHash && step === 3)) && (
                <div className={`${theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-orange-500' : 'border-orange-400'}`}>
                  <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-700'}`}>Pro Tips</h4>
                  <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-orange-200' : 'text-orange-800'} text-sm space-y-1`}>
                    <li>Choose shift types that match your lifestyle</li>
                    <li>Select shift length (8, 10, or 12 hours)</li>
                    <li>Consider commute times and personal schedule</li>
                    <li>Morning people should prefer early shifts</li>
                    <li>Night owls might prefer evening shifts</li>
                  </ul>
                </div>
              )}
              
              {(currentHash === 'stretches' || (!currentHash && step === 4)) && (
                <div className={`${theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-green-500' : 'border-green-400'}`}>
                  <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>Pro Tips</h4>
                  <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-green-200' : 'text-green-800'} text-sm space-y-1`}>
                    <li>4-day blocks give you longer weekends</li>
                    <li>5-day blocks match traditional workweeks</li>
                    <li>Consider family and social commitments</li>
                    <li>Longer blocks often mean longer time off</li>
                    <li>Pick what works best for your lifestyle</li>
                  </ul>
                </div>
              )}
              
              {(currentHash === 'weekends' || (!currentHash && step === 5)) && (
                <div className={`${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'} p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'border-red-500' : 'border-red-400'}`}>
                  <h4 className={`font-medium mb-1 ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>Pro Tips</h4>
                  <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-red-200' : 'text-red-800'} text-sm space-y-1`}>
                    <li>Set preferences for Saturday and Sunday separately</li>
                    <li>Weekend shifts often have differential pay</li>
                    <li>Consider religious or family commitments</li>
                    <li>Some prefer weekends to have social time</li>
                    <li>Being flexible here can open up better schedules</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {/* Persistent selections summary */}
          <SelectionsSummary 
            resultsCount={schedules?.length}
            onFilterAgain={() => navigateToSection('groups')}
            onResetFilters={onResetFilters}
            onReapplyFilters={handleReapplyFilters}
            onSectionEdit={handleSectionEdit}
          />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 h-full overflow-auto">
          {(showingResults || currentHash === 'results') && isLoadingResults ? (
            <DesktopResultsLoadingView scheduleCount={schedules?.length || 0} />
          ) : (showingResults || currentHash === 'results') ? (
            <DesktopResults />
          ) : (
            <DesktopStepNavigator shiftsResetKey={shiftsResetKey} />
          )}
        </div>
      </div>
    </div>
  );
}