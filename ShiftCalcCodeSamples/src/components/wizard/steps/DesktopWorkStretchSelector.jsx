// src/components/wizard/steps/DesktopWorkStretchSelector.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useFilter } from "@/contexts/FilterContext";
import { motion, AnimatePresence } from "framer-motion";

export default function DesktopWorkStretchSelector({
  blocks5dayWeight = 0,
  setBlocks5dayWeight,
  blocks4dayWeight = 0,
  setBlocks4dayWeight,
  onNext,
  onBack
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { navigateToSection, navigateToSubsection } = useFilter();
  const [activeTab, setActiveTab] = useState('5day');

  // Listen for hash changes to update active tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash.startsWith('stretches/')) {
        const tab = hash.split('/')[1];
        if (tab === '4day' || tab === '5day') {
          setActiveTab(tab);
        }
      }
    };
    
    handleHashChange(); // Handle initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Change tab and update URL hash
  const changeTab = (tab) => {
    setActiveTab(tab);
    navigateToSubsection('stretches', tab);
  };

  // Handlers for weight selection
  const handleSelect5DayOption = (value) => {
    if (typeof setBlocks5dayWeight === 'function') {
      setBlocks5dayWeight(Number(value));
    }
  };

  const handleSelect4DayOption = (value) => {
    if (typeof setBlocks4dayWeight === 'function') {
      setBlocks4dayWeight(Number(value));
    }
  };

  return (
    <div className="h-full">
      <div className={`h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md`}>
        <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Work Day Stretch Preferences
        </h2>

        {/* Tab navigation */}
        <div className={`flex mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg p-1 w-fit`}>
          <button
            onClick={() => changeTab('5day')}
            className={`px-6 py-2 rounded-lg text-center transition-colors ${
              activeTab === '5day'
                ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                : (theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900')
            }`}
          >
            5-Day Stretches
          </button>
          <button
            onClick={() => changeTab('4day')}
            className={`px-6 py-2 rounded-lg text-center transition-colors ${
              activeTab === '4day'
                ? (theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
                : (theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900')
            }`}
          >
            4-Day Stretches
          </button>
        </div>

        <div className="flex space-x-6">
          {/* Main content area - 70% */}
          <div className="w-[70%]">
            <AnimatePresence mode="wait">
              {activeTab === '5day' ? (
                <motion.div
                  key="5day-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-3"
                >
                  {[
                    { value: 0, label: "Don't Avoid", desc: "Fine with 5-day stretches" },
                    { value: 1.5, label: "Somewhat Avoid", desc: "Prefer fewer 5-day stretches" },
                    { value: 3, label: "Strongly Avoid", desc: "Prefer minimal 5-day stretches" },
                    { value: 5, label: "Never Allow", desc: "No 5-day stretches" }
                  ].map((option) => (
                    <button
                      key={`5day-${option.value}`}
                      onClick={() => handleSelect5DayOption(option.value)}
                      className={`w-full p-4 rounded-lg text-left transition-colors ${
                        Number(blocks5dayWeight) === Number(option.value)
                          ? (theme === 'dark' ? "bg-blue-600 text-white" : "bg-blue-500 text-white")
                          : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-lg">{option.label}</div>
                          <div className="text-sm opacity-80 mt-1">{option.desc}</div>
                        </div>
                        {Number(blocks5dayWeight) === Number(option.value) && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white bg-opacity-20">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="4day-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-3"
                >
                  {[
                    { value: 0, label: "Don't Avoid", desc: "Fine with 4-day stretches" },
                    { value: 1.5, label: "Somewhat Avoid", desc: "Prefer fewer 4-day stretches" },
                    { value: 3, label: "Strongly Avoid", desc: "Prefer minimal 4-day stretches" },
                    { value: 5, label: "Never Allow", desc: "No 4-day stretches" }
                  ].map((option) => (
                    <button
                      key={`4day-${option.value}`}
                      onClick={() => handleSelect4DayOption(option.value)}
                      className={`w-full p-4 rounded-lg text-left transition-colors ${
                        Number(blocks4dayWeight) === Number(option.value)
                          ? (theme === 'dark' ? "bg-purple-600 text-white" : "bg-purple-500 text-white")
                          : (theme === 'dark' ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300")
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-lg">{option.label}</div>
                          <div className="text-sm opacity-80 mt-1">{option.desc}</div>
                        </div>
                        {Number(blocks4dayWeight) === Number(option.value) && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white bg-opacity-20">
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info panel - 30% */}
          <div className="w-[30%]">
            <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-medium ${
                activeTab === '5day' 
                  ? (theme === 'dark' ? 'text-blue-300' : 'text-blue-700')
                  : (theme === 'dark' ? 'text-purple-300' : 'text-purple-700')
              }`}>
                {activeTab === '5day' ? '5-Day Work Stretches' : '4-Day Work Stretches'}
              </h3>
              
              <div className={`mt-4 space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <p className="text-sm">
                  {activeTab === '5day' 
                    ? 'Five consecutive work days can lead to more grouped days off elsewhere in your schedule.'
                    : 'Four consecutive work days are common in many schedules but may be tiring for some workers.'}
                </p>
                
                <div className={`mt-4 ${
                  activeTab === '5day'
                    ? (theme === 'dark' ? 'bg-blue-900/20 border-l-4 border-blue-600' : 'bg-blue-50 border-l-4 border-blue-400')
                    : (theme === 'dark' ? 'bg-purple-900/20 border-l-4 border-purple-600' : 'bg-purple-50 border-l-4 border-purple-400')
                } rounded-r-lg p-3`}>
                  <p className={`text-sm ${
                    activeTab === '5day'
                      ? (theme === 'dark' ? 'text-blue-200' : 'text-blue-800')
                      : (theme === 'dark' ? 'text-purple-200' : 'text-purple-800')
                  }`}>
                    Choosing to avoid consecutive work days may impact your ability to get larger blocks of days off.
                  </p>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Your selection:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      activeTab === '5day'
                        ? (theme === 'dark' 
                            ? 'bg-blue-900/50 text-blue-100 border border-blue-700/50' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200')
                        : (theme === 'dark' 
                            ? 'bg-purple-900/50 text-purple-100 border border-purple-700/50' 
                            : 'bg-purple-100 text-purple-800 border border-purple-200')
                    }`}>
                      {activeTab === '5day' 
                        ? getWeightLabel(blocks5dayWeight, '5-day') 
                        : getWeightLabel(blocks4dayWeight, '4-day')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Navigation buttons */}
              <div className="mt-6 flex justify-between">
                {activeTab === '5day' ? (
                  <>
                    <button
                      onClick={onBack}
                      className={`px-4 py-2 text-sm font-medium rounded-md border ${
                        theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
                      }`}
                    >
                      Back
                    </button>
                    
                    <button
                      onClick={() => changeTab('4day')}
                      className={`px-4 py-2 text-white rounded-md font-medium ${
                        theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => changeTab('5day')}
                      className={`px-4 py-2 text-sm font-medium rounded-md border ${
                        theme === 'dark' ? 'bg-gray-600 text-gray-200 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'
                      }`}
                    >
                      Back
                    </button>
                    
                    <button
                      onClick={onNext}
                      className={`px-4 py-2 text-white rounded-md font-medium ${
                        theme === 'dark' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-600'
                      }`}
                    >
                      Next
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get a text label for the current weight
function getWeightLabel(weight, stretchType) {
  const weightNum = Number(weight);
  if (weightNum === 0) return `Don't avoid ${stretchType} stretches`;
  if (weightNum === 1.5) return `Somewhat avoid ${stretchType} stretches`;
  if (weightNum === 3) return `Strongly avoid ${stretchType} stretches`;
  if (weightNum === 5) return `Never allow ${stretchType} stretches`;
  return 'Not set';
}