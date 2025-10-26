// src/components/wizard/steps/DesktopGroupSelector.tsx
import React, { useEffect, useCallback, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useWizardState } from '@/contexts/WizardStateContext';
import { useFilter } from '@/contexts/FilterContext';
import { motion } from 'framer-motion';

interface DesktopGroupSelectorProps {
  selectedGroups: string[];
  setSelectedGroups: (groups: string[]) => void;
  groupWeight: number;
  setGroupWeight: (weight: number) => void;
  availableGroups: string[];
  onNext: () => void;
  onBack?: () => void;
  initialViewMode?: string;
  onViewModeChange?: (mode: string) => void;
  showProgress?: boolean;
}

export default function DesktopGroupSelector(props: DesktopGroupSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { state, updateState, updateNestedState } = useWizardState();
  const { navigateToSection, navigateToSubsection } = useFilter();
  
  // Use props for backward compatibility but prefer context state
  const selectedGroups = props.selectedGroups || state.selectedGroups || [];
  const groupWeight = props.groupWeight ?? state.weights?.groupWeight ?? 1;
  const availableGroups = props.availableGroups || [];
  
  // Initial view mode from props or context
  const initialViewMode = props.initialViewMode || state.subModes?.groupSelector?.viewMode || 'selection';
  const [showImportanceScreen, setShowImportanceScreen] = useState(initialViewMode === 'importance');

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

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') props.onNext?.();
    if (e.key === 'ArrowLeft' && props.onBack) props.onBack();
  }, [props.onNext, props.onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update context when selections change
  const handleGroupSelection = (group: string) => {
    const updatedGroups = selectedGroups.includes(group)
      ? selectedGroups.filter(g => g !== group)
      : [...selectedGroups, group];
    
    // Update through props for backward compatibility
    props.setSelectedGroups(updatedGroups);
    
    // Update context state
    updateState({ selectedGroups: updatedGroups });
  };

  // Update weight in context and via props
  const handleWeightChange = (weight: number) => {
    props.setGroupWeight(weight);
    
    // Update nested weights in context
    updateNestedState('weights', { groupWeight: weight });
  };

  // View mode change handler
  const handleViewModeChange = (mode: boolean) => {
    setShowImportanceScreen(mode);
    
    // Update URL hash based on view
    navigateToSubsection('groups', mode ? 'importance' : 'selection');
    
    // Update context
    updateNestedState('subModes', { 
      groupSelector: { viewMode: mode ? 'importance' : 'selection' } 
    });
    
    // Call prop callback if available
    if (props.onViewModeChange) {
      props.onViewModeChange(mode ? 'importance' : 'selection');
    }
  };

  const importanceOptions = [
    { value: 0, label: 'Not Important', description: 'Nice to have but not required' },
    { value: 1.5, label: 'Somewhat Important', description: 'Prefer these groups when possible' },
    { value: 3, label: 'Important', description: 'Strongly prefer these groups' },
    { value: 5, label: 'Essential', description: 'Must be in these groups' },
  ];

  return (
    <div className="h-full">
      <motion.div
        key={`step-1-${showImportanceScreen ? 'importance' : 'selection'}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md h-full flex flex-col overflow-hidden`}
      >
        {!showImportanceScreen ? (
          <>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Select Work Groups</h2>
            {/* Scrollable container for buttons */}
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 pb-4">
              <div className="grid grid-cols-1 gap-3">
                {availableGroups.map(group => (
                  <motion.button
                    key={group}
                    onClick={() => handleGroupSelection(group)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-4 text-base font-medium rounded-lg transition-all
                      ${selectedGroups.includes(group) 
                        ? 'bg-blue-600 text-white' 
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {group}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-4 pt-2 border-t border-gray-700">
              {props.onBack && (
                <button 
                  onClick={props.onBack} 
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </button>
              )}
              <div className="flex-grow"></div>
              <button 
                onClick={() => handleViewModeChange(true)} 
                className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>How important are these work groups to you?</h2>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
              <div className="grid grid-cols-1 gap-3">
                {importanceOptions.map(opt => (
                  <motion.button
                    key={opt.value}
                    onClick={() => handleWeightChange(opt.value)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-3 rounded-lg text-left transition-colors relative overflow-hidden
                      ${groupWeight === opt.value
                        ? theme === 'dark' 
                          ? 'bg-green-600 text-white'
                          : 'bg-green-500 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    <div className="flex flex-col pr-8">
                      <span className="text-base font-medium">{opt.label}</span>
                      <span className="text-xs opacity-80 mt-1">{opt.description}</span>
                    </div>
                    
                    {groupWeight === opt.value && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-4 pt-2 border-t border-gray-700">
              <button 
                onClick={() => handleViewModeChange(false)} 
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back
              </button>
              <div className="flex-grow"></div>
              <button 
                onClick={props.onNext} 
                className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md"
              >
                Next
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}