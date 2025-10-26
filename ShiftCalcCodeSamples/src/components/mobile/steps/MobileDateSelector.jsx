// src/components/mobile/steps/MobileDateSelector.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker-dark.css"; // Create this file with the dark styles
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useFilter } from "@/contexts/FilterContext";

export default function MobileDateSelector({ 
  dayOffDates: propDayOffDates, 
  setDayOffDates: propSetDayOffDates, 
  daysWeight: propDaysWeight, 
  setDaysWeight: propSetDaysWeight,
  onNext,
  onBack,
  // State persistence props
  showWeightView: propShowWeightView = false,
  onViewModeChange = () => {},
  isCompactView = false
}) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { navigateToSection, navigateToSubsection } = useFilter();
  
  // Use props directly
  const dayOffDates = propDayOffDates || [];
  const daysWeight = propDaysWeight ?? 0;
  
  // Local state for date picking
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  
  // Calendar visibility state
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);
  const [showRangeDatePicker, setShowRangeDatePicker] = useState(false);
  
  // Local state for view mode
  const [internalShowWeightView, setInternalShowWeightView] = useState(propShowWeightView);
  
  // Refs for handling outside clicks
  const singleDatePickerRef = useRef(null);
  const rangeDatePickerRef = useRef(null);
  
  // Debug logging
  useEffect(() => {
    console.log("MobileDateSelector mounted with view mode:", propShowWeightView);
    console.log("Showing weight view:", internalShowWeightView);
  }, [propShowWeightView]);
  
  // Update local view state when prop changes
  useEffect(() => {
    setInternalShowWeightView(propShowWeightView);
  }, [propShowWeightView]);
  
  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash.startsWith('dates/')) {
        const subView = hash.split('/')[1];
        if (subView === 'calendar') {
          setInternalShowWeightView(false);
        } else if (subView === 'weight') {
          setInternalShowWeightView(true);
        }
      }
    };
    
    handleHashChange(); // Handle initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Handle clicks outside of date pickers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (singleDatePickerRef.current && !singleDatePickerRef.current.contains(event.target)) {
        setShowSingleDatePicker(false);
      }
      if (rangeDatePickerRef.current && !rangeDatePickerRef.current.contains(event.target)) {
        setShowRangeDatePicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  
  // Toggle between calendar and weight views
  const toggleWeightView = (value) => {
    if (value === internalShowWeightView) return;
    
    // Update local state immediately
    setInternalShowWeightView(value);
    
    // Update URL without waiting for server
    navigateToSubsection('dates', value ? 'weight' : 'calendar');
    
    // Notify parent
    onViewModeChange(value);
  };
  
  // Safely format a date - FIXED to handle date-fns version issues
  const formatDate = (date) => {
    try {
      if (!date) return "";
      
      // Ensure we're working with a valid Date object
      const dateObj = new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        console.error("Invalid date object:", date);
        return "Invalid date";
      }
      
      // Get date components manually to avoid date-fns version issues
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[dateObj.getMonth()];
      const day = dateObj.getDate();
      const year = dateObj.getFullYear();
      
      return `${month} ${day}, ${year}`;
    } catch (e) {
      console.error("Error formatting date:", e, date);
      return "Invalid date";
    }
  };
  
  // Add a single day to selected dates - FIXED with proper error handling
  const addSingleDay = () => {
    if (!selectedDate) return;
    
    try {
      // Make sure we have a valid Date object
      const currentSelectedDate = new Date(selectedDate);
      
      // Check if already exists - with safer comparison
      const exists = dayOffDates.some(dateItem => {
        // Ensure each date in the array is a proper Date object
        try {
          const existingDate = new Date(dateItem);
          return existingDate.getFullYear() === currentSelectedDate.getFullYear() &&
                 existingDate.getMonth() === currentSelectedDate.getMonth() &&
                 existingDate.getDate() === currentSelectedDate.getDate();
        } catch (e) {
          console.error("Error comparing dates:", e);
          return false;
        }
      });
      
      if (!exists) {
        // Create fresh date object to avoid reference issues
        const newDate = new Date(currentSelectedDate.getTime());
        const updatedDates = [...dayOffDates, newDate];
        
        // Update through props
        propSetDayOffDates(updatedDates);
        setSelectedDate(null);
      }
      
      // Close the date picker
      setShowSingleDatePicker(false);
    } catch (e) {
      console.error("Error in addSingleDay:", e);
    }
  };
  
  // Add a range of dates - FIXED with proper error handling
  const addDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    
    try {
      const newDates = [];
      let currentDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      // Safety check to prevent infinite loops
      const maxDays = 100;
      let dayCount = 0;
      
      while (currentDate <= endDate && dayCount < maxDays) {
        newDates.push(new Date(currentDate.getTime()));
        currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
      }
      
      // Filter out existing dates with safer comparison
      const uniqueDates = newDates.filter(newDate => {
        return !dayOffDates.some(dateItem => {
          try {
            const existingDate = new Date(dateItem);
            return existingDate.getFullYear() === newDate.getFullYear() &&
                   existingDate.getMonth() === newDate.getMonth() &&
                   existingDate.getDate() === newDate.getDate();
          } catch (e) {
            console.error("Error comparing dates in range filter:", e);
            return false;
          }
        });
      });
      
      if (uniqueDates.length > 0) {
        propSetDayOffDates([...dayOffDates, ...uniqueDates]);
      }
      
      setDateRange({ startDate: null, endDate: null });
      
      // Close the date picker
      setShowRangeDatePicker(false);
    } catch (e) {
      console.error("Error in addDateRange:", e);
    }
  };
  
  // Remove a specific date - FIXED with proper error handling
  const removeDate = (dateToRemove) => {
    try {
      // Ensure dateToRemove is a valid Date object
      const dateToRemoveObj = new Date(dateToRemove);
      
      // Filter with safer comparison
      const updatedDates = dayOffDates.filter(dateItem => {
        try {
          // Ensure each date in the array is treated as a Date object
          const existingDate = new Date(dateItem);
          return !(existingDate.getFullYear() === dateToRemoveObj.getFullYear() &&
                   existingDate.getMonth() === dateToRemoveObj.getMonth() &&
                   existingDate.getDate() === dateToRemoveObj.getDate());
        } catch (e) {
          console.error("Error comparing dates in removeDate:", e);
          return true; // Keep this item if we can't compare it
        }
      });
      
      propSetDayOffDates(updatedDates);
    } catch (e) {
      console.error("Error in removeDate:", e);
    }
  };
  
  // Update weight value
  const handleSetDaysWeight = (value) => {
    propSetDaysWeight(Number(value));
  };
  
  // Clear all selected dates
  const clearAllDates = () => {
    propSetDayOffDates([]);
  };
  
  // Handle navigation to next step
  const handleNext = () => {
    // If in date view with dates selected, go to weight view first
    if (!internalShowWeightView && dayOffDates.length > 0) {
      toggleWeightView(true);
      return;
    }
    
    // Otherwise proceed to next step
    onNext();
  };
  
  // Handle "No Date Preferences" option
  const handleNoPreferences = () => {
    // Update state
    propSetDayOffDates([]);
    propSetDaysWeight(0);
    
    // Navigate to next step
    onNext();
  };
  
  // Determine padding and spacing based on compact view
  const headerPadding = isCompactView ? 'p-2' : 'p-3';
  const sectionMargin = isCompactView ? 'mb-1.5' : 'mb-3';
  const contentPadding = isCompactView ? 'pt-1 pb-24' : 'pt-2 pb-28';
  const buttonPadding = isCompactView ? 'py-2' : 'py-3';
  const inputPadding = isCompactView ? 'py-1 px-2' : 'py-1.5 px-2';
  
  // Debug output
  console.log("Rendering MobileDateSelector", { internalShowWeightView, dayOffDates, daysWeight });
  
  // Date selection view
  if (!internalShowWeightView) {
    return (
      <div className="h-full flex flex-col">
        <div className={`flex-1 overflow-y-auto px-2 ${contentPadding}`}>
          {/* Standardized header with improved colors */}
          <div className={`${theme === 'dark' ? 'bg-indigo-900/80' : 'bg-indigo-100'} rounded-lg ${headerPadding} ${sectionMargin}`}>
            <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-indigo-100' : 'text-indigo-900'}`}>
              Which days do you need off?
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
              Select specific dates you need to have off
            </p>
          </div>
          
          <div className="flex-grow">
            {/* Single day picker with improved styling */}
            <div className={`mb-2`}>
              <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Add a single day:
              </label>
              <div className="flex gap-1">
                <div className="flex-1 relative" ref={singleDatePickerRef}>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={selectedDate ? formatDate(selectedDate) : ""}
                      placeholder="Select a date"
                      onClick={() => setShowSingleDatePicker(!showSingleDatePicker)}
                      className={`w-full ${theme === 'dark' 
                        ? 'bg-gray-700 text-white border border-gray-600' 
                        : 'bg-white text-gray-900 border border-gray-300'} rounded-l-md ${inputPadding} text-sm focus:outline-none`}
                    />
                    <button
                      onClick={() => setShowSingleDatePicker(!showSingleDatePicker)}
                      className={`${theme === 'dark' 
                        ? 'bg-gray-600 text-gray-200 border-gray-600' 
                        : 'bg-gray-100 text-gray-700 border-gray-300'} border border-l-0 rounded-r-md px-3`}
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Calendar modal for mobile */}
                  {showSingleDatePicker && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSingleDatePicker(false)}>
                      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 max-h-[80vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                        <DatePicker
                          selected={selectedDate}
                          onChange={(date) => {
                            setSelectedDate(date);
                            // Keep the picker open to let the user add the date with the button
                          }}
                          inline
                          dateFormat="MMM d, yyyy"
                          minDate={new Date()}
                          popperClassName={theme === 'dark' ? "dark-calendar" : ""}
                          calendarClassName={theme === 'dark' ? "dark-calendar" : ""}
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setShowSingleDatePicker(false)}
                            className={`flex-1 px-3 py-2 rounded-md text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              addSingleDay();
                              setShowSingleDatePicker(false);
                            }}
                            disabled={!selectedDate}
                            className={`flex-1 px-3 py-2 rounded-md text-sm ${selectedDate 
                              ? (theme === 'dark' ? 'bg-indigo-900 text-white' : 'bg-indigo-500 text-white')
                              : (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')}`}
                          >
                            Add Date
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={addSingleDay}
                  disabled={!selectedDate}
                  className={`px-3 rounded-md text-sm ${selectedDate 
                    ? (theme === 'dark' ? 'bg-indigo-900 text-white' : 'bg-indigo-500 text-white')
                    : (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')}`}
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Date range picker with improved styling */}
            <div className={`mb-2`}>
              <label className={`block text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Add a range:
              </label>
              <div className="flex gap-1">
                <div className="flex-1 relative" ref={rangeDatePickerRef}>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={dateRange.startDate && dateRange.endDate 
                        ? `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
                        : dateRange.startDate
                          ? `${formatDate(dateRange.startDate)} - Select end date`
                          : "Select date range"}
                      placeholder="Select date range"
                      onClick={() => setShowRangeDatePicker(!showRangeDatePicker)}
                      className={`w-full ${theme === 'dark' 
                        ? 'bg-gray-700 text-white border border-gray-600' 
                        : 'bg-white text-gray-900 border border-gray-300'} rounded-l-md ${inputPadding} text-sm focus:outline-none`}
                    />
                    <button
                      onClick={() => setShowRangeDatePicker(!showRangeDatePicker)}
                      className={`${theme === 'dark' 
                        ? 'bg-gray-600 text-gray-200 border-gray-600' 
                        : 'bg-gray-100 text-gray-700 border-gray-300'} border border-l-0 rounded-r-md px-3`}
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Calendar modal for mobile */}
                  {showRangeDatePicker && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowRangeDatePicker(false)}>
                      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 max-h-[80vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                        <DatePicker
                          selectsRange={true}
                          startDate={dateRange.startDate}
                          endDate={dateRange.endDate}
                          onChange={(update) => {
                            setDateRange({ startDate: update[0], endDate: update[1] });
                            // Keep open until user clicks "Add" button
                          }}
                          inline
                          dateFormat="MMM d, yyyy"
                          minDate={new Date()}
                          popperClassName={theme === 'dark' ? "dark-calendar" : ""}
                          calendarClassName={theme === 'dark' ? "dark-calendar" : ""}
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setShowRangeDatePicker(false)}
                            className={`flex-1 px-3 py-2 rounded-md text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              addDateRange();
                              setShowRangeDatePicker(false);
                            }}
                            disabled={!dateRange.startDate || !dateRange.endDate}
                            className={`flex-1 px-3 py-2 rounded-md text-sm ${(dateRange.startDate && dateRange.endDate) 
                              ? (theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white')
                              : (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')}`}
                          >
                            Add Range
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={addDateRange}
                  disabled={!dateRange.startDate || !dateRange.endDate}
                  className={`px-3 rounded-md text-sm ${(dateRange.startDate && dateRange.endDate) 
                    ? (theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white')
                    : (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')}`}
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Selected dates display with improved styling */}
            {dayOffDates.length > 0 ? (
              <div className={`mt-1 mb-3`}>
                <div className="flex justify-between items-center mb-1">
                  <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Selected ({dayOffDates.length}):
                  </p>
                  <button
                    onClick={clearAllDates}
                    className={theme === 'dark' ? "text-xs text-red-400" : "text-xs text-red-600"}
                  >
                    Clear
                  </button>
                </div>
                
                {/* List of selected dates with improved styling */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {dayOffDates.map((date, index) => {
                    // Safely format each date
                    const formattedDate = formatDate(date);
                    return (
                      <div 
                        key={index}
                        className={`${theme === 'dark' 
                          ? 'bg-indigo-800 text-indigo-100' 
                          : 'bg-indigo-100 text-indigo-800'} text-xs px-2 py-1 rounded-full flex items-center gap-0.5`}
                      >
                        {formattedDate}
                        <button
                          onClick={() => removeDate(date)}
                          className={theme === 'dark' ? "text-indigo-300 ml-1 hover:text-white" : "text-indigo-500 ml-1 hover:text-indigo-900"}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className={`mt-1 mb-3 p-2 ${theme === 'dark'
                ? 'bg-amber-900/20 border-l-4 border-amber-600 rounded-md'
                : 'bg-amber-50 border-l-4 border-amber-300 rounded-md'}`}>
                <p className={theme === 'dark' ? "text-xs text-amber-200" : "text-xs text-amber-800"}>
                  Add dates above or select "No Date Preferences" if you don't have specific days off.
                </p>
              </div>
            )}
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
              {dayOffDates.length > 0 ? (
                <button 
                  onClick={handleNext}
                  className={`flex-1 ${theme === 'dark'
                    ? "bg-indigo-900 text-white" : "bg-indigo-500 text-white"}
                    ${buttonPadding} rounded-lg font-medium`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleNoPreferences}
                  className={`flex-1 ${theme === 'dark'
                    ? "bg-indigo-900 text-white" : "bg-indigo-500 text-white"}
                    ${buttonPadding} rounded-lg font-medium`}
                >
                  No Date Preferences
                </button>
              )}
            </div>
          </div>
      </div>
    );
  }
  
  // Weight setting view with improved styling
  return (
    <div className="h-full flex flex-col">
      <div className={`flex-1 overflow-y-auto px-2 ${contentPadding}`}>
        <div className={`${theme === 'dark' ? 'bg-indigo-900/80' : 'bg-indigo-100'} ${headerPadding} rounded-lg ${sectionMargin}`}>
          <h3 className={`text-base font-medium mb-0.5 ${theme === 'dark' ? 'text-indigo-100' : 'text-indigo-900'}`}>
            How important are these days off?
          </h3>
        </div>
        
        <div className="flex-grow mb-20">
          <div className={`${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white'} p-3 rounded-lg shadow mb-3 text-sm`}>
            <p className={`${theme === 'dark' ? "text-indigo-300" : "text-indigo-700"} font-medium mb-1.5`}>Selected days ({dayOffDates.length}):</p>
            
            {/* Sample of selected dates (show first 3) with improved styling */}
            {dayOffDates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {dayOffDates.slice(0, 3).map((date, index) => {
                  // Safely format each date
                  const formattedDate = formatDate(date);
                  return (
                    <div 
                      key={index}
                      className={theme === 'dark' 
                        ? "bg-indigo-900 text-white px-2 py-1 rounded-full text-xs" 
                        : "bg-indigo-500 text-white px-2 py-1 rounded-full text-xs"}
                    >
                      {formattedDate}
                    </div>
                  );
                })}
                {dayOffDates.length > 3 && (
                  <div className={theme === 'dark' 
                    ? "bg-indigo-800/60 text-indigo-100 text-xs px-2 py-1 rounded-full" 
                    : "bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"}>
                    +{dayOffDates.length - 3} more
                  </div>
                )}
              </div>
            )}
            
            {/* Weight buttons with improved styling */}
            <div className="space-y-1.5">
              {[
                { label: 'Not Important', desc: 'Nice to have but not required', value: 0 },
                { label: 'Somewhat Important', desc: 'Prefer these days off', value: 1.5 },
                { label: 'Important', desc: 'Strongly prefer these days off', value: 3 },
                { label: 'Essential', desc: 'Must have these days off', value: 5 },
              ].map(({ label, desc, value }) => (
                <button 
                  key={value}
                  onClick={() => handleSetDaysWeight(value)}
                  className={`w-full ${isCompactView ? 'p-2' : 'p-2.5'} rounded-lg text-left flex justify-between items-center transition-all duration-200
                    ${Number(daysWeight) === Number(value) 
                      ? (theme === 'dark' 
                          ? "bg-indigo-900 text-white ring-1 ring-indigo-400" 
                          : "bg-indigo-500 text-white ring-1 ring-indigo-300")
                      : (theme === 'dark' 
                          ? "bg-gray-700/80 text-gray-100 hover:bg-gray-600/80" 
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300")}`}
                >
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs opacity-80">{desc}</div>
                  </div>
                  {Number(daysWeight) === Number(value) && (
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-400' : 'bg-white'}`}>
                      <svg className={`h-3 w-3 ${theme === 'dark' ? 'text-indigo-900' : 'text-indigo-600'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className={`${theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100'} p-2 rounded-lg mb-3`}>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {Number(daysWeight) === 0 && "All days will be treated equally."}
              {Number(daysWeight) === 1.5 && "Selected days get a slight boost."}
              {Number(daysWeight) === 3 && "Selected days strongly preferred."}
              {Number(daysWeight) === 5 && "Only shows schedules with these days off."}
            </p>
          </div>
        </div>
        
      </div>
      
      {/* Bottom section - fixed at viewport bottom */}
      <div className={`fixed bottom-0 left-0 right-0 p-2 pb-4 ${styles.pageBg} z-50 shadow-lg safe-area-inset-bottom`}>
          <div className="flex gap-2">
            <button
              onClick={() => toggleWeightView(false)}
              className={`flex-1 ${theme === 'dark' 
                ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} 
                ${buttonPadding} rounded-lg font-medium`}
            >
              Back
            </button>
            <button 
              onClick={onNext}
              className={`flex-1 ${theme === 'dark'
                ? "bg-indigo-900 text-white" : "bg-indigo-500 text-white"}
                ${buttonPadding} rounded-lg font-medium`}
            >
              Next
            </button>
          </div>
        </div>
    </div>
  );
}