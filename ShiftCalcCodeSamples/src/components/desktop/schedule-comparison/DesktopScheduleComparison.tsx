// src/components/desktop/schedule-comparison/DesktopScheduleComparison.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import Image from "next/image";
import ModeToggle from "@/components/common/ModeToggle";
import { motion } from "framer-motion";

interface DesktopScheduleComparisonProps {
  onModeChange: (mode: any) => void;
  currentMode: any;
}

interface Schedule {
  id: string;
  operation: string;
  line: string;
  pattern: string;
  shiftType: string;
  rotationDays: number;
  daysOff: number;
  weekendDays: number;
  holidays: number;
}

export default function DesktopScheduleComparison({ onModeChange, currentMode }: DesktopScheduleComparisonProps) {
  const { theme, toggleTheme } = useTheme();
  const styles = useThemeStyles();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [operations, setOperations] = useState<any[]>([]);
  const [operationLines, setOperationLines] = useState<{ [key: string]: string[] }>({});
  const [selectedSchedules, setSelectedSchedules] = useState<Schedule[]>([]);
  const [availableSchedules, setAvailableSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [allSchedules, setAllSchedules] = useState<any[]>([]);

  // Fetch operations on mount
  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    setIsLoading(true);
    try {
      // Fetch operations/groups
      const groupsResponse = await fetch("/api/groups");
      if (!groupsResponse.ok) {
        throw new Error("Failed to fetch operations");
      }
      const groups = await groupsResponse.json();
      
      // Fetch all schedules to get lines per operation
      console.log('Making request to /api/schedules...');
      const schedulesResponse = await fetch('/api/schedules');
      console.log('Schedules response status:', schedulesResponse.status);
      
      if (!schedulesResponse.ok) {
        console.error('Schedules API failed:', schedulesResponse.status, schedulesResponse.statusText);
        const errorText = await schedulesResponse.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch schedules: ${schedulesResponse.status} ${schedulesResponse.statusText}`);
      }
      const schedules = await schedulesResponse.json();
      console.log(`Loaded ${schedules.length} schedules from API`);
      setAllSchedules(schedules);
      
      // Organize lines by operation
      const linesByOperation: { [key: string]: string[] } = {};
      schedules.forEach((schedule: any) => {
        if (!linesByOperation[schedule.GROUP]) {
          linesByOperation[schedule.GROUP] = [];
        }
        const lineStr = schedule.LINE.toString();
        if (!linesByOperation[schedule.GROUP].includes(lineStr)) {
          linesByOperation[schedule.GROUP].push(lineStr);
        }
      });
      
      // Sort lines for each operation
      Object.keys(linesByOperation).forEach(op => {
        linesByOperation[op].sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.localeCompare(b);
        });
      });
      
      setOperationLines(linesByOperation);
      
      // Transform groups into operations format
      const operationsData = groups.map((groupName: string) => ({
        id: groupName,
        name: groupName,
        lineCount: linesByOperation[groupName]?.length || 0
      }));
      setOperations(operationsData);
    } catch (err) {
      setError("Failed to load operations");
      console.error("Error fetching operations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScheduleDetails = async (operation: string, line: string) => {
    try {
      // Debug logging
      console.log(`Looking for schedule: GROUP=${operation}, LINE=${line}`);
      console.log(`Total schedules loaded: ${allSchedules.length}`);
      if (allSchedules.length > 0) {
        console.log('Sample schedule structure:', allSchedules[0]);
      }
      
      // Use already loaded schedules
      const matchingSchedule = allSchedules.find((s: any) => 
        s.GROUP === operation && s.LINE.toString() === line.toString()
      );
      
      if (!matchingSchedule) {
        console.error("No matching schedule found");
        console.log('Available schedules:', allSchedules.map(s => ({GROUP: s.GROUP, LINE: s.LINE})));
        return null;
      }
      
      // Calculate schedule metrics
      let totalDaysOff = 0;
      let weekendDays = 0;
      let pattern = "";
      let shiftTypes = new Set<string>();
      
      // Analyze the 56-day rotation pattern
      for (let i = 1; i <= 56; i++) {
        const dayKey = `DAY_${String(i).padStart(3, '0')}`;
        const shiftCode = matchingSchedule[dayKey];
        
        if (shiftCode === 'OFF' || shiftCode === 'X') {
          totalDaysOff++;
          // Check if it's a weekend (simplified - every 7th and 1st day)
          if (i % 7 === 0 || i % 7 === 1) {
            weekendDays++;
          }
        } else if (shiftCode && shiftCode !== '') {
          shiftTypes.add(shiftCode);
        }
      }
      
      // Calculate annual metrics (365 days / 56 days * metrics)
      const rotationMultiplier = 365 / 56;
      const annualDaysOff = Math.round(totalDaysOff * rotationMultiplier);
      const annualWeekendDays = Math.round(weekendDays * rotationMultiplier);
      
      // Parse holidays data if available
      let holidayCount = 0;
      if (matchingSchedule.holidays_on) {
        // Count the number of holidays worked
        holidayCount = matchingSchedule.holidays_on;
      }
      
      // Determine pattern (simplified)
      if (totalDaysOff >= 20) {
        pattern = "4 on 2 off";
      } else if (totalDaysOff >= 16) {
        pattern = "5 on 2 off";
      } else {
        pattern = "Various";
      }
      
      // Determine shift type
      const shiftType = shiftTypes.size === 1 ? 
        Array.from(shiftTypes)[0] : 
        `Various (${shiftTypes.size} types)`;
      
      return {
        pattern,
        shiftType,
        rotationDays: 56,
        daysOff: annualDaysOff,
        weekendDays: annualWeekendDays,
        holidays: holidayCount
      };
    } catch (err) {
      console.error("Failed to fetch schedule details:", err);
      return null;
    }
  };

  const addSchedule = async (operation: string, line: string) => {
    const details = await fetchScheduleDetails(operation, line);
    if (details) {
      const newSchedule: Schedule = {
        id: `${operation}-${line}`,
        operation,
        line,
        pattern: details.pattern || "Unknown",
        shiftType: details.shiftType || "Various",
        rotationDays: details.rotationDays || 0,
        daysOff: details.daysOff || 0,
        weekendDays: details.weekendDays || 0,
        holidays: details.holidays || 0
      };
      
      setSelectedSchedules([...selectedSchedules, newSchedule]);
      
      if (selectedSchedules.length === 0) {
        setCurrentStep(2);
      }
    }
  };

  const removeSchedule = (id: string) => {
    setSelectedSchedules(selectedSchedules.filter(s => s.id !== id));
    if (selectedSchedules.length === 1) {
      setCurrentStep(1);
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "Select Schedules",
          description: "Choose up to 4 schedules to compare side by side.",
          tips: [
            "Select different lines to compare options",
            "Compare schedules from different operations",
            "Look at days off patterns",
            "Consider shift types and weekend work",
            "Maximum of 4 schedules for comparison"
          ]
        };
      case 2:
        return {
          title: "Compare Schedules",
          description: "View your selected schedules side by side.",
          tips: [
            "Compare total days off per year",
            "Look at weekend coverage requirements",
            "Check shift type distributions",
            "Consider holiday work patterns",
            "Add more schedules to compare"
          ]
        };
      default:
        return { title: "", description: "", tips: [] };
    }
  };

  const stepInfo = getStepInfo();

  const getComparisonColor = (value: number, otherValues: number[], higherBetter: boolean = true) => {
    const max = Math.max(...otherValues);
    const min = Math.min(...otherValues);
    
    if (value === max && higherBetter) return styles.successText;
    if (value === min && !higherBetter) return styles.successText;
    if (value === max && !higherBetter) return styles.errorText;
    if (value === min && higherBetter) return styles.errorText;
    return styles.textPrimary;
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
          {/* Step info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-5 shadow-md ${styles.cardBg} border ${styles.borderDefault}`}
          >
            <h3 className={`font-bold text-lg mb-3 ${styles.textPrimary}`}>
              {stepInfo.title}
            </h3>
            <p className={`mb-4 ${styles.textSecondary}`}>
              {stepInfo.description}
            </p>
            
            <div className={`${styles.statIndigo} p-3 rounded-lg`}>
              <h4 className={`font-medium mb-2`}>Pro Tips</h4>
              <ul className={`list-disc pl-5 text-sm space-y-1`}>
                {stepInfo.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </motion.div>
          
          {/* Selected schedules */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-lg p-5 shadow-md ${styles.cardBg} border ${styles.borderDefault}`}
          >
            <h3 className={`font-bold text-lg mb-3 ${styles.textPrimary}`}>
              Selected Schedules ({selectedSchedules.length}/4)
            </h3>
            
            {selectedSchedules.length === 0 ? (
              <p className={`text-sm ${styles.textMuted} italic`}>
                No schedules selected yet
              </p>
            ) : (
              <div className="space-y-2">
                {selectedSchedules.map((schedule) => (
                  <div key={schedule.id} className={`p-2 rounded ${styles.tertiaryBg} flex justify-between items-center`}>
                    <div>
                      <p className={`font-medium ${styles.textPrimary}`}>
                        {schedule.operation} - {schedule.line}
                      </p>
                      <p className={`text-xs ${styles.textMuted}`}>
                        {schedule.pattern}
                      </p>
                    </div>
                    <button
                      onClick={() => removeSchedule(schedule.id)}
                      className={`text-red-500 hover:text-red-600`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {selectedSchedules.length > 0 && selectedSchedules.length < 4 && (
              <button
                onClick={() => setCurrentStep(1)}
                className={`mt-4 text-sm ${styles.textAccent} hover:underline`}
              >
                + Add Another Schedule
              </button>
            )}
          </motion.div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 h-full overflow-auto p-6">
          {/* Schedule Selection */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className={`text-2xl font-bold mb-6 ${styles.textPrimary}`}>
                Select Schedules to Compare
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className={`p-4 rounded-lg ${styles.errorBg} ${styles.errorText}`}>
                  {error}
                </div>
              ) : (
                <div className="space-y-6">
                  {operations.map((op) => (
                    <div key={op.id || op.name} className={`${styles.cardBg} rounded-lg p-4 border ${styles.borderDefault}`}>
                      <h3 className={`font-semibold text-lg mb-3 ${styles.textPrimary}`}>
                        {op.name}
                      </h3>
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                        {[...Array(op.lineCount || 30)].map((_, idx) => {
                          const lineNum = `${idx + 1}`.padStart(2, '0');
                          const scheduleId = `${op.name}-${lineNum}`;
                          const isSelected = selectedSchedules.some(s => s.id === scheduleId);
                          const isDisabled = selectedSchedules.length >= 4 && !isSelected;
                          
                          return (
                            <motion.button
                              key={lineNum}
                              whileHover={!isDisabled ? { scale: 1.05 } : {}}
                              whileTap={!isDisabled ? { scale: 0.95 } : {}}
                              onClick={() => !isDisabled && !isSelected && addSchedule(op.name, lineNum)}
                              disabled={isDisabled}
                              className={`
                                p-2 rounded transition-all text-sm font-medium
                                ${isSelected 
                                  ? styles.groupButtonSelected 
                                  : isDisabled
                                    ? `${styles.buttonDisabled} opacity-50`
                                    : styles.groupButtonUnselected
                                }
                              `}
                            >
                              {lineNum}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedSchedules.length >= 2 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className={`${styles.buttonPrimary} px-8 py-3 rounded-lg font-medium`}
                  >
                    Compare Schedules
                  </button>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Comparison View */}
          {currentStep === 2 && selectedSchedules.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-6xl mx-auto"
            >
              <h2 className={`text-2xl font-bold mb-6 ${styles.textPrimary}`}>
                Schedule Comparison
              </h2>
              
              {/* Comparison Table */}
              <div className={`${styles.cardBg} rounded-lg overflow-hidden border ${styles.borderDefault}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${styles.secondaryBg}`}>
                      <tr>
                        <th className={`p-4 text-left ${styles.textPrimary} font-semibold`}>
                          Attribute
                        </th>
                        {selectedSchedules.map((schedule) => (
                          <th key={schedule.id} className={`p-4 text-center ${styles.textPrimary} font-semibold`}>
                            <div>
                              <div>{schedule.operation}</div>
                              <div className={`text-sm ${styles.textMuted}`}>Line {schedule.line}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-t ${styles.borderLight}`}>
                        <td className={`p-4 ${styles.textSecondary}`}>Pattern</td>
                        {selectedSchedules.map((schedule) => (
                          <td key={schedule.id} className={`p-4 text-center ${styles.textPrimary}`}>
                            {schedule.pattern}
                          </td>
                        ))}
                      </tr>
                      
                      <tr className={`border-t ${styles.borderLight}`}>
                        <td className={`p-4 ${styles.textSecondary}`}>Shift Type</td>
                        {selectedSchedules.map((schedule) => (
                          <td key={schedule.id} className={`p-4 text-center ${styles.textPrimary}`}>
                            {schedule.shiftType}
                          </td>
                        ))}
                      </tr>
                      
                      <tr className={`border-t ${styles.borderLight}`}>
                        <td className={`p-4 ${styles.textSecondary}`}>Rotation Days</td>
                        {selectedSchedules.map((schedule) => (
                          <td key={schedule.id} className={`p-4 text-center ${styles.textPrimary}`}>
                            {schedule.rotationDays}
                          </td>
                        ))}
                      </tr>
                      
                      <tr className={`border-t ${styles.borderLight}`}>
                        <td className={`p-4 ${styles.textSecondary}`}>Days Off/Year</td>
                        {selectedSchedules.map((schedule) => (
                          <td key={schedule.id} className={`p-4 text-center font-semibold`}>
                            <span className={getComparisonColor(
                              schedule.daysOff, 
                              selectedSchedules.map(s => s.daysOff),
                              true
                            )}>
                              {schedule.daysOff}
                            </span>
                          </td>
                        ))}
                      </tr>
                      
                      <tr className={`border-t ${styles.borderLight}`}>
                        <td className={`p-4 ${styles.textSecondary}`}>Weekend Days</td>
                        {selectedSchedules.map((schedule) => (
                          <td key={schedule.id} className={`p-4 text-center font-semibold`}>
                            <span className={getComparisonColor(
                              schedule.weekendDays, 
                              selectedSchedules.map(s => s.weekendDays),
                              false
                            )}>
                              {schedule.weekendDays}
                            </span>
                          </td>
                        ))}
                      </tr>
                      
                      <tr className={`border-t ${styles.borderLight}`}>
                        <td className={`p-4 ${styles.textSecondary}`}>Holiday Work Days</td>
                        {selectedSchedules.map((schedule) => (
                          <td key={schedule.id} className={`p-4 text-center font-semibold`}>
                            <span className={getComparisonColor(
                              schedule.holidays, 
                              selectedSchedules.map(s => s.holidays),
                              false
                            )}>
                              {schedule.holidays}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Legend */}
              <div className={`mt-6 ${styles.tertiaryBg} rounded-lg p-4`}>
                <h4 className={`font-medium mb-2 ${styles.textPrimary}`}>Understanding the Comparison</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`${styles.successText} font-semibold`}>Green values</span>
                    <span className={`${styles.textSecondary} ml-2`}>indicate the best option</span>
                  </div>
                  <div>
                    <span className={`${styles.errorText} font-semibold`}>Red values</span>
                    <span className={`${styles.textSecondary} ml-2`}>indicate the least favorable option</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}