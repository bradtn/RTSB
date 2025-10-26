// src/components/loaders/elements/PredictiveInsights.jsx
import React, { useState, useEffect } from 'react';

const PredictiveInsights = ({ preferences = [], theme }) => {
  const [currentInsight, setCurrentInsight] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  
  // Convert technical field names to user-friendly terms
  const formatPreference = (pref) => {
    // Handle common field name patterns
    if (pref.includes("dayOffDates")) return "preferred days off";
    if (pref.includes("startTime")) return "start time preferences";
    if (pref.includes("endTime")) return "end time preferences";
    if (pref.includes("shift")) return "shift type preferences";
    if (pref.includes("Date")) return "date preferences";
    
    // General formatting - convert camelCase to spaces
    return pref.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .replace(/:.*/, ''); // Remove anything after colon
  };
  
  const insights = [
    "Looking for matching start times...",
    "Analyzing weekend availability...",
    "Checking for consecutive days off...",
    "Finding shifts with your preferred hours...",
    "Prioritizing your worklife balance preferences..."
  ];
  
  // Custom insights based on user preferences if provided
  const customInsights = preferences.length > 0 
    ? preferences.map(pref => `Optimizing for ${formatPreference(pref)}...`) 
    : [];
  
  const allInsights = [...customInsights, ...insights];
  
  useEffect(() => {
    if (allInsights.length <= 1) return;
    
    const cycleTimer = setInterval(() => {
      // Start fade out
      setFadingOut(true);
      
      // After fade out completes, change to next insight
      setTimeout(() => {
        setCurrentInsight(prev => (prev + 1) % allInsights.length);
        setFadingOut(false);
      }, 500); // 500ms matches our transition duration
      
    }, 4000); // Cycle every 4 seconds
    
    return () => clearInterval(cycleTimer);
  }, [allInsights.length]);
  
  return (
    // Fixed height container to prevent layout shifts
    <div className="mt-2 text-sm font-light h-6 flex items-center justify-center">
      <div 
        className={`inline-flex items-center transition-opacity duration-500 ${
          fadingOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <svg className={`w-4 h-4 mr-1 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-500'}`} 
             fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        <span className={`${theme === 'dark' ? 'text-purple-300' : 'text-purple-500'} font-medium`}>
          {allInsights[currentInsight]}
        </span>
      </div>
    </div>
  );
};

export default PredictiveInsights;
