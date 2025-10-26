// src/components/mobile/steps/MobileWorkStretchSelector.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useFilter } from "@/contexts/FilterContext";

export default function MobileWorkStretchSelector({ 
  blocks5dayWeight: propBlocks5dayWeight = 0, 
  setBlocks5dayWeight: propSetBlocks5dayWeight,
  blocks4dayWeight: propBlocks4dayWeight = 0, 
  setBlocks4dayWeight: propSetBlocks4dayWeight,
  onNext,
  onBack,
  // New props for hash navigation
  initialActiveTab = '5day',
  onActiveTabChange = () => {},
  isCompactView = false
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { navigateToSubsection } = useFilter();
  
  // Use props directly - no localStorage dependency
  const blocks5dayWeight = propBlocks5dayWeight ?? 0;
  const blocks4dayWeight = propBlocks4dayWeight ?? 0;
  
  // Initial tab from props
  const [activeTab, setActiveTab] = useState(initialActiveTab || '5day');
  
  // Debug logging
  useEffect(() => {
    console.log("MobileWorkStretchSelector mounted with tab:", initialActiveTab);
    console.log("Initial weights:", { blocks5dayWeight, blocks4dayWeight });
  }, [initialActiveTab, blocks5dayWeight, blocks4dayWeight]);
  
  // Notify parent when tab changes
  useEffect(() => {
    // Call the callback from props
    onActiveTabChange(activeTab);
  }, [activeTab, onActiveTabChange]);
  
  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.substring(1);
        
        if (hash.startsWith('stretches/')) {
          const subSection = hash.split('/')[1];
          if (subSection === '5day' || subSection === '4day') {
            setActiveTab(subSection);
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
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    
    try {
      // Update local state
      setActiveTab(tab);
      
      // Update URL hash via context
      navigateToSubsection('stretches', tab);
    } catch (error) {
      console.error("Error changing tab:", error);
    }
  };
  
  // Handlers for weight selection - direct props update
  const handleSelect5DayOption = (value) => {
    if (propSetBlocks5dayWeight) {
      propSetBlocks5dayWeight(Number(value));
    }
  };
  
  const handleSelect4DayOption = (value) => {
    if (propSetBlocks4dayWeight) {
      propSetBlocks4dayWeight(Number(value));
    }
  };

  // Handle navigation
  const handleNext = () => {
    // Simply call onNext from props
    onNext();
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
              Do you want to avoid consecutive work days?
            </h3>
          </div>
          
          {/* Tab navigation */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg p-1 ${sectionMargin}`}>
            <div className="flex">
              <button
                onClick={() => handleTabChange('5day')}
                className={`flex-1 py-2 rounded-lg text-center text-sm 
                  ${activeTab === '5day' 
                    ? (theme === 'dark' ? 'bg-blue-900/60 text-blue-50' : 'bg-blue-200 text-blue-800') 
                    : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
              >
                5-Day Stretches
              </button>
              <button
                onClick={() => handleTabChange('4day')}
                className={`flex-1 py-2 rounded-lg text-center text-sm 
                  ${activeTab === '4day' 
                    ? (theme === 'dark' ? 'bg-purple-900/60 text-purple-50' : 'bg-purple-200 text-purple-800') 
                    : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
              >
                4-Day Stretches
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content area with proper spacing for bottom nav */}
        <div className="flex-grow">
          {activeTab === '5day' && (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow-md`}>
              <div className="mb-3">
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>5-Day Work Stretches</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                  Five consecutive work days can lead to more grouped days off elsewhere.
                </p>
              </div>
              
              <div className="space-y-2 mt-2">
                <button 
                  onClick={() => handleSelect5DayOption(0)}
                  className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                    ${Number(blocks5dayWeight) === 0 
                      ? (theme === 'dark' ? "bg-blue-900/60 text-blue-50" : "bg-blue-200 text-blue-800") 
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <div>
                    <div className="text-sm font-medium">Don't Avoid</div>
                    <div className="text-xs opacity-80">Fine with 5-day stretches</div>
                  </div>
                  {Number(blocks5dayWeight) === 0 && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={() => handleSelect5DayOption(1.5)}
                  className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                    ${Number(blocks5dayWeight) === 1.5 
                      ? (theme === 'dark' ? "bg-blue-900/60 text-blue-50" : "bg-blue-200 text-blue-800") 
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <div>
                    <div className="text-sm font-medium">Somewhat Avoid</div>
                    <div className="text-xs opacity-80">Prefer fewer 5-day stretches</div>
                  </div>
                  {Number(blocks5dayWeight) === 1.5 && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={() => handleSelect5DayOption(3)}
                  className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                    ${Number(blocks5dayWeight) === 3 
                      ? (theme === 'dark' ? "bg-blue-900/60 text-blue-50" : "bg-blue-200 text-blue-800") 
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <div>
                    <div className="text-sm font-medium">Strongly Avoid</div>
                    <div className="text-xs opacity-80">Prefer minimal 5-day stretches</div>
                  </div>
                  {Number(blocks5dayWeight) === 3 && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={() => handleSelect5DayOption(5)}
                  className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                    ${Number(blocks5dayWeight) === 5 
                      ? (theme === 'dark' ? "bg-blue-900/60 text-blue-50" : "bg-blue-200 text-blue-800") 
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <div>
                    <div className="text-sm font-medium">Never Allow</div>
                    <div className="text-xs opacity-80">No 5-day stretches</div>
                  </div>
                  {Number(blocks5dayWeight) === 5 && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === '4day' && (
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow-md`}>
              <div className="mb-3">
                <h3 className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>4-Day Work Stretches</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                  Four consecutive work days are common in many schedules.
                </p>
              </div>
              
              <div className="space-y-2 mt-2">
                <button 
                  onClick={() => handleSelect4DayOption(0)}
                  className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                    ${Number(blocks4dayWeight) === 0 
                      ? (theme === 'dark' ? "bg-purple-900/60 text-purple-50" : "bg-purple-200 text-purple-800") 
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <div>
                    <div className="text-sm font-medium">Don't Avoid</div>
                    <div className="text-xs opacity-80">Fine with 4-day stretches</div>
                  </div>
                  {Number(blocks4dayWeight) === 0 && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={() => handleSelect4DayOption(1.5)}
                  className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                    ${Number(blocks4dayWeight) === 1.5 
                      ? (theme === 'dark' ? "bg-purple-900/60 text-purple-50" : "bg-purple-200 text-purple-800") 
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <div>
                    <div className="text-sm font-medium">Somewhat Avoid</div>
                    <div className="text-xs opacity-80">Prefer fewer 4-day stretches</div>
                  </div>
                  {Number(blocks4dayWeight) === 1.5 && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={() => handleSelect4DayOption(3)}
                  className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                    ${Number(blocks4dayWeight) === 3 
                      ? (theme === 'dark' ? "bg-purple-900/60 text-purple-50" : "bg-purple-200 text-purple-800") 
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <div>
                    <div className="text-sm font-medium">Strongly Avoid</div>
                    <div className="text-xs opacity-80">Prefer minimal 4-day stretches</div>
                  </div>
                  {Number(blocks4dayWeight) === 3 && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <button 
                  onClick={() => handleSelect4DayOption(5)}
                  className={`w-full p-2 rounded-lg text-left flex justify-between items-center 
                    ${Number(blocks4dayWeight) === 5 
                      ? (theme === 'dark' ? "bg-purple-900/60 text-purple-50" : "bg-purple-200 text-purple-800") 
                      : (theme === 'dark' ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800")}`}
                >
                  <div>
                    <div className="text-sm font-medium">Never Allow</div>
                    <div className="text-xs opacity-80">No 4-day stretches</div>
                  </div>
                  {Number(blocks4dayWeight) === 5 && (
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Bottom section - fixed at viewport bottom */}
      <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
          <div className="flex gap-2">
            {activeTab === '5day' ? (
              <>
                <button
                  onClick={onBack}
                  className={`flex-1 ${theme === 'dark' 
                    ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                    ${buttonPadding} rounded-lg font-medium`}
                >
                  Back
                </button>
                <button
                  onClick={() => handleTabChange('4day')}
                  className={`flex-1 ${theme === 'dark'
                    ? "bg-blue-900/60 text-blue-50" : "bg-blue-200 text-blue-800"}
                    ${buttonPadding} rounded-lg font-medium`}
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleTabChange('5day')}
                  className={`flex-1 ${theme === 'dark' 
                    ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}
                    ${buttonPadding} rounded-lg font-medium`}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className={`flex-1 ${theme === 'dark'
                    ? "bg-purple-900/60 text-purple-50" : "bg-purple-200 text-purple-800"}
                    ${buttonPadding} rounded-lg font-medium`}
                >
                  Next
                </button>
              </>
            )}
          </div>
      </div>
    </div>
  );
}