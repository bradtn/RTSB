// src/components/mobile/steps/MobileShiftSelector.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useFilter } from "@/contexts/FilterContext";

export default function MobileShiftSelector({ 
  selectedCategories: propSelectedCategories, 
  setSelectedCategories: propSetSelectedCategories,
  selectedLengths: propSelectedLengths, 
  setSelectedLengths: propSetSelectedLengths,
  selectedCodes: propSelectedCodes, 
  setSelectedCodes: propSetSelectedCodes,
  shiftWeight: propShiftWeight, 
  setShiftWeight: propSetShiftWeight,
  shiftCategoryIntent: propShiftCategoryIntent,
  setShiftCategoryIntent: propSetShiftCategoryIntent,
  shiftCodes,
  onNext,
  onBack,
  // Enhanced props for state persistence
  initialMode = 'main',
  initialFilterChoice = '',
  initialScreen = '',     // New prop for detailed screen tracking
  initialSelectedTab = '', // New prop for tab tracking
  onModeChange = () => {},
  isCompactView = false
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { navigateToSubsection } = useFilter();
  
  // Use props directly - no localStorage dependency
  const selectedCategories = propSelectedCategories || [];
  const selectedLengths = propSelectedLengths || [];
  const selectedCodes = propSelectedCodes || [];
  const shiftWeight = propShiftWeight ?? 0;
  const shiftCategoryIntent = propShiftCategoryIntent || 'any';
  
  // Get unique categories from shift codes
  const categories = [...new Set(shiftCodes.map(code => code.category))]
    .filter(c => c && c !== "Unknown")
    .sort();
  
  // Get unique lengths from shift codes
  const lengths = [...new Set(shiftCodes.map(code => code.length))]
    .filter(l => l && l !== "Unknown")
    .sort();

  // Selection mode states - initialized from props
  const [selectionMode, setSelectionMode] = useState(initialMode || 'main');
  const [filterChoice, setFilterChoice] = useState(initialFilterChoice || '');
  const [currentScreen, setCurrentScreen] = useState(initialScreen || initialMode || 'main');
  const [selectedTab, setSelectedTab] = useState(initialSelectedTab || '');

  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  
  // Track first render to handle initial navigation properly
  const isFirstRender = useRef(true);
  
  // Initialize with proper defaults on first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Set modes based on initial props or default to main view
      setSelectionMode(initialMode || 'main');
      setFilterChoice(initialFilterChoice || '');
      setCurrentScreen(initialScreen || initialMode || 'main');
      setSelectedTab(initialSelectedTab || '');
      
      // Debug log the initial state
      console.log("MobileShiftSelector initialized with:", {
        initialMode, initialFilterChoice, initialScreen, initialSelectedTab
      });
    }
  }, [initialMode, initialFilterChoice, initialScreen, initialSelectedTab]);
  
  // Listen for hash changes - but avoid setting hash directly
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      console.log("Hash changed to:", hash);
  
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
  
    handleHashChange(); // Handle initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Notify parent when mode changes - simplified to avoid extra hashChange
  useEffect(() => {
    // Call the callback from props to notify of state changes
    if (!isFirstRender.current) {
      // Only notify if this isn't the first render
      try {
        console.log("Calling onModeChange with:", selectionMode, filterChoice);
        onModeChange(selectionMode, filterChoice, {
          screen: currentScreen,
          selectedTab,
          visited: true
        });
      } catch (error) {
        console.error("Error in onModeChange:", error);
      }
    }
  }, [selectionMode, filterChoice, currentScreen, selectedTab, onModeChange]);
  
  // Helper to change both mode and filter choice with enhanced state tracking
  const changeMode = (mode, choice = filterChoice, screen = mode, tab = choice) => {
    console.log("changeMode called with:", mode, choice, screen, tab);
    
    // Skip if nothing is changing to prevent infinite loops
    if (mode === selectionMode && choice === filterChoice && 
        screen === currentScreen && tab === selectedTab) {
      return;
    }
    
    // Update local state immediately
    setSelectionMode(mode);
    setFilterChoice(choice);
    setCurrentScreen(screen);
    setSelectedTab(tab);
    
    // Let the context handle URL hash updates by calling navigateToSubsection
    // But wrap in try/catch to handle any errors safely
    try {
      // Only update subsection if mode has changed
      if (mode !== selectionMode) {
        navigateToSubsection('shifts', mode);
      }
    } catch (error) {
      console.error("Error navigating to subsection:", error);
    }
  };
  
  // Update shift categories
  const toggleCategory = (category) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    propSetSelectedCategories(updatedCategories);
  };
  
  // Update shift lengths
  const toggleLength = (length) => {
    const updatedLengths = selectedLengths.includes(length)
      ? selectedLengths.filter(l => l !== length)
      : [...selectedLengths, length];
    
    propSetSelectedLengths(updatedLengths);
  };
  
  // Update shift codes
  const toggleShiftCode = (code) => {
    const updatedCodes = selectedCodes.includes(code)
      ? selectedCodes.filter(c => c !== code)
      : [...selectedCodes, code];
    
    propSetSelectedCodes(updatedCodes);
  };

  // Reset all selections
  const resetSelections = () => {
    propSetSelectedCategories([]);
    propSetSelectedLengths([]);
    propSetSelectedCodes([]);
    
    // Go back to main screen
    changeMode('main', '', 'main', '');
  };

  // Update shift weight
  const handleSetShiftWeight = (value) => {
    propSetShiftWeight(Number(value));
  };

  // Handle shift category intent changes
  const handleIntentChange = (intent) => {
    propSetShiftCategoryIntent(intent);
  };

  // Handle navigation to next section
  const handleNext = () => {
    // Simply call the onNext handler from props
    onNext();
  };

  // Handle "No Shift Preferences" button
  const handleNoPreferences = () => {
    // Update state
    propSetSelectedCategories([]);
    propSetSelectedLengths([]);
    propSetSelectedCodes([]);
    propSetShiftWeight(0);
    
    // Navigate to next step
    onNext();
  };

  // Check if any selections have been made
  const hasSelections = selectedCategories.length > 0 || selectedLengths.length > 0 || selectedCodes.length > 0;
  
  // Determine padding and spacing based on compact view
  const headerPadding = isCompactView ? 'p-2' : 'p-3';
  const sectionMargin = isCompactView ? 'mb-1.5' : 'mb-3';
  const contentPadding = isCompactView ? 'pt-1 pb-24' : 'pt-2 pb-28';
  const buttonPadding = isCompactView ? 'py-2' : 'py-3';
  const gridGap = isCompactView ? 'gap-1.5' : 'gap-2';
  
  // Filter shift codes by search query and active filter
  const filteredShiftCodes = shiftCodes.filter(code => {
    const codePattern = code.display || code.code || "";
    const matchesSearch = searchQuery === "" || 
                         codePattern.toLowerCase().includes(searchQuery.toLowerCase());
    
    const timeOfDay = code.category || "";
    // Use exact match for filter, not toLowerCase
    const matchesFilter = activeFilter === "All" || timeOfDay === activeFilter;
    
    return matchesSearch && matchesFilter;
  });
  
  console.log("Current screen:", currentScreen);
  console.log("Available lengths:", lengths);
  console.log("Selected lengths:", selectedLengths);
  
  // Main selection screen - Choice between time of day or specific codes
  if (currentScreen === 'main') {
    return (
      <div className="h-full flex flex-col">
        <div className={`flex-1 overflow-y-auto px-2 ${contentPadding}`}>
          
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} ${headerPadding} rounded-lg ${sectionMargin}`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Which types of shifts do you prefer?
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Select shifts by time of day or specific code to find your ideal schedule
            </p>
          </div>
          
          <div className="flex-grow">
            <div className={`space-y-3 mb-4`}>
              <button
                onClick={() => changeMode('category', 'category', 'category', 'category')}
                className={`w-full ${theme === 'dark' ? 'bg-blue-900/60 text-blue-50' : 'bg-blue-200 text-blue-800'} 
                         p-4 rounded-lg flex justify-between items-center`}
              >
                <div>
                  <div className="font-medium text-lg">By Time of Day</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} mt-1`}>
                    Morning, Afternoon, Night shifts
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className={`text-xs ${theme === 'dark' ? 'bg-blue-800/60 text-blue-200' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full`}>Mornings</span>
                    <span className={`text-xs ${theme === 'dark' ? 'bg-blue-800/60 text-blue-200' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full`}>Afternoons</span>
                    <span className={`text-xs ${theme === 'dark' ? 'bg-blue-800/60 text-blue-200' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full`}>Nights</span>
                  </div>
                </div>
                <span className="text-xl">→</span>
              </button>
              
              <button
                onClick={() => changeMode('code', 'code', 'code', 'code')}
                className={`w-full ${theme === 'dark' ? 'bg-purple-900/60 text-purple-50' : 'bg-purple-200 text-purple-800'} 
                         p-4 rounded-lg flex justify-between items-center`}
              >
                <div>
                  <div className="font-medium text-lg">By Specific Shift Code</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'} mt-1`}>
                    Select exact shift codes
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className={`text-xs ${theme === 'dark' ? 'bg-purple-800/60 text-purple-200' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>06BC</span>
                    <span className={`text-xs ${theme === 'dark' ? 'bg-purple-800/60 text-purple-200' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>13AC</span>
                    <span className={`text-xs ${theme === 'dark' ? 'bg-purple-800/60 text-purple-200' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>14AT</span>
                    <span className={`text-xs ${theme === 'dark' ? 'bg-purple-800/60 text-purple-200' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>19AR</span>
                  </div>
                </div>
                <span className="text-xl">→</span>
              </button>
            </div>
            
            <div className={`${theme === 'dark' ? 'bg-yellow-900/20 border-l-4 border-yellow-600 rounded-lg' : 'bg-yellow-50 border-l-4 border-yellow-400 rounded-lg'} p-2.5 mb-4`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Select shifts by time of day or specific codes, or skip if you have no shift preferences.
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom section - fixed at viewport bottom */}
        <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
            <div className="flex gap-2">
              <button
                onClick={onBack}
                className={`flex-1 ${theme === 'dark' 
                  ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                  ${buttonPadding} rounded-lg font-medium`}
              >
                Back
              </button>
              <button
                onClick={handleNoPreferences}
                className={`flex-1 ${theme === 'dark'
                  ? "bg-slate-600 text-white" : "bg-slate-500 text-white"}
                  ${buttonPadding} rounded-lg font-medium`}
              >
                No Shift Preferences
              </button>
            </div>
        </div>
      </div>
    );
  }
  
  // Category selection screen (Time of Day)
  if (currentScreen === 'category') {
    return (
      <div className="h-full flex flex-col">
        <div className={`flex-1 overflow-y-auto px-2 ${contentPadding}`}>
          <div className={`${theme === 'dark' ? 'bg-blue-900/80' : 'bg-blue-100'} ${headerPadding} rounded-lg ${sectionMargin}`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-blue-100' : 'text-blue-900'}`}>
              Select Shift Times
            </h3>
          </div>
          
          <div className="flex-grow">
            {/* Multi-category intent selector */}
            {selectedCategories.length > 1 && (
              <div className={`mb-4 p-3 rounded-lg ${
                theme === 'dark' ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'
              }`}>
                <h4 className={`text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-blue-200' : 'text-blue-700'
                }`}>
                  When I select multiple shift types:
                </h4>
                <div className="space-y-2">
                  <label className="flex items-start cursor-pointer">
                    <input 
                      type="radio" 
                      name="shiftIntent" 
                      value="any" 
                      checked={shiftCategoryIntent === 'any'}
                      onChange={(e) => handleIntentChange(e.target.value)}
                      className="mt-0.5 mr-2 text-blue-600" 
                    />
                    <div>
                      <span className={`text-xs font-medium ${
                        theme === 'dark' ? 'text-blue-100' : 'text-blue-800'
                      }`}>
                        I'm flexible - show lines with ANY of these shifts
                      </span>
                      <p className={`text-xs mt-0.5 ${
                        theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                      }`}>
                        A line with 100% Days would be perfect
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start cursor-pointer">
                    <input 
                      type="radio" 
                      name="shiftIntent" 
                      value="mix" 
                      checked={shiftCategoryIntent === 'mix'}
                      onChange={(e) => handleIntentChange(e.target.value)}
                      className="mt-0.5 mr-2 text-blue-600" 
                    />
                    <div>
                      <span className={`text-xs font-medium ${
                        theme === 'dark' ? 'text-blue-100' : 'text-blue-800'
                      }`}>
                        I want variety - show lines with a MIX of these shifts
                      </span>
                      <p className={`text-xs mt-0.5 ${
                        theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                      }`}>
                        Only show lines that rotate between multiple types
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Time of day options with balanced grid layout - USES CATEGORIES FROM DATA */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`${buttonPadding} rounded-lg text-center text-base 
                    ${selectedCategories.includes(category)
                      ? (theme === 'dark' ? "bg-blue-600 text-white font-medium" : "bg-blue-500 text-white font-medium")
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Warning message */}
            {selectedCategories.length === 0 && (
              <div className={`mt-2 mb-4 p-2 ${theme === 'dark' ? 'bg-yellow-900/20 border-l-2 border-yellow-600 rounded-lg' : 'bg-yellow-50 border-l-2 border-yellow-400 rounded-lg'}`}>
                <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  Select at least one time of day option.
                </p>
              </div>
            )}
          </div>
          
        </div>
        
        {/* Bottom section - fixed at viewport bottom */}
        <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
            <div className="flex gap-2">
              <button
                onClick={() => changeMode('main', '', 'main', '')}
                className={`${theme === 'dark' 
                  ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                  ${buttonPadding} rounded-lg font-medium w-1/2`}
              >
                Back
              </button>
              <button
                onClick={() => changeMode('length', 'length', 'length', 'length')}
                disabled={selectedCategories.length === 0}
                className={`w-1/2 ${
                  selectedCategories.length === 0
                    ? (theme === 'dark' ? "bg-yellow-700 text-yellow-100" : "bg-yellow-400 text-yellow-900")
                    : (theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-500 text-white")
                } ${buttonPadding} rounded-lg font-medium`}
              >
                Next
              </button>
            </div>
        </div>
      </div>
    );
  }
  
  // Code selection screen
  if (currentScreen === 'code') {
    return (
      <div className="h-full flex flex-col">
        <div className={`flex-1 overflow-y-auto px-2 ${contentPadding}`}>
          <div className={`${theme === 'dark' ? 'bg-purple-900/80' : 'bg-purple-100'} ${headerPadding} rounded-lg ${sectionMargin}`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-purple-100' : 'text-purple-900'}`}>
              Select Shift Codes
            </h3>
          </div>
          
          <div className="flex-grow">
            {/* Enhanced explanation */}
            <div className={`${theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100'} p-2 rounded-lg mb-2.5`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Each code represents a specific shift pattern with start and end times.
              </p>
            </div>
            
            {/* Search input */}
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${theme === 'dark' 
                  ? 'bg-gray-700 text-white border border-gray-600' 
                  : 'bg-white text-gray-900 border border-gray-300'} rounded-md py-1.5 px-2 text-sm focus:outline-none`}
              />
            </div>
            
            {/* Filter tabs with balanced layout and CORRECT CATEGORIES FROM DATA */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <button 
                onClick={() => setActiveFilter("All")}
                className={`py-1.5 px-1 text-center rounded-full text-xs ${
                  activeFilter === "All"
                    ? (theme === 'dark' ? 'bg-purple-600 text-white font-medium' : 'bg-purple-500 text-white font-medium')
                    : (theme === 'dark' ? 'bg-purple-900/40 text-purple-200' : 'bg-purple-100 text-purple-800')
                }`}
              >
                All
              </button>
              
              {categories.map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`py-1.5 px-1 text-center rounded-full text-xs ${
                    activeFilter === filter
                      ? (theme === 'dark' ? 'bg-purple-600 text-white font-medium' : 'bg-purple-500 text-white font-medium')
                      : (theme === 'dark' ? 'bg-purple-900/40 text-purple-200' : 'bg-purple-100 text-purple-800')
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            {/* Selected codes chips */}
            {selectedCodes.length > 0 && (
              <div className="mb-2">
                <p className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Selected ({selectedCodes.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedCodes.slice(0, 8).map(code => (
                    <div key={code} className={`inline-flex items-center ${theme === 'dark' 
                      ? 'bg-purple-800 text-purple-200' 
                      : 'bg-purple-500 text-white'} rounded-full px-2 py-0.5 text-xs`}>
                      {code}
                      <button 
                        onClick={() => toggleShiftCode(code)}
                        className="ml-1 text-white hover:text-red-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {selectedCodes.length > 8 && (
                    <div className={`inline-flex items-center ${theme === 'dark' 
                      ? 'bg-gray-700 text-gray-300' 
                      : 'bg-gray-500 text-white'} rounded-full px-2 py-0.5 text-xs`}>
                      +{selectedCodes.length - 8} more
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Shift code grid - 5 columns for more compact layout */}
            <div className={`grid grid-cols-5 gap-1 mb-4`}>
              {filteredShiftCodes.map(code => {
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
                    className={`p-1 rounded-lg flex flex-col items-center 
                      ${selectedCodes.includes(code.code)
                        ? (theme === 'dark' ? "bg-purple-600 text-white" : "bg-purple-500 text-white")
                        : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                  >
                    <span className="font-medium text-xs">{shortCode}</span>
                    <span className="text-[9px] opacity-80 leading-tight">
                      {timeDisplay || "—"}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {filteredShiftCodes.length === 0 && (
              <div className={`p-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg text-center`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  No matching shift codes found.
                </p>
              </div>
            )}
            
            {/* Warning message */}
            {selectedCodes.length === 0 && (
              <div className={`mt-2 mb-4 p-2 ${theme === 'dark' ? 'bg-yellow-900/20 border-l-2 border-yellow-600 rounded-lg' : 'bg-yellow-50 border-l-2 border-yellow-400 rounded-lg'}`}>
                <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  Select at least one specific shift code.
                </p>
              </div>
            )}
          </div>
          
        </div>
        
        {/* Bottom section - fixed at viewport bottom */}
        <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
            <div className="flex gap-2">
              <button
                onClick={() => changeMode('main', '', 'main', '')}
                className={`${theme === 'dark' 
                  ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                  ${buttonPadding} rounded-lg font-medium w-1/2`}
              >
                Back
              </button>
              <button
                onClick={() => changeMode('length', 'length', 'length', 'length')}
                disabled={selectedCodes.length === 0}
                className={`w-1/2 ${
                  selectedCodes.length === 0
                    ? (theme === 'dark' ? "bg-yellow-700 text-yellow-100" : "bg-yellow-400 text-yellow-900")
                    : (theme === 'dark' ? "bg-purple-600 text-white" : "bg-purple-500 text-white")
                } ${buttonPadding} rounded-lg font-medium`}
              >
                Next
              </button>
            </div>
        </div>
      </div>
    );
  }
  
  // Length selection screen
  if (currentScreen === 'length') {
    return (
      <div className="h-full flex flex-col">
        <div className={`flex-1 overflow-y-auto px-2 ${contentPadding}`}>
          <div className={`${theme === 'dark' ? 'bg-amber-900/40' : 'bg-amber-100'} ${headerPadding} rounded-lg ${sectionMargin}`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-amber-100' : 'text-amber-900'}`}>
              Filter by shift length?
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-amber-200' : 'text-amber-700'}`}>
              Optional - select preferred shift lengths
            </p>
          </div>
          
          <div className="flex-grow">
            {/* Length buttons with balanced grid layout */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {lengths.map(length => (
                <button
                  key={length}
                  onClick={() => toggleLength(length)}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center 
                    ${selectedLengths.includes(length)
                      ? (theme === 'dark' ? "bg-amber-600 text-white" : "bg-amber-500 text-white")
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <span className="font-medium">{length.replace(' Hour Shift', 'h')}</span>
                  <span className="text-xs opacity-80 mt-0.5">
                    Paid Hours
                  </span>
                </button>
              ))}
            </div>
          </div>
          
        </div>
        
        {/* Bottom section - fixed at viewport bottom */}
        <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
            <div className="flex gap-2">
              <button
                onClick={() => changeMode(filterChoice === 'category' ? 'category' : 'code', filterChoice, 
                  filterChoice === 'category' ? 'category' : 'code', filterChoice)}
                className={`${theme === 'dark' 
                  ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                  ${buttonPadding} rounded-lg font-medium w-1/2`}
              >
                Back
              </button>
              <button
                onClick={() => changeMode('weight', 'weight', 'weight', 'weight')}
                className={`w-1/2 ${theme === 'dark'
                  ? "bg-amber-600 text-white" : "bg-amber-500 text-white"}
                  ${buttonPadding} rounded-lg font-medium`}
              >
                Next
              </button>
            </div>
        </div>
      </div>
    );
  }
  
  // Weight setting view
  if (currentScreen === 'weight') {
    return (
      <div className="h-full flex flex-col">
        <div className={`flex-1 overflow-y-auto px-2 ${contentPadding}`}>
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} ${headerPadding} rounded-lg ${sectionMargin}`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              How important are your shift preferences?
            </h3>
          </div>
          
          <div className="flex-grow">
            {/* Selection display */}
            <div className={`${theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100'} p-2 rounded-lg mb-3`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Your selections:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedCategories.length > 0 && (
                    <span className={`text-xs ${theme === 'dark' ? 'bg-blue-800/60 text-blue-200' : 'bg-blue-200 text-blue-800'} px-1.5 py-0.5 rounded-full`}>
                      {selectedCategories.join(', ')}
                    </span>
                  )}
                  {selectedLengths.length > 0 && (
                    <span className={`text-xs ${theme === 'dark' ? 'bg-amber-800/60 text-amber-200' : 'bg-amber-200 text-amber-800'} px-1.5 py-0.5 rounded-full`}>
                      {selectedLengths.join(', ')}
                    </span>
                  )}
                  {selectedCodes.length > 0 && (
                    <span className={`text-xs ${theme === 'dark' ? 'bg-purple-800/60 text-purple-200' : 'bg-purple-200 text-purple-800'} px-1.5 py-0.5 rounded-full`}>
                      {selectedCodes.length} codes
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Weight buttons */}
            <div className="space-y-1.5 mb-3">
              {[
                { label: 'Not Important', desc: 'Other criteria will determine results', value: 0 },
                { label: 'Somewhat Important', desc: 'Prefer these shifts when available', value: 1.5 },
                { label: 'Important', desc: 'Strongly prefer schedules with these shifts', value: 3 },
                { label: 'Essential', desc: 'Only show schedules with these shifts', value: 5 },
              ].map(({ label, desc, value }) => (
                <button 
                  key={value}
                  onClick={() => handleSetShiftWeight(value)}
                  className={`w-full ${isCompactView ? 'p-2' : 'p-2.5'} rounded-lg text-left flex justify-between items-center transition-all duration-200
                    ${Number(shiftWeight) === Number(value) 
                      ? (theme === 'dark' 
                          ? "bg-blue-900/60 text-blue-50 ring-1 ring-blue-400" 
                          : "bg-blue-500 text-white ring-1 ring-blue-300")
                      : (theme === 'dark' 
                          ? "bg-gray-700/80 text-gray-100 hover:bg-gray-600/80" 
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300")}`}
                >
                  <div>
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs opacity-80">{desc}</div>
                  </div>
                  {Number(shiftWeight) === Number(value) && (
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
        </div>
        
        {/* Bottom section - fixed at viewport bottom */}
        <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
            <div className="flex gap-2">
              <button
                onClick={() => changeMode('length', 'length', 'length', 'length')}
                className={`${theme === 'dark' 
                  ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                  ${buttonPadding} rounded-lg font-medium w-1/2`}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className={`w-1/2 ${theme === 'dark'
                  ? "bg-blue-900/60 text-blue-50" : "bg-blue-500 text-white"}
                  ${buttonPadding} rounded-lg font-medium`}
              >
                Next
              </button>
            </div>
        </div>
      </div>
    );
  }
  
  // If we get here, we don't have a matching screen - show a fallback
  return (
    <div className="mobile-full-height flex flex-col justify-center items-center p-4">
      <div className={`text-center ${styles.textPrimary}`}>
        <p>Unknown screen mode: {currentScreen}</p>
        <button 
          onClick={() => changeMode('main', '', 'main', '')}
          className={`mt-4 px-4 py-2 ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded-lg`}
        >
          Return to Main Screen
        </button>
      </div>
    </div>
  );
}