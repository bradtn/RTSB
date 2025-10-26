// src/components/schedules/ICalButton.jsx
"use client";

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const ICalButton = ({ 
  scheduleId, 
  className = "",
  buttonText = "iCal"
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const handleDownload = async () => {
    console.log("iCal button clicked for schedule ID:", scheduleId);
    
    if (!scheduleId) {
      console.error("No schedule ID provided to ICalButton");
      setHasError(true);
      return;
    }

    // Show confirmation dialog before downloading
    const userConfirmed = window.confirm(
      "Important Notice\n\n" +
      "You're about to download your base schedule. Please note:\n\n" +
      "• This schedule reflects the original bid assignments only\n" +
      "• Any shift trades, accommodations, or schedule changes are NOT included\n" +
      "• You'll need to manually adjust your calendar after importing for any changes that have occurred\n\n" +
      "Would you like to continue with the download?"
    );

    if (!userConfirmed) {
      return; // User cancelled, don't download
    }
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Open in a new tab for direct download
      window.open(`/api/schedules/${scheduleId}/ical`, '_blank');
      
      // Reset loading state after a delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to trigger iCal download:", error);
      setHasError(true);
      setIsLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleDownload}
      disabled={isLoading}
      title={hasError ? "Error downloading calendar" : "Download schedule as iCal file"}
      className={className}
    >
      {isLoading ? (
        <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : hasError ? (
        <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {buttonText}
    </button>
  );
};

export default ICalButton;