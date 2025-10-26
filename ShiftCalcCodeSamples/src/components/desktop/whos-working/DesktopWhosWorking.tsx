// src/components/desktop/whos-working/DesktopWhosWorking.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import Image from "next/image";
import ModeToggle from "@/components/common/ModeToggle";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DesktopWhosWorkingProps {
  onModeChange: (mode: any) => void;
  currentMode: any;
}

interface WorkingOfficer {
  line: string;
  operation: string;
  shift: string;
  name?: string;
  startTime?: string;
  endTime?: string;
}

export default function DesktopWhosWorking({ onModeChange, currentMode }: DesktopWhosWorkingProps) {
  const { theme, toggleTheme } = useTheme();
  const styles = useThemeStyles();
  
  // State management
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedOperation, setSelectedOperation] = useState<string>("All");
  const [operations, setOperations] = useState<any[]>([]);
  const [workingOfficers, setWorkingOfficers] = useState<WorkingOfficer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch operations on mount
  useEffect(() => {
    fetchOperations();
    fetchWorkingOfficers();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWorkingOfficers();
    }, 5 * 60 * 1000);
    
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedDate, selectedOperation]);

  const fetchOperations = async () => {
    try {
      const response = await fetch("/api/operations");
      const data = await response.json();
      setOperations(data.operations || []);
    } catch (err) {
      setError("Failed to load operations");
    }
  };

  const fetchWorkingOfficers = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const params = new URLSearchParams({
        date: dateStr,
        ...(selectedOperation !== "All" && { operation: selectedOperation })
      });
      
      const response = await fetch(`/api/whos-working?${params.toString()}`);
      const data = await response.json();
      
      if (data.officers) {
        setWorkingOfficers(data.officers);
      } else {
        setError("No data available");
      }
    } catch (err) {
      setError("Failed to fetch working officers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleOperationChange = (operation: string) => {
    setSelectedOperation(operation);
  };

  useEffect(() => {
    if (selectedDate) {
      fetchWorkingOfficers();
    }
  }, [selectedDate, selectedOperation]);

  const groupOfficersByShift = () => {
    const grouped: { [key: string]: WorkingOfficer[] } = {};
    
    workingOfficers.forEach(officer => {
      const shift = officer.shift || "Unknown";
      if (!grouped[shift]) {
        grouped[shift] = [];
      }
      grouped[shift].push(officer);
    });
    
    return grouped;
  };

  const groupedOfficers = groupOfficersByShift();
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const getShiftIcon = (shift: string) => {
    if (shift.toLowerCase().includes('day')) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    } else if (shift.toLowerCase().includes('night') || shift.toLowerCase().includes('mid')) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    } else if (shift.toLowerCase().includes('evening')) {
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden ${styles.bodyBg}`}>
      {/* Header */}
      <div className={`p-4 border-b ${styles.borderDefault} ${styles.cardBg} flex justify-between items-center`}>
        <div className="h-16 w-auto">
          {theme === 'dark' ? (
            <Image 
              src="/images/logo-dark.png" 
              alt="ShiftCalc" 
              width={240} 
              height={64} 
              className="h-full w-auto object-contain"
              priority
            />
          ) : (
            <Image 
              src="/images/logo.png" 
              alt="ShiftCalc" 
              width={240} 
              height={64}
              className="h-full w-auto object-contain"
              priority
            />
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Auto-refresh indicator */}
          <div className="flex items-center bg-opacity-75 px-2 py-1 rounded-full">
            <div className={`w-2 h-2 ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'} rounded-full mr-1.5`}></div>
            <span className={`text-xs ${isLoading ? styles.textAccent : styles.textMuted}`}>
              {isLoading ? 'Updating' : 'Live'}
            </span>
          </div>
          
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${styles.buttonSecondary}`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          
          <ModeToggle
            currentMode={currentMode}
            onChange={onModeChange}
          />
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className={`w-1/4 h-full overflow-auto ${styles.secondaryBg} p-4 space-y-4`}>
          {/* Info card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-5 shadow-md ${styles.cardBg} border ${styles.borderDefault}`}
          >
            <h3 className={`font-bold text-lg mb-3 ${styles.textPrimary}`}>
              Who's Working
            </h3>
            <p className={`mb-4 ${styles.textSecondary}`}>
              View officers currently on duty or scheduled for a specific date.
            </p>
            
            <div className={`${styles.statRose} p-3 rounded-lg`}>
              <h4 className={`font-medium mb-2`}>Quick Info</h4>
              <ul className={`list-disc pl-5 text-sm space-y-1`}>
                <li>View by date and operation</li>
                <li>See shift assignments</li>
                <li>Auto-refreshes every 5 minutes</li>
                <li>Filter by specific operations</li>
                <li>Admin access only</li>
              </ul>
            </div>
          </motion.div>
          
          {/* Date & Operation Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-lg p-5 shadow-md ${styles.cardBg} border ${styles.borderDefault}`}
          >
            <h3 className={`font-bold text-lg mb-3 ${styles.textPrimary}`}>
              Filters
            </h3>
            
            {/* Date Picker */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${styles.textSecondary}`}>
                Select Date
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                inline
                className={`${theme === 'dark' ? 'dark-calendar-desktop' : ''}`}
                calendarClassName={`${theme === 'dark' ? 'dark-calendar-desktop' : ''}`}
              />
            </div>
            
            {/* Operation Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${styles.textSecondary}`}>
                Operation
              </label>
              <select
                value={selectedOperation}
                onChange={(e) => handleOperationChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg ${styles.inputBg} ${styles.textPrimary}`}
              >
                <option value="All">All Operations</option>
                {operations.map((op) => (
                  <option key={op.id || op.name} value={op.name}>
                    {op.name}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-lg p-5 shadow-md ${styles.cardBg} border ${styles.borderDefault}`}
          >
            <h3 className={`font-bold text-lg mb-3 ${styles.textPrimary}`}>
              Summary
            </h3>
            <div className="space-y-2">
              <div className={`p-2 rounded ${styles.statBlue}`}>
                <p className="text-2xl font-bold">{workingOfficers.length}</p>
                <p className="text-sm">Total Working</p>
              </div>
              <div className={`p-2 rounded ${styles.statTeal}`}>
                <p className="text-lg font-semibold">{Object.keys(groupedOfficers).length}</p>
                <p className="text-sm">Different Shifts</p>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 h-full overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${styles.textPrimary}`}>
                {isToday ? "Today's Schedule" : `Schedule for ${selectedDate.toLocaleDateString()}`}
              </h2>
              
              <button
                onClick={fetchWorkingOfficers}
                className={`${styles.buttonSecondary} px-4 py-2 rounded-lg flex items-center gap-2`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className={`p-4 rounded-lg ${styles.errorBg} ${styles.errorText}`}>
                {error}
              </div>
            ) : workingOfficers.length === 0 ? (
              <div className={`${styles.warningBg} border ${styles.warningBorder} rounded-lg p-6 text-center`}>
                <p className={`${styles.warningText}`}>
                  No officers scheduled for this date.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedOfficers).map(([shift, officers]) => (
                  <motion.div
                    key={shift}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${styles.cardBg} rounded-lg border ${styles.borderDefault} overflow-hidden`}
                  >
                    <div className={`px-4 py-3 ${styles.secondaryBg} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        {getShiftIcon(shift)}
                        <h3 className={`font-semibold ${styles.textPrimary}`}>
                          {shift} Shift
                        </h3>
                        <span className={`text-sm ${styles.textMuted}`}>
                          ({officers.length} officers)
                        </span>
                      </div>
                      {shift !== "Unknown" && (
                        <span className={`text-sm ${styles.textSecondary}`}>
                          {officers[0]?.startTime || "00:00"} - {officers[0]?.endTime || "00:00"}
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {officers.map((officer, idx) => (
                          <motion.div
                            key={`${officer.line}-${idx}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className={`${styles.tertiaryBg} rounded-lg p-3`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className={`font-medium ${styles.textPrimary}`}>
                                  Line {officer.line}
                                </p>
                                <p className={`text-sm ${styles.textSecondary}`}>
                                  {officer.operation}
                                </p>
                                {officer.name && (
                                  <p className={`text-xs ${styles.textMuted} mt-1`}>
                                    {officer.name}
                                  </p>
                                )}
                              </div>
                              <div className={`w-2 h-2 rounded-full ${styles.successBg} mt-1`}></div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}