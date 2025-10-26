// src/components/wizard/steps/DesktopShiftSelector.tsx
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useWizardState } from "@/contexts/WizardStateContext"; 
import { useFilter } from "@/contexts/FilterContext";
import { motion, AnimatePresence } from "framer-motion";

interface ShiftCode {
  id?: string;
  code: string;
  display?: string;
  category?: string;
  length?: string;
  startTime?: string;
  endTime?: string;
}

interface DesktopShiftSelectorProps {
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedLengths: string[];
  setSelectedLengths: (lengths: string[]) => void;
  selectedCodes: string[];
  setSelectedCodes: (codes: string[]) => void;
  shiftWeight: number;
  setShiftWeight: (weight: number) => void;
  shiftCategoryIntent: string;
  setShiftCategoryIntent: (intent: string) => void;
  shiftCodes: ShiftCode[];
  onNext: () => void;
  onBack?: () => void;
  initialMode?: string;
  initialFilterChoice?: string;
  initialScreen?: string;
  initialSelectedTab?: string;
  onModeChange?: (mode: string, filter?: string, extras?: any) => void;
}

export default function DesktopShiftSelector({
  selectedCategories,
  setSelectedCategories,
  selectedLengths,
  setSelectedLengths,
  selectedCodes,
  setSelectedCodes,
  shiftWeight,
  setShiftWeight,
  shiftCategoryIntent,
  setShiftCategoryIntent,
  shiftCodes,
  onNext,
  onBack,
  initialMode = 'main',
  initialFilterChoice = '',
  initialScreen = '',
  initialSelectedTab = '',
  onModeChange = () => {}
}: DesktopShiftSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { state, updateState, updateNestedState } = useWizardState();
  const { navigateToSection, navigateToSubsection } = useFilter();
  
  // Get unique categories from shift codes
  const categories = [...new Set(shiftCodes.map(code => code.category))]
    .filter(c => c && c !== "Unknown")
    .sort();
  
  // Get unique lengths from shift codes
  const lengths = [...new Set(shiftCodes.map(code => code.length))]
    .filter(l => l && l !== "Unknown")
    .sort();

  // Use context state if available, otherwise props
  const contextCategories = state.selectedShiftCategories || [];
  const contextLengths = state.selectedShiftLengths || [];
  const contextCodes = state.selectedShiftCodes || [];
  const contextWeight = state.weights?.shiftWeight ?? 0;
  
  // Track if this is first render to force main screen
  const isFirstRender = useRef(true);
  
  // Selection mode states - always initialize to main view
  const [selectionMode, setSelectionMode] = useState('main');
  const [filterChoice, setFilterChoice] = useState('');
  const [currentScreen, setCurrentScreen] = useState('main');
  const [selectedTab, setSelectedTab] = useState('');
  
  // Initialize to main view on first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Always start with main view when first rendered
      setSelectionMode('main');
      setFilterChoice('');
      setCurrentScreen('main');
      setSelectedTab('');
      
      // Also update context to synchronize
      updateNestedState('subModes', {
        shiftSelector: {
          mode: 'main',
          filterChoice: '',
          screen: 'main',
          selectedTab: '',
          visited: false
        }
      });
    }
  }, []);
  
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
  
      // Handle both root and "main" subsection
      if (hash === 'shifts' || hash === 'shifts/main') {
        changeMode('main', '', 'main', '');
        return;
      }
  
      if (hash.startsWith('shifts/')) {
        const subsection = hash.split('/')[1];
        if (subsection) {
          // Map known subsections to view modes
          if (subsection === 'category') {
            changeMode('category', 'category', 'category', 'category');
          } else if (subsection === 'code') {
            changeMode('code', 'code', 'code', 'code');
          } else if (subsection === 'length') {
            changeMode('length', 'length', 'length', 'length');
          } else if (subsection === 'weight') {
            changeMode('weight', 'weight', 'weight', 'weight');
          }
        }
      }
    };
  
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
    
  // Refs to track previous values to prevent infinite updates
  const prevMode = useRef(selectionMode);
  const prevFilter = useRef(filterChoice);
  const prevScreen = useRef(currentScreen);
  const prevTab = useRef(selectedTab);
  
  // URL update debounce timeout ref
  const urlUpdateTimeoutRef = useRef(null);
  
  // Cleanup function for timeout
  useEffect(() => {
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, []);
  
  // Notify parent when mode changes - but only when values actually change
  useEffect(() => {
    if (prevMode.current !== selectionMode || 
        prevFilter.current !== filterChoice ||
        prevScreen.current !== currentScreen ||
        prevTab.current !== selectedTab) {
      
      prevMode.current = selectionMode;
      prevFilter.current = filterChoice;
      prevScreen.current = currentScreen;
      prevTab.current = selectedTab;
      
      // Cancel any pending updates
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
      
      // Debounce the context update
      urlUpdateTimeoutRef.current = setTimeout(() => {
        // Update context
        updateNestedState('subModes', {
          shiftSelector: {
            mode: selectionMode,
            filterChoice,
            screen: currentScreen,
            selectedTab,
            visited: true
          }
        });
        
        // Pass all state to parent
        onModeChange(selectionMode, filterChoice, {
          screen: currentScreen,
          selectedTab,
          visited: true
        });
        
        // Update hash for subsection navigation
        navigateToSubsection('shifts', selectionMode);
      }, 100);
    }
  }, [selectionMode, filterChoice, currentScreen, selectedTab, onModeChange, updateNestedState, navigateToSubsection]);
  
  // Helper to change both mode and filter choice with enhanced state tracking
  const changeMode = (mode: string, choice = filterChoice, screen = mode, tab = choice) => {
    setSelectionMode(mode);
    setFilterChoice(choice);
    setCurrentScreen(screen);
    setSelectedTab(tab);
    
    // Update hash when changing modes
    navigateToSubsection('shifts', mode);
  };
  
  // Update both local state and context
  const toggleCategory = (category: string) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    // Update via props
    setSelectedCategories(updatedCategories);
    
    // Update context with debounce
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      updateState({ selectedShiftCategories: updatedCategories });
    }, 100);
  };

  // Handle shift category intent changes
  const handleIntentChange = (intent: string) => {
    setShiftCategoryIntent(intent);
    
    // Update context with debounce
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      updateState({ shiftCategoryIntent: intent });
    }, 100);
  };
  
  const toggleLength = (length: string) => {
    const updatedLengths = selectedLengths.includes(length)
      ? selectedLengths.filter(l => l !== length)
      : [...selectedLengths, length];
    
    // Update via props
    setSelectedLengths(updatedLengths);
    
    // Update context with debounce
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      updateState({ selectedShiftLengths: updatedLengths });
    }, 100);
  };
  
  const toggleShiftCode = (code: string) => {
    const updatedCodes = selectedCodes.includes(code)
      ? selectedCodes.filter(c => c !== code)
      : [...selectedCodes, code];
    
    // Update via props
    setSelectedCodes(updatedCodes);
    
    // Update context with debounce
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      updateState({ selectedShiftCodes: updatedCodes });
    }, 100);
  };

  // Reset all selections
  const resetSelections = () => {
    // Update via props
    setSelectedCategories([]);
    setSelectedLengths([]);
    setSelectedCodes([]);
    
    // Update context with debounce
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      updateState({
        selectedShiftCategories: [],
        selectedShiftLengths: [],
        selectedShiftCodes: []
      });
      
      changeMode('main', '', 'main', '');
    }, 100);
  };

  // Helper function to handle weight changes with proper number conversion
  const handleSetShiftWeight = (value: number) => {
    // Update props
    if (typeof setShiftWeight === 'function') {
      setShiftWeight(Number(value));
    }
    
    // Update context with debounce
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    urlUpdateTimeoutRef.current = setTimeout(() => {
      updateNestedState('weights', { shiftWeight: Number(value) });
    }, 100);
  };

  // Check if any selections have been made
  const hasSelections = selectedCategories.length > 0 || selectedLengths.length > 0 || selectedCodes.length > 0;
  
  // This helper function is needed for the shift weight screen
  const getImportanceLabel = (weight: number) => {
    if (weight === undefined || weight === null || isNaN(weight)) {
      return { label: 'Not Set', color: theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600' };
    }
    
    const options = [
      { value: 0, label: 'Not Important', 
        color: theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-400 text-white' },
      { value: 1.5, label: 'Somewhat Important', 
        color: theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white' },
      { value: 3, label: 'Important', 
        color: theme === 'dark' ? 'bg-yellow-600 text-black' : 'bg-yellow-400 text-yellow-900' },
      { value: 5, label: 'Essential', 
        color: theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white' }
    ];
    
    const opt = options.find(o => o.value === weight);
    return opt ? opt : { label: 'Not Set', color: theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600' };
  };

  return (
    <div className="h-full">
      <div className={`h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
        <AnimatePresence mode="wait">
          {/* Main selection screen - Choice between time of day or specific codes */}
          {currentScreen === 'main' && (
            <motion.div 
              key="main-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Select Shift Types
              </h2>
              
              <div className="flex space-x-6">
                {/* Main content - 70% */}
                <div className="w-[70%] space-y-4">
                  <button
                    onClick={() => changeMode('category', 'category', 'category', 'category')}
                    className={`w-full rounded-lg ${theme === 'dark' ? 'bg-blue-100/10' : 'bg-blue-50'} border ${theme === 'dark' ? 'border-blue-800/30' : 'border-blue-100'} overflow-hidden transition-all hover:shadow-md`}
                  >
                    <div className="p-5 flex justify-between items-start">
                      <div>
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                          By Time of Day
                        </h3>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-blue-100' : 'text-blue-700'}`}>
                          Morning, Afternoon, Night shifts
                        </p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          <span className={`text-xs ${theme === 'dark' ? 'bg-blue-900/40 text-blue-100' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full`}>Mornings</span>
                          <span className={`text-xs ${theme === 'dark' ? 'bg-blue-900/40 text-blue-100' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full`}>Afternoons</span>
                          <span className={`text-xs ${theme === 'dark' ? 'bg-blue-900/40 text-blue-100' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full`}>Nights</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => changeMode('code', 'code', 'code', 'code')}
                    className={`w-full rounded-lg ${theme === 'dark' ? 'bg-purple-100/10' : 'bg-purple-50'} border ${theme === 'dark' ? 'border-purple-800/30' : 'border-purple-100'} overflow-hidden transition-all hover:shadow-md`}
                  >
                    <div className="p-5 flex justify-between items-start">
                      <div>
                        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                          By Specific Shift Code
                        </h3>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-purple-100' : 'text-purple-700'}`}>
                          Select exact shift codes
                        </p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          <span className={`text-xs ${theme === 'dark' ? 'bg-purple-900/40 text-purple-100' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>06BC</span>
                          <span className={`text-xs ${theme === 'dark' ? 'bg-purple-900/40 text-purple-100' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>13AC</span>
                          <span className={`text-xs ${theme === 'dark' ? 'bg-purple-900/40 text-purple-100' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>14AT</span>
                          <span className={`text-xs ${theme === 'dark' ? 'bg-purple-900/40 text-purple-100' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>19AR</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-full ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>
                
                {/* Info panel - 30% */}
                <div className="w-[30%]">
                  <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      About Shift Types
                    </h3>
                    
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                          Time of Day
                        </h4>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          Choose shifts by morning, afternoon, or night. Good for flexible schedule preferences.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                          Shift Codes
                        </h4>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          Choose specific shift codes if you know exactly which shifts you want.
                        </p>
                      </div>
                      
                      <div className={`mt-4 ${theme === 'dark' ? 'bg-yellow-900/20 border-l-4 border-yellow-600 rounded-r-lg' : 'bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg'} p-3`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                          You can also skip this step if you have no shift type preferences.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          // Update both local and context state
                          if (typeof setShiftWeight === 'function') {
                            setShiftWeight(0); // Set weight to 0 for "no preferences"
                          }
                          
                          // Debounce the update
                          if (urlUpdateTimeoutRef.current) {
                            clearTimeout(urlUpdateTimeoutRef.current);
                          }
                          
                          urlUpdateTimeoutRef.current = setTimeout(() => {
                            updateNestedState('weights', { shiftWeight: 0 });
                            onNext();
                          }, 100);
                        }}
                        className={`w-full px-4 py-2 text-center bg-blue-600 text-white hover:bg-blue-500 rounded-md font-medium`}
                      >
                        No Shift Preferences
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer Buttons */}
              <div className="flex justify-end mt-8">
                {onBack && (
                  <button
                    onClick={onBack}
                    className={`px-5 py-2 text-sm font-medium rounded-md ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 mr-3' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 mr-3'
                    }`}
                  >
                    Back
                  </button>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Time of Day selection screen - revised layout */}
          {currentScreen === 'category' && (
            <motion.div 
              key="category-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Select Shifts by Time of Day
              </h2>
              
              {/* Multi-category intent selector */}
              {selectedCategories.length > 1 && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50 border-blue-200'
                }`}>
                  <h4 className={`text-sm font-medium mb-3 ${
                    theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    When I select multiple shift types:
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="shiftIntent" 
                        value="any" 
                        checked={shiftCategoryIntent === 'any'}
                        onChange={(e) => handleIntentChange(e.target.value)}
                        className="mr-3 text-blue-600" 
                      />
                      <div>
                        <span className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-blue-100' : 'text-blue-800'
                        }`}>
                          I'm flexible - show lines with ANY of these shifts
                        </span>
                        <p className={`text-xs mt-1 ${
                          theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                        }`}>
                          A line with 100% Days would be perfect if I selected Days/Afternoons/Nights
                        </p>
                      </div>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        name="shiftIntent" 
                        value="mix" 
                        checked={shiftCategoryIntent === 'mix'}
                        onChange={(e) => handleIntentChange(e.target.value)}
                        className="mr-3 text-blue-600" 
                      />
                      <div>
                        <span className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-blue-100' : 'text-blue-800'
                        }`}>
                          I want variety - show lines with a MIX of these shifts
                        </span>
                        <p className={`text-xs mt-1 ${
                          theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                        }`}>
                          Only show lines that rotate between multiple selected shift types
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex space-x-6">
                <div className="w-[70%]">
                  <div className="grid grid-cols-1 gap-4">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`py-4 px-6 rounded-lg text-center transition-colors ${
                          selectedCategories.includes(category)
                            ? (theme === 'dark' ? "bg-blue-600 text-white font-medium" : "bg-blue-500 text-white font-medium")
                            : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="w-[30%]">
                  <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      Time of Day Preferences
                    </h3>
                    <div className={`mt-3 space-y-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <p className="text-sm">Select which time of day you prefer to work:</p>
                      <ul className="space-y-1 text-sm list-disc pl-5">
                        <li>Morning shifts typically start early</li>
                        <li>Afternoon shifts usually start midday</li>
                        <li>Night shifts cover evening and overnight hours</li>
                      </ul>
                      
                      {selectedCategories.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Your selections:</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCategories.map(cat => (
                              <span key={cat} className={`text-xs px-2.5 py-1 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-blue-900/50 text-blue-100 border border-blue-700/50' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => changeMode('main', '', 'main', '')}
                        className={`px-4 py-2 text-sm font-medium rounded-md border ${
                          theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
                        }`}
                      >
                        Back
                      </button>
                      
                      <button
                        onClick={() => changeMode('length', 'length', 'length', 'length')}
                        className={`px-4 py-2 text-white rounded-md font-medium ${
                          selectedCategories.length === 0
                            ? `${theme === 'dark' ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'}`
                            : `${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'}`
                        }`}
                        disabled={selectedCategories.length === 0}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Length Selection Screen - fixed back button */}
          {currentScreen === 'length' && (
            <motion.div 
              key="length-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Filter by Shift Length
              </h2>
              
              <div className="flex space-x-6">
                <div className="w-[70%]">
                  <div className="grid grid-cols-2 gap-4">
                    {lengths.map(length => (
                      <button
                        key={length}
                        onClick={() => toggleLength(length)}
                        className={`p-4 rounded-lg flex flex-col items-center justify-center ${
                          selectedLengths.includes(length)
                            ? (theme === 'dark' ? "bg-amber-600 text-white" : "bg-amber-500 text-white")
                            : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")
                        }`}
                      >
                        <span className="font-medium text-lg mb-1">{length.replace(' Hour Shift', 'h')}</span>
                        <span className="text-sm opacity-80">
                          Paid Hours
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="w-[30%]">
                  <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                      About Shift Lengths
                    </h3>
                    <div className={`mt-3 space-y-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <p className="text-sm">Different shift lengths offer different weekly schedules:</p>
                      <ul className="space-y-1 text-sm list-disc pl-5">
                        <li><span className="font-medium">8-hour shifts</span>: Traditional 5-day workweek</li>
                        <li><span className="font-medium">10-hour shifts</span>: Compressed 4-day workweek</li>
                        <li><span className="font-medium">12-hour shifts</span>: Fewer workdays, longer shifts</li>
                      </ul>
                      
                      <div className={`mt-4 ${theme === 'dark' ? 'bg-amber-900/20 border-l-4 border-amber-600 rounded-r-lg' : 'bg-amber-50 border-l-4 border-amber-400 rounded-r-lg'} p-3`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-amber-200' : 'text-amber-800'}`}>
                          Optional: You can skip this step if shift length doesn't matter to you.
                        </p>
                      </div>
                      
                      {selectedLengths.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Your selections:</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedLengths.map(len => (
                              <span key={len} className={`text-xs px-2.5 py-1 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-amber-900/50 text-amber-100 border border-amber-700/50' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {len}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => changeMode(filterChoice === 'category' ? 'category' : 'code', filterChoice, 
                          filterChoice === 'category' ? 'category' : 'code', filterChoice)}
                        className={`px-4 py-2 text-sm font-medium rounded-md border ${
                          theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
                        }`}
                      >
                        Back
                      </button>
                      
                      <button
                        onClick={() => changeMode('weight', 'weight', 'weight', 'weight')}
                        className={`px-4 py-2 ${theme === 'dark' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-amber-500 hover:bg-amber-600'} text-white rounded-md font-medium`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Weight setting screen - fixed back button */}
          {currentScreen === 'weight' && (
            <motion.div 
              key="weight-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <h2 className={`text-xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                How important are your shift preferences?
              </h2>
              
              <div className="flex space-x-6">
                <div className="w-[70%]">
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: 'Not Important', desc: 'Other criteria will determine results', value: 0 },
                      { label: 'Somewhat Important', desc: 'Prefer these shifts when available', value: 1.5 },
                      { label: 'Important', desc: 'Strongly prefer schedules with these shifts', value: 3 },
                      { label: 'Essential', desc: 'Only show schedules with these shifts', value: 5 },
                    ].map(({ label, desc, value }) => (
                      <button 
                        key={value}
                        onClick={() => handleSetShiftWeight(value)}
                        className={`w-full p-4 rounded-lg text-left transition-colors ${
                          Number(shiftWeight) === Number(value) 
                            ? (theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-500 text-white")
                            : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-lg">{label}</div>
                            <div className="text-sm opacity-80 mt-1">{desc}</div>
                          </div>
                          {Number(shiftWeight) === Number(value) && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white bg-opacity-20">
                              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="w-[30%]">
                  <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      Your Shift Preferences
                    </h3>
                    
                    <div className="mt-4 space-y-3">
                      <div>
                        <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Selected preferences:
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedCategories.map(cat => (
                            <span key={cat} className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-blue-900/50 text-blue-100 border border-blue-700/50' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {cat}
                            </span>
                          ))}
                          {selectedLengths.map(len => (
                            <span key={len} className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-amber-900/50 text-amber-100 border border-amber-700/50' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {len}
                            </span>
                          ))}
                          {selectedCodes.map(code => (
                            <span key={code} className={`text-xs px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-purple-900/50 text-purple-100 border border-purple-700/50' 
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className={`mt-4 ${theme === 'dark' ? 'bg-blue-900/20 border-l-4 border-blue-600 rounded-r-lg' : 'bg-blue-50 border-l-4 border-blue-400 rounded-r-lg'} p-3`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                          Setting importance helps the system prioritize your preferences against other criteria.
                        </p>
                      </div>
                      
                      {Number(shiftWeight) > 0 && (
                        <div className="mt-4">
                          <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Current importance:
                          </h4>
                          <div className="mt-2">
                            <span className={`text-xs px-2.5 py-1 rounded-md ${getImportanceLabel(shiftWeight).color}`}>
                              {getImportanceLabel(shiftWeight).label}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 flex justify-between">
                      <button
                        onClick={() => changeMode('length', 'length', 'length', 'length')}
                        className={`px-4 py-2 text-sm font-medium rounded-md border ${
                          theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
                        }`}
                      >
                        Back
                      </button>
                      
                      <button
                        onClick={onNext}
                        className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md font-medium`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Code selection screen - fixed for better fit and visibility */}
          {currentScreen === 'code' && (
            <motion.div 
              key="code-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                Select Specific Shift Codes
              </h2>
              
              <div className="flex space-x-4">
                <div className="w-[75%]">
                  <div className="grid grid-cols-6 gap-1.5 max-h-[70vh] overflow-y-auto p-1">
                    {shiftCodes.map(code => {
                      // Extract the time values from the code 
                      const codePattern = code.display || code.code || "";
                      const timePattern = code.display?.match(/\((.+?)\)/) || code.code?.match(/\((.+?)\)/);
                      
                      // Get times from the code display or use fallback
                      const timeDisplay = timePattern ? timePattern[1] : 
                                        (code.startTime && code.endTime) ? 
                                        `${code.startTime}–${code.endTime}` : "";
                      
                      // Just get the code part without the time
                      const shortCode = codePattern.split(" ")[0] || codePattern;
                      
                      return (
                        <button
                          key={code.id || shortCode}
                          onClick={() => toggleShiftCode(code.code)}
                          className={`p-1.5 rounded-lg flex flex-col items-center justify-center ${
                            selectedCodes.includes(code.code)
                              ? (theme === 'dark' ? "bg-purple-600 text-white" : "bg-purple-500 text-white")
                              : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")
                          }`}
                        >
                          <span className="font-medium text-xs">{shortCode}</span>
                          <span className="text-[10px] opacity-80 mt-0.5 text-center">
                            {timeDisplay || "No time"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="w-[25%]">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} h-full`}>
                    <h3 className={`text-base font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                      Shift Code Details
                    </h3>
                    <div className={`mt-2 space-y-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <p className="text-xs">Each code represents a specific shift pattern with fixed start and end times.</p>
                      
                      {/* Filter options */}
                      <div className="mt-3">
                        <h4 className="text-xs font-medium mb-1.5">Filter by:</h4>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <button className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-purple-900/40 text-purple-200' : 'bg-purple-200 text-purple-800'}`}>
                            Morning
                          </button>
                          <button className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-purple-900/40 text-purple-200' : 'bg-purple-200 text-purple-800'}`}>
                            Afternoon
                          </button>
                          <button className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-purple-900/40 text-purple-200' : 'bg-purple-200 text-purple-800'}`}>
                            Night
                          </button>
                        </div>
                      </div>
                      
                      {selectedCodes.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-medium mb-1.5">Your selections:</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedCodes.map(code => (
                              <span key={code} className={`text-[10px] px-2 py-0.5 rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-purple-900/50 text-purple-100 border border-purple-700/50' 
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        onClick={() => changeMode('main', '', 'main', '')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                          theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
                        }`}
                      >
                        Back
                      </button>
                      
                      <button
                        onClick={() => changeMode('length', 'length', 'length', 'length')}
                        className={`px-3 py-1.5 text-xs text-white rounded-md font-medium ${
                          selectedCodes.length === 0
                            ? `${theme === 'dark' ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'}`
                            : `${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-600'}`
                        }`}
                        disabled={selectedCodes.length === 0}
                      >
                        {selectedCodes.length > 0 ? "Next" : "Select at least one"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}