// src/components/wizard/steps/DesktopDateSelector.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "@/components/mobile/steps/datepicker-dark.css";
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useWizardState } from '@/contexts/WizardStateContext';
import { useFilter } from '@/contexts/FilterContext';
import { motion } from 'framer-motion';

interface DesktopDateSelectorProps {
  dayOffDates: Date[];
  setDayOffDates: (dates: Date[]) => void;
  daysWeight: number;
  setDaysWeight: (weight: number) => void;
  onNext: () => void;
  onBack?: () => void;
  showWeightView?: boolean;
  onViewModeChange?: (mode: boolean) => void;
}

export default function DesktopDateSelector(props: DesktopDateSelectorProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const { state, updateState, updateNestedState } = useWizardState();
  const { navigateToSection, navigateToSubsection } = useFilter();
  
  // Use props for backward compatibility but prefer context state
  const dayOffDates = props.dayOffDates || state.dayOffDates || [];
  const daysWeight = props.daysWeight ?? state.weights?.daysWeight ?? 0;
  
  // Initial view mode from props or context
  const initViewMode = props.showWeightView ?? state.subModes?.dateSelector?.showWeightView ?? false;
  const [localShowWeightView, setLocalShowWeightView] = useState(initViewMode);
  
  // Local state for date picking
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null
  });

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash.startsWith('dates/')) {
        const subView = hash.split('/')[1];
        if (subView === 'calendar') {
          setLocalShowWeightView(false);
        } else if (subView === 'weight') {
          setLocalShowWeightView(true);
        }
      }
    };
    
    handleHashChange(); // Handle initial hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync prop → local
  useEffect(() => {
    setLocalShowWeightView(props.showWeightView ?? false);
  }, [props.showWeightView]);

  // Notify parent and update context
  const handleViewModeChange = (showWeightView: boolean) => {
    setLocalShowWeightView(showWeightView);
    
    // Update URL hash based on view
    navigateToSubsection('dates', showWeightView ? 'weight' : 'calendar');
    
    // Update context
    updateNestedState('subModes', { 
      dateSelector: { showWeightView } 
    });
    
    // Call prop callback if available
    if (props.onViewModeChange) {
      props.onViewModeChange(showWeightView);
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') props.onNext?.();
    if (e.key === 'ArrowLeft' && props.onBack) props.onBack();
  }, [props.onNext, props.onBack]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update options
  const importanceOptions = [
    { value: 0,   label: 'Not Important',     desc: 'Nice to have but not required' },
    { value: 1.5, label: 'Somewhat Important', desc: 'Prefer these days off' },
    { value: 3,   label: 'Important',         desc: 'Strongly prefer these days off' },
    { value: 5,   label: 'Essential',         desc: 'Must have these days off' },
  ];
  
  // Safe date formatting
  const formatDate = (d: Date) => {
    try {
      if (!(d instanceof Date) || isNaN(d.getTime())) {
        return "Invalid date";
      }
      return format(d, 'EEE, MMM d, yyyy');
    } catch (e) {
      return "Invalid date";
    }
  };

  // Add a single day
  const addSingleDay = () => {
    if (
      selectedDate instanceof Date &&
      !isNaN(selectedDate.getTime()) &&
      !dayOffDates.some(d =>
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate()
      )
    ) {
      // Create a fresh date object to avoid reference issues
      const newDate = new Date(selectedDate.getTime());
      const updatedDates = [...dayOffDates, newDate];
      
      // Update through props
      props.setDayOffDates(updatedDates);
      
      // Update context
      updateState({ dayOffDates: updatedDates });
      
      setSelectedDate(null);
    }
  };

  // Add date range
  const addDateRange = () => {
    const { startDate, endDate } = dateRange;
    if (!startDate || !endDate) return;

    if (!(startDate instanceof Date) || isNaN(startDate.getTime()) ||
        !(endDate instanceof Date) || isNaN(endDate.getTime())) {
      return;
    }

    const newDates: Date[] = [];
    let cursor = new Date(startDate.getTime());
    
    const maxIterations = 100; // Safety limit
    let iterations = 0;
    
    while (cursor <= endDate && iterations < maxIterations) {
      newDates.push(new Date(cursor.getTime()));
      cursor.setDate(cursor.getDate() + 1);
      iterations++;
    }

    // Filter out duplicates
    const uniqueDates = newDates.filter(nd =>
      nd instanceof Date &&
      !isNaN(nd.getTime()) &&
      !dayOffDates.some(d =>
        d.getFullYear() === nd.getFullYear() &&
        d.getMonth() === nd.getMonth() &&
        d.getDate() === nd.getDate()
      )
    );

    const updatedDates = [...dayOffDates, ...uniqueDates];
    
    // Update through props
    props.setDayOffDates(updatedDates);
    
    // Update context
    updateState({ dayOffDates: updatedDates });
    
    setDateRange({ startDate: null, endDate: null });
  };

  // Remove a date
  const removeDate = (toRemove: Date) => {
    if (!(toRemove instanceof Date) || isNaN(toRemove.getTime())) return;
    
    const updatedDates = dayOffDates.filter(d =>
      !(
        d instanceof Date && 
        !isNaN(d.getTime()) &&
        d.getFullYear() === toRemove.getFullYear() &&
        d.getMonth() === toRemove.getMonth() &&
        d.getDate() === toRemove.getDate()
      )
    );
    
    // Update through props
    props.setDayOffDates(updatedDates);
    
    // Update context
    updateState({ dayOffDates: updatedDates });
  };

  // Weight change handler
  const handleSetDaysWeight = (value: number) => {
    props.setDaysWeight(value);
    
    // Update nested weights in context
    updateNestedState('weights', { daysWeight: value });
  };

  // Normalized dates for safety
  const normalizedDates: Date[] = Array.isArray(dayOffDates) 
    ? dayOffDates
        .filter(d => d !== null && d !== undefined)
        .map(d => d instanceof Date ? d : new Date(d))
        .filter(d => d instanceof Date && !isNaN(d.getTime()))
    : [];

  return (
    <div className="h-full">
      <motion.div
        key={`date-selector-${localShowWeightView ? 'importance' : 'calendar'}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-md h-full`}
      >
        {!localShowWeightView ? (
          <>
            {/* --- Calendar + Range View --- */}
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Select Days Off
            </h2>
            <div className="flex flex-col xl:flex-row gap-6">

              {/* Left: Single & Range Picker */}
              <div className="xl:w-2/3 space-y-6">
                {/* Single Day Picker */}
                <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-medium mb-3 ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    Add Individual Day
                  </h3>
                  <div className="flex gap-3">
                    <DatePicker
                      selected={selectedDate}
                      onChange={(d: Date) => setSelectedDate(d)}
                      className={`flex-1 p-2.5 text-sm rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}
                      placeholderText="Select a date"
                      dateFormat="MMMM d, yyyy"
                      minDate={new Date()}
                      popperClassName={theme === 'dark' ? 'dark-calendar' : ''}
                      calendarClassName={theme === 'dark' ? 'dark-calendar-desktop' : ''}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addSingleDay}
                      disabled={!selectedDate}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium ${
                        selectedDate
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Add Day
                    </motion.button>
                  </div>
                </div>

                {/* Date Range Picker */}
                <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-medium mb-3 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                    Add Date Range
                  </h3>
                  <div className="flex gap-3 items-end">
                    <DatePicker
                      selectsRange
                      startDate={dateRange.startDate}
                      endDate={dateRange.endDate}
                      onChange={(update: [Date | null, Date | null]) =>
                        setDateRange({ startDate: update[0], endDate: update[1] })
                      }
                      className={`flex-1 p-2.5 text-sm rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}
                      placeholderText="Select date range"
                      dateFormat="MMMM d, yyyy"
                      minDate={new Date()}
                      popperClassName={theme === 'dark' ? 'dark-calendar' : ''}
                      calendarClassName={theme === 'dark' ? 'dark-calendar-desktop' : ''}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={addDateRange}
                      disabled={!dateRange.startDate || !dateRange.endDate}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium ${
                        dateRange.startDate && dateRange.endDate
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Add Range
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Right: Selected Days Panel */}
              <div className={`xl:w-1/3 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-5`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    Selected Days ({normalizedDates.length})
                  </h3>
                  {normalizedDates.length > 0 && (
                    <button
                      onClick={() => {
                        props.setDayOffDates([]);
                        updateState({ dayOffDates: [] });
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        theme === 'dark'
                          ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {normalizedDates.length > 0 ? (
                  <div className="max-h-[450px] overflow-y-auto pr-2 space-y-2">
                    {normalizedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((d, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                          } transition-colors`}
                        >
                          <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                            {formatDate(d)}
                          </span>
                          <button
                            onClick={() => removeDate(d)}
                            className={`p-1 rounded-full ${
                              theme === 'dark' ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'
                            }`}
                            aria-label="Remove date"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </motion.div>
                      ))}
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center h-64 text-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm mb-1">No dates selected yet</p>
                    <p className="text-xs opacity-80">Use the options on the left to add dates</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between mt-8">
              {props.onBack && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={props.onBack}
                  className={`px-5 py-3 text-sm font-semibold rounded-md ${
                    theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </motion.button>
              )}
              <div className="flex gap-3">
                {normalizedDates.length > 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleViewModeChange(true)}
                    className={`px-6 py-3 text-base font-semibold rounded-md ${
                      theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Set Importance
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={props.onNext}
                    className={`px-6 py-3 text-base font-semibold rounded-md ${
                      theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    No Date Preferences
                  </motion.button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Importance View - Updated to match group selector style */}
            <h2 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              How important are these days off to you?
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {importanceOptions.map(({ value, label, desc }) => (
                <motion.button
                  key={value}
                  onClick={() => handleSetDaysWeight(Number(value))}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full p-4 rounded-lg text-left transition-colors relative overflow-hidden
                    ${Number(daysWeight) === value
                      ? theme === 'dark' 
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-500 text-white'
                      : theme === 'dark'
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <div className="flex flex-col">
                    <span className="text-lg font-medium">{label}</span>
                    <span className="text-sm opacity-80 mt-1">{desc}</span>
                  </div>
                  
                  {Number(daysWeight) === value && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewModeChange(false)}
                className={`px-5 py-3 text-sm font-semibold rounded-md ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back to Calendar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={props.onNext}
                className={`px-6 py-3 text-base font-semibold rounded-md ${
                  theme === 'dark' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Next
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}