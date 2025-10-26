// src/components/mobile/steps/MobileWeekendPreferences.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useFilter } from "@/contexts/FilterContext";

export default function MobileWeekendPreferences({ 
  weekendWeight: propWeekendWeight, 
  setWeekendWeight: propSetWeekendWeight,
  saturdayWeight: propSaturdayWeight, 
  setSaturdayWeight: propSetSaturdayWeight,
  sundayWeight: propSundayWeight, 
  setSundayWeight: propSetSundayWeight,
  onNext,
  onBack,
  // State persistence props
  initialActiveTab = 'all',
  onActiveTabChange = () => {},
  isCompactView = false
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { navigateToSubsection } = useFilter();
  
  // Use props directly - no localStorage dependency
  const weekendWeight = propWeekendWeight ?? 0;
  const saturdayWeight = propSaturdayWeight ?? 0;
  const sundayWeight = propSundayWeight ?? 0;
  
  // Initial tab from props
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'all');
  const prevTab = useRef(activeTab);
  
  // Debug logging
  useEffect(() => {
    console.log("MobileWeekendPreferences mounted with tab:", initialActiveTab);
    console.log("Initial weights:", { weekendWeight, saturdayWeight, sundayWeight });
  }, [initialActiveTab, weekendWeight, saturdayWeight, sundayWeight]);
  
  // Notify parent when tab changes (with ref check to prevent infinite loops)
  useEffect(() => {
    if (prevTab.current !== activeTab) {
      prevTab.current = activeTab;
      onActiveTabChange(activeTab);
    }
  }, [activeTab, onActiveTabChange]);
  
  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.substring(1);
        
        if (hash.startsWith('weekends/')) {
          const tab = hash.split('/')[1];
          if (['all', 'saturday', 'sunday'].includes(tab)) {
            setActiveTab(tab);
            prevTab.current = tab;
          }
        }
      } catch (error) {
        console.error("Error handling hash change:", error);
      }
    };
    
    handleHashChange(); // Handle initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Change tab with proper hash navigation
  const changeTab = (tab) => {
    if (tab === activeTab) return;
    
    try {
      // Update local state
      setActiveTab(tab);
      prevTab.current = tab;
      
      // Update URL hash via context
      navigateToSubsection('weekends', tab);
    } catch (error) {
      console.error("Error changing tab:", error);
    }
  };
  
  // Update weekend weights - direct props update
  const handleWeekendWeightChange = (value) => {
    if (propSetWeekendWeight) {
      propSetWeekendWeight(Number(value));
    }
  };

  const handleSaturdayWeightChange = (value) => {
    if (propSetSaturdayWeight) {
      propSetSaturdayWeight(Number(value));
    }
  };

  const handleSundayWeightChange = (value) => {
    if (propSetSundayWeight) {
      propSetSundayWeight(Number(value));
    }
  };
  
  // KEY CHANGE: Modified to explicitly log when "See Results" is clicked
  const handleNextStep = () => {
    if (activeTab === 'all') {
      changeTab('saturday');
    } else if (activeTab === 'saturday') {
      changeTab('sunday');
    } else if (activeTab === 'sunday') {
      // This is the key action - user clicking "See Results"
      console.log("User clicked 'See Results' on final weekend tab");
      
      // Move to next step - this will trigger loading view through our updated chain
      onNext();
    }
  };
  
  // Handle navigation back
  const handleBackStep = () => {
    if (activeTab === 'sunday') {
      changeTab('saturday');
    } else if (activeTab === 'saturday') {
      changeTab('all');
    } else if (activeTab === 'all') {
      onBack();
    }
  };
  
  // Determine padding and spacing based on compact view
  const headerPadding = isCompactView ? 'p-2' : 'p-3';
  const sectionMargin = isCompactView ? 'mb-1.5' : 'mb-3';
  const contentPadding = isCompactView ? 'pt-1 pb-24' : 'pt-2 pb-28';
  const buttonPadding = isCompactView ? 'py-2' : 'py-3';
  
  return (
    <div className="h-full flex flex-col">
      <div className={`flex-1 overflow-y-auto px-2 ${contentPadding}`}>
        <div className="flex-none">
          {/* Header */}
          <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} ${headerPadding} rounded-lg ${sectionMargin}`}>
            <h3 className={`text-base font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Weekend preferences?
            </h3>
          </div>
          
          {/* Tab navigation */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg p-1 ${sectionMargin}`}>
            <div className="flex">
              <button
                onClick={() => changeTab('all')}
                className={`flex-1 py-2 rounded-lg text-center text-sm 
                  ${activeTab === 'all' 
                    ? (theme === 'dark' ? 'bg-blue-900/60 text-blue-50' : 'bg-blue-200 text-blue-800')
                    : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
              >
                Weekends
              </button>
              <button
                onClick={() => changeTab('saturday')}
                className={`flex-1 py-2 rounded-lg text-center text-sm 
                  ${activeTab === 'saturday' 
                    ? (theme === 'dark' ? 'bg-purple-900/60 text-purple-50' : 'bg-purple-200 text-purple-800')
                    : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
              >
                Saturdays
              </button>
              <button
                onClick={() => changeTab('sunday')}
                className={`flex-1 py-2 rounded-lg text-center text-sm 
                  ${activeTab === 'sunday' 
                    ? (theme === 'dark' ? 'bg-indigo-900/60 text-indigo-50' : 'bg-indigo-200 text-indigo-800')
                    : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
              >
                Sundays
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-grow">
          {/* Weekends tab */}
          {activeTab === 'all' && (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow-md`}>
              <div className="flex items-center mb-2">
                <div className={`${theme === 'dark' ? 'bg-blue-900/60' : 'bg-blue-200'} text-white rounded-full w-7 h-7 flex items-center justify-center mr-2`}>
                  <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-100' : 'text-blue-800'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>Full Weekends Off</h3>
              </div>
              
              <div className="flex mb-3">
                <div className="flex-1 text-center">
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>F</div>
                  <div className={`${theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'} text-xs p-1 rounded mx-0.5 mt-0.5`}>
                    Work
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Sa</div>
                  <div className={`${theme === 'dark' ? 'bg-green-900/60 text-green-100' : 'bg-green-200 text-green-800'} text-xs p-1 rounded mx-0.5 mt-0.5 font-medium`}>
                    OFF
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Su</div>
                  <div className={`${theme === 'dark' ? 'bg-green-900/60 text-green-100' : 'bg-green-200 text-green-800'} text-xs p-1 rounded mx-0.5 mt-0.5 font-medium`}>
                    OFF
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>M</div>
                  <div className={`${theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'} text-xs p-1 rounded mx-0.5 mt-0.5`}>
                    Work
                  </div>
                </div>
              </div>
              
              {/* Weight buttons */}
              <div className="space-y-2">
                {[
                  { label: "Not Important", desc: "Don't prioritize weekends", value: 0 },
                  { label: "Somewhat Important", desc: "Prefer some weekends off", value: 1.5 },
                  { label: "Important", desc: "Strongly prefer weekends off", value: 3 },
                  { label: "Essential", desc: "Maximum weekends off", value: 5 }
                ].map(({ label, desc, value }) => (
                  <button 
                    key={value}
                    onClick={() => handleWeekendWeightChange(value)}
                    className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                      ${Number(weekendWeight) === Number(value)
                        ? (theme === 'dark' ? "bg-blue-900/60 text-blue-50" : "bg-blue-200 text-blue-800")
                        : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs opacity-80">{desc}</div>
                    </div>
                    {Number(weekendWeight) === Number(value) && (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Saturday tab */}
          {activeTab === 'saturday' && (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow-md`}>
              <div className="flex items-center mb-3">
                <div className={`${theme === 'dark' ? 'bg-purple-900/60' : 'bg-purple-200'} rounded-full w-7 h-7 flex items-center justify-center mr-2`}>
                  <span className={`text-sm font-bold ${theme === 'dark' ? 'text-purple-100' : 'text-purple-800'}`}>Sa</span>
                </div>
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>Saturdays Off</h3>
              </div>
              
              {/* OFF indicator - 1/3 width */}
              <div className="mb-4">
                <div className="text-center">
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Saturday</div>
                  <div className={`${theme === 'dark' ? 'bg-green-900/60 text-green-100' : 'bg-green-200 text-green-800'} text-xs p-1 rounded font-medium w-1/3 mx-auto`}>
                    OFF
                  </div>
                </div>
              </div>
              
              {/* Weight buttons */}
              <div className="space-y-2">
                {[
                  { label: "Not Important", desc: "Fine working Saturdays", value: 0 },
                  { label: "Somewhat Important", desc: "Prefer Saturdays off", value: 1.5 },
                  { label: "Important", desc: "Strongly prefer Saturdays off", value: 3 },
                  { label: "Essential", desc: "Maximum Saturdays off", value: 5 }
                ].map(({ label, desc, value }) => (
                  <button 
                    key={value}
                    onClick={() => handleSaturdayWeightChange(value)}
                    className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                      ${Number(saturdayWeight) === Number(value)
                        ? (theme === 'dark' ? "bg-purple-900/60 text-purple-50" : "bg-purple-200 text-purple-800")
                        : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs opacity-80">{desc}</div>
                    </div>
                    {Number(saturdayWeight) === Number(value) && (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Sunday tab */}
          {activeTab === 'sunday' && (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow-md`}>
              <div className="flex items-center mb-3">
                <div className={`${theme === 'dark' ? 'bg-indigo-900/60' : 'bg-indigo-200'} rounded-full w-7 h-7 flex items-center justify-center mr-2`}>
                  <span className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-100' : 'text-indigo-800'}`}>Su</span>
                </div>
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>Sundays Off</h3>
              </div>
              
              {/* OFF indicator - 1/3 width */}
              <div className="mb-4">
                <div className="text-center">
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Sunday</div>
                  <div className={`${theme === 'dark' ? 'bg-green-900/60 text-green-100' : 'bg-green-200 text-green-800'} text-xs p-1 rounded font-medium w-1/3 mx-auto`}>
                    OFF
                  </div>
                </div>
              </div>
              
              {/* Weight buttons */}
              <div className="space-y-2">
                {[
                  { label: "Not Important", desc: "Fine working Sundays", value: 0 },
                  { label: "Somewhat Important", desc: "Prefer Sundays off", value: 1.5 },
                  { label: "Important", desc: "Strongly prefer Sundays off", value: 3 },
                  { label: "Essential", desc: "Maximum Sundays off", value: 5 }
                ].map(({ label, desc, value }) => (
                  <button 
                    key={value}
                    onClick={() => handleSundayWeightChange(value)}
                    className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                      ${Number(sundayWeight) === Number(value)
                        ? (theme === 'dark' ? "bg-indigo-900/60 text-indigo-50" : "bg-indigo-200 text-indigo-800")
                        : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                  >
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs opacity-80">{desc}</div>
                    </div>
                    {Number(sundayWeight) === Number(value) && (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Bottom section - fixed at viewport bottom */}
      <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
          <div className="flex gap-2">
            <button
              onClick={handleBackStep}
              className={`flex-1 ${theme === 'dark' 
                ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                ${buttonPadding} rounded-lg font-medium`}
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className={`flex-1 ${
                activeTab === 'all'
                  ? (theme === 'dark' ? "bg-blue-900/60 text-blue-50" : "bg-blue-200 text-blue-800")
                  : activeTab === 'saturday'
                    ? (theme === 'dark' ? "bg-purple-900/60 text-purple-50" : "bg-purple-200 text-purple-800")
                    : (theme === 'dark' ? "bg-indigo-900/60 text-indigo-50" : "bg-indigo-200 text-indigo-800")
              }
                ${buttonPadding} rounded-lg font-medium`}
            >
              {/* KEY CHANGE: Highlight that this is the final button when on sunday tab */}
              {activeTab === 'sunday' ? 'See Results' : 'Next'}
            </button>
          </div>
      </div>
    </div>
  );
}