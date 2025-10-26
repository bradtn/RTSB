// src/components/wizard/steps/DesktopWeekendPreferences.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useFilter } from "@/contexts/FilterContext";
import { motion, AnimatePresence } from "framer-motion";

export default function DesktopWeekendPreferences({
  weekendWeight, setWeekendWeight,
  saturdayWeight, setSaturdayWeight,
  sundayWeight, setSundayWeight,
  onNext,
  onBack,
  // State persistence props
  initialActiveTab = 'all',
  onActiveTabChange = () => {}
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { navigateToSection, navigateToSubsection } = useFilter();
  const [activeTab, setActiveTab] = useState(initialActiveTab); // 'all', 'saturday', or 'sunday'
  const prevTab = useRef(activeTab);
  
  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash.startsWith('weekends/')) {
        const tab = hash.split('/')[1];
        if (['all', 'saturday', 'sunday'].includes(tab)) {
          setActiveTab(tab);
          prevTab.current = tab;
        }
      }
    };
    
    handleHashChange(); // Handle initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Notify parent when tab changes (with ref check to prevent infinite loops)
  useEffect(() => {
    if (prevTab.current !== activeTab) {
      prevTab.current = activeTab;
      onActiveTabChange(activeTab);
    }
  }, [activeTab, onActiveTabChange]);
  
  // Helper to change tab with internal and parent state
  const changeTab = (tab) => {
    setActiveTab(tab);
    navigateToSubsection('weekends', tab);
  };

  // Helper functions to handle weight changes with proper number conversion
  const handleWeekendWeightChange = (value) => {
    if (typeof setWeekendWeight === 'function') {
      setWeekendWeight(Number(value));
    }
  };

  const handleSaturdayWeightChange = (value) => {
    if (typeof setSaturdayWeight === 'function') {
      setSaturdayWeight(Number(value));
    }
  };

  const handleSundayWeightChange = (value) => {
    if (typeof setSundayWeight === 'function') {
      setSundayWeight(Number(value));
    }
  };

  // Get current weight object for the active tab
  const getCurrentWeight = () => {
    if (activeTab === 'all') return weekendWeight;
    if (activeTab === 'saturday') return saturdayWeight;
    if (activeTab === 'sunday') return sundayWeight;
    return 0;
  };

  // Dynamic colors based on active tab
  const getTabColors = (tab) => {
    if (tab === 'all') {
      return {
        bg: theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500',
        bgLight: theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100',
        text: theme === 'dark' ? 'text-blue-300' : 'text-blue-700',
        border: theme === 'dark' ? 'border-blue-700/50' : 'border-blue-200',
        highlight: theme === 'dark' ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-400',
        badge: theme === 'dark' ? 'bg-blue-900/50 text-blue-100 border-blue-700/50' : 'bg-blue-100 text-blue-800 border-blue-200'
      };
    } else if (tab === 'saturday') {
      return {
        bg: theme === 'dark' ? 'bg-purple-600' : 'bg-purple-500',
        bgLight: theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100',
        text: theme === 'dark' ? 'text-purple-300' : 'text-purple-700',
        border: theme === 'dark' ? 'border-purple-700/50' : 'border-purple-200',
        highlight: theme === 'dark' ? 'bg-purple-900/20 border-purple-600' : 'bg-purple-50 border-purple-400',
        badge: theme === 'dark' ? 'bg-purple-900/50 text-purple-100 border-purple-700/50' : 'bg-purple-100 text-purple-800 border-purple-200'
      };
    } else {
      return {
        bg: theme === 'dark' ? 'bg-indigo-600' : 'bg-indigo-500',
        bgLight: theme === 'dark' ? 'bg-indigo-900/50' : 'bg-indigo-100',
        text: theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700',
        border: theme === 'dark' ? 'border-indigo-700/50' : 'border-indigo-200',
        highlight: theme === 'dark' ? 'bg-indigo-900/20 border-indigo-600' : 'bg-indigo-50 border-indigo-400',
        badge: theme === 'dark' ? 'bg-indigo-900/50 text-indigo-100 border-indigo-700/50' : 'bg-indigo-100 text-indigo-800 border-indigo-200'
      };
    }
  };

  const colors = getTabColors(activeTab);

  // Get label for a specific weight value
  const getWeightLabel = (value) => {
    switch (Number(value)) {
      case 0: return "Not Important";
      case 1.5: return "Somewhat Important";
      case 3: return "Important";
      case 5: return "Essential";
      default: return "Not set";
    }
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    // Common weight options for all tabs
    const weightOptions = [
      { value: 0, label: "Not Important", desc: activeTab === 'all' ? "Don't prioritize weekends" : `Fine working ${activeTab === 'saturday' ? 'Saturdays' : 'Sundays'}` },
      { value: 1.5, label: "Somewhat Important", desc: activeTab === 'all' ? "Prefer some weekends off" : `Prefer ${activeTab === 'saturday' ? 'Saturdays' : 'Sundays'} off` },
      { value: 3, label: "Important", desc: activeTab === 'all' ? "Strongly prefer weekends off" : `Strongly prefer ${activeTab === 'saturday' ? 'Saturdays' : 'Sundays'} off` },
      { value: 5, label: "Essential", desc: activeTab === 'all' ? "Maximum weekends off" : `Maximum ${activeTab === 'saturday' ? 'Saturdays' : 'Sundays'} off` }
    ];

    // Weight options component reused across tabs
    const WeightOptions = ({ options, currentWeight, onWeightChange }) => (
      <div className="grid grid-cols-1 gap-3 mb-4">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onWeightChange(option.value)}
            className={`w-full p-4 rounded-lg text-left transition-colors ${
              Number(currentWeight) === Number(option.value)
                ? colors.bg + " text-white"
                : theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-lg">{option.label}</div>
                <div className="text-sm opacity-80 mt-1">{option.desc}</div>
              </div>
              {Number(currentWeight) === Number(option.value) && (
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
    );

    if (activeTab === 'all') {
      return (
        <>
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <div className={`w-8 h-8 rounded-full ${colors.bgLight} flex items-center justify-center mr-2`}>
                <svg className={`w-5 h-5 ${colors.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className={`text-lg font-medium ${colors.text}`}>Full Weekends Off</h3>
            </div>
            
            <div className="grid grid-cols-7 gap-1 p-3 bg-gray-800/20 rounded-lg mb-4">
              <div className="text-center">
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>M</div>
                <div className={`${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} text-xs p-1.5 rounded`}>
                  Work
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>T</div>
                <div className={`${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} text-xs p-1.5 rounded`}>
                  Work
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>W</div>
                <div className={`${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} text-xs p-1.5 rounded`}>
                  Work
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>T</div>
                <div className={`${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} text-xs p-1.5 rounded`}>
                  Work
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>F</div>
                <div className={`${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} text-xs p-1.5 rounded`}>
                  Work
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1 font-medium`}>Sa</div>
                <div className={`${theme === 'dark' ? 'bg-green-900/40 text-green-100' : 'bg-green-200 text-green-800'} text-xs p-1.5 rounded font-medium`}>
                  OFF
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1 font-medium`}>Su</div>
                <div className={`${theme === 'dark' ? 'bg-green-900/40 text-green-100' : 'bg-green-200 text-green-800'} text-xs p-1.5 rounded font-medium`}>
                  OFF
                </div>
              </div>
            </div>
          </div>
          
          <WeightOptions 
            options={weightOptions} 
            currentWeight={weekendWeight} 
            onWeightChange={handleWeekendWeightChange} 
          />
        </>
      );
    } else if (activeTab === 'saturday') {
      return (
        <>
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <div className={`w-8 h-8 rounded-full ${colors.bgLight} flex items-center justify-center mr-2`}>
                <span className={`text-base font-bold ${colors.text}`}>Sa</span>
              </div>
              <h3 className={`text-lg font-medium ${colors.text}`}>Saturdays Off</h3>
            </div>
            
            <div className="p-4 bg-gray-800/20 rounded-lg mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1 text-center font-medium`}>Saturday</div>
                  <div className={`${theme === 'dark' ? 'bg-green-900/40 text-green-100' : 'bg-green-200 text-green-800'} text-sm py-1.5 px-4 rounded-md font-medium text-center`}>
                    OFF
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <WeightOptions 
            options={weightOptions} 
            currentWeight={saturdayWeight} 
            onWeightChange={handleSaturdayWeightChange} 
          />
        </>
      );
    } else {
      return (
        <>
          <div className="mb-4">
            <div className="flex items-center mb-3">
              <div className={`w-8 h-8 rounded-full ${colors.bgLight} flex items-center justify-center mr-2`}>
                <span className={`text-base font-bold ${colors.text}`}>Su</span>
              </div>
              <h3 className={`text-lg font-medium ${colors.text}`}>Sundays Off</h3>
            </div>
            
            <div className="p-4 bg-gray-800/20 rounded-lg mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1 text-center font-medium`}>Sunday</div>
                  <div className={`${theme === 'dark' ? 'bg-green-900/40 text-green-100' : 'bg-green-200 text-green-800'} text-sm py-1.5 px-4 rounded-md font-medium text-center`}>
                    OFF
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <WeightOptions 
            options={weightOptions} 
            currentWeight={sundayWeight} 
            onWeightChange={handleSundayWeightChange} 
          />
        </>
      );
    }
  };

  return (
    <div className="h-full">
      <div className={`h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Weekend Preferences
        </h2>

        {/* Tab navigation */}
        <div className={`flex mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg p-1 w-fit`}>
          <button
            onClick={() => changeTab('all')}
            className={`px-6 py-2 rounded-lg text-center transition-colors ${
              activeTab === 'all'
                ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                : (theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900')
            }`}
          >
            Weekends
          </button>
          <button
            onClick={() => changeTab('saturday')}
            className={`px-6 py-2 rounded-lg text-center transition-colors ${
              activeTab === 'saturday'
                ? (theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
                : (theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900')
            }`}
          >
            Saturdays
          </button>
          <button
            onClick={() => changeTab('sunday')}
            className={`px-6 py-2 rounded-lg text-center transition-colors ${
              activeTab === 'sunday'
                ? (theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
                : (theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900')
            }`}
          >
            Sundays
          </button>
        </div>

        <div className="flex space-x-6">
          {/* Main content area - 70% */}
          <div className="w-[70%]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`tab-content-${activeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Info panel - 30% */}
          <div className="w-[30%]">
            <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-medium ${colors.text}`}>
                {activeTab === 'all' 
                  ? 'Weekend Preferences' 
                  : activeTab === 'saturday' 
                    ? 'Saturday Preferences' 
                    : 'Sunday Preferences'}
              </h3>
              
              <div className={`mt-4 space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <p className="text-sm">
                  {activeTab === 'all'
                    ? 'Set the importance of having full weekends (both Saturday and Sunday) off.'
                    : activeTab === 'saturday'
                      ? 'Prioritize having Saturdays off in your schedule.'
                      : 'Prioritize having Sundays off in your schedule.'}
                </p>
                
                <div className={`mt-4 ${colors.highlight} border-l-4 rounded-r-lg p-3`}>
                  <p className={`text-sm ${colors.text}`}>
                    {activeTab === 'all'
                      ? 'Setting weekend preferences may limit the overall number of schedules available.'
                      : `You can set preferences for ${activeTab === 'saturday' ? 'Saturdays' : 'Sundays'} independently of full weekends.`}
                  </p>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Your selections:</h4>
                  <div className="space-y-2">
                    {weekendWeight > 0 && (
                      <div className="flex items-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full bg-blue-900/50 text-blue-100 border border-blue-700/50`}>
                          Weekends: {getWeightLabel(weekendWeight)}
                        </span>
                      </div>
                    )}
                    {saturdayWeight > 0 && (
                      <div className="flex items-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full bg-purple-900/50 text-purple-100 border border-purple-700/50`}>
                          Saturdays: {getWeightLabel(saturdayWeight)}
                        </span>
                      </div>
                    )}
                    {sundayWeight > 0 && (
                      <div className="flex items-center">
                        <span className={`text-xs px-2.5 py-1 rounded-full bg-indigo-900/50 text-indigo-100 border border-indigo-700/50`}>
                          Sundays: {getWeightLabel(sundayWeight)}
                        </span>
                      </div>
                    )}
                    {weekendWeight === 0 && saturdayWeight === 0 && sundayWeight === 0 && (
                      <span className="text-xs text-gray-500">No weekend preferences set</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Navigation buttons */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={onBack}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${
                    theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
                  }`}
                >
                  Back
                </button>
                
                <button
                  onClick={activeTab === 'all' 
                    ? () => changeTab('saturday') 
                    : activeTab === 'saturday' 
                      ? () => changeTab('sunday') 
                      : onNext}
                  className={`px-4 py-2 text-white rounded-md font-medium ${colors.bg}`}
                >
                  {activeTab === 'sunday' ? 'See Results' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}