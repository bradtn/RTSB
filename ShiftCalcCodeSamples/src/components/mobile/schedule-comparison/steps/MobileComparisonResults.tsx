// src/components/mobile/schedule-comparison/steps/MobileComparisonResults.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { format, parseISO, startOfMonth, getDaysInMonth, getDay, isSameDay, addDays, addMonths } from "date-fns";

interface MobileComparisonResultsProps {
  firstSchedule: any;
  secondSchedule: any;
  onBack: () => void;
  onClose: () => void;
}

export default function MobileComparisonResults({
  firstSchedule,
  secondSchedule,
  onBack,
  onClose
}: MobileComparisonResultsProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [shiftCodes, setShiftCodes] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState({
    startDate: DEFAULT_SETTINGS.startDate,
    numCycles: DEFAULT_SETTINGS.numCycles
  });
  const [holidays, setHolidays] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'calendar'>('stats');

  useEffect(() => {
    fetchShiftCodes();
    fetchSystemSettings();
    fetchHolidays();
  }, []);

  const fetchShiftCodes = async () => {
    try {
      const response = await fetch("/api/shift-codes");
      if (response.ok) {
        const data = await response.json();
        setShiftCodes(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch shift codes:", error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.startDate && data.numCycles) {
          setSystemSettings({
            startDate: data.startDate,
            numCycles: data.numCycles
          });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await fetch('/api/holidays/total');
      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  // Get shift code details
  const getShiftDetails = (code: string) => {
    if (!code || code === "----") return { label: "Day Off", color: "gray", category: "Day Off" };
    
    const shiftCode = shiftCodes.find(sc => sc.code === code || sc.CODE === code);
    if (!shiftCode) return { label: code, color: "blue", category: "Other" };
    
    const begin = shiftCode.begin || shiftCode.BEGIN || "";
    const end = shiftCode.end || shiftCode.END || "";
    
    // Get category from shift code or determine based on time
    let category = shiftCode.category || "Other";
    
    // Determine color based on category
    let color = "blue";
    if (category === "Days") color = "amber";
    else if (category === "Late Days" || category === "Mid Days") color = "yellow";
    else if (category === "Afternoons") color = "green";
    else if (category === "Midnights") color = "purple";
    else if (category === "Other") color = "blue";
    
    return {
      label: `${begin} - ${end}`,
      color,
      code,
      begin,
      end,
      category
    };
  };

  // Calculate full schedule for a given schedule data
  const getFullSchedule = (scheduleData: any) => {
    const fullSchedule = [];
    const dayColumns = Object.keys(scheduleData)
      .filter(key => key.startsWith('DAY_'))
      .sort();
    const daysInCycle = dayColumns.length; // Should be 56
    const totalDays = daysInCycle * systemSettings.numCycles;
    
    // Parse the start date properly
    const start = parseISO(systemSettings.startDate);
    
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const dayInCycle = (dayIndex % daysInCycle);
      const dayKey = dayColumns[dayInCycle];
      const shiftCode = scheduleData[dayKey];
      
      const currentDate = addDays(start, dayIndex);
      
      fullSchedule.push({
        dayNum: dayIndex + 1,
        date: currentDate,
        code: shiftCode,
        cycle: Math.floor(dayIndex / daysInCycle) + 1,
        dayInCycle: dayInCycle + 1
      });
    }
    
    return fullSchedule;
  };

  // Check if a date is a holiday
  const isHoliday = (date: Date): { isHoliday: boolean; name?: string } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(h => h.date === dateStr);
    return {
      isHoliday: !!holiday,
      name: holiday?.name
    };
  };

  // Calculate statistics for a schedule
  const calculateStats = (scheduleData: any) => {
    const fullSchedule = getFullSchedule(scheduleData);
    let stats = {
      workDays: 0,
      daysOff: 0,
      weekendsWorked: 0,
      totalWeekends: 0,
      totalSaturdays: 0,
      totalSundays: 0,
      holidaysWorked: 0,
      morningShifts: 0,
      afternoonShifts: 0,
      nightShifts: 0,
      orphanedSaturdays: 0,
      orphanedSundays: 0,
      shiftTypes: {} as Record<string, number>
    };

    // Calculate total weekends, Saturdays, and Sundays in the schedule period
    const totalWeekends = new Set();
    let totalSaturdays = 0;
    let totalSundays = 0;
    
    fullSchedule.forEach(day => {
      const dayOfWeek = day.date.getDay();
      if (dayOfWeek === 6) { // Saturday
        totalSaturdays++;
        const weekendKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${Math.floor(day.date.getDate() / 7)}`;
        totalWeekends.add(weekendKey);
      } else if (dayOfWeek === 0) { // Sunday
        totalSundays++;
      }
    });

    // Calculate weekend pairs (Saturday + Sunday both worked = 1 weekend)
    const weekendPairs = new Set();
    let orphanedSaturdays = 0;
    let orphanedSundays = 0;
    
    fullSchedule.forEach(day => {
      const isOff = !day.code || day.code === "----";
      const dayOfWeek = day.date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holidayInfo = isHoliday(day.date);
      
      if (isOff) {
        stats.daysOff++;
      } else {
        stats.workDays++;
        
        // Weekend pair calculation (matches MobileSchedulePreview.tsx logic)
        if (dayOfWeek === 6) { // Saturday
          const nextDay = fullSchedule.find(d => 
            d.date.getTime() === day.date.getTime() + 86400000
          );
          if (nextDay && nextDay.code !== "----") {
            // Both Saturday and Sunday are worked - this is one weekend
            const weekendKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${Math.floor(day.date.getDate() / 7)}`;
            weekendPairs.add(weekendKey);
          } else {
            // Saturday worked but not Sunday - orphaned Saturday
            orphanedSaturdays++;
          }
        } else if (dayOfWeek === 0) { // Sunday
          const prevDay = fullSchedule.find(d => 
            d.date.getTime() === day.date.getTime() - 86400000
          );
          if (!prevDay || prevDay.code === "----") {
            // Sunday worked but not Saturday - orphaned Sunday
            orphanedSundays++;
          }
        }
        
        if (holidayInfo.isHoliday) {
          stats.holidaysWorked++;
        }
        
        const shiftDetails = getShiftDetails(day.code);
        // Track all shift types actually used
        const shiftKey = `${day.code} (${shiftDetails.begin} - ${shiftDetails.end})`;
        if (!stats.shiftTypes[shiftKey]) {
          stats.shiftTypes[shiftKey] = 0;
        }
        stats.shiftTypes[shiftKey]++;
        
        // Also track by category
        if (shiftDetails.category === 'Days' || shiftDetails.category === 'Late Days' || shiftDetails.category === 'Mid Days') {
          stats.morningShifts++;
        } else if (shiftDetails.category === 'Afternoons') {
          stats.afternoonShifts++;
        } else if (shiftDetails.category === 'Midnights') {
          stats.nightShifts++;
        }
      }
      
      if (isWeekend) {
        stats.totalWeekends++;
      }
    });
    
    stats.weekendsWorked = weekendPairs.size;
    stats.totalWeekends = totalWeekends.size;
    stats.totalSaturdays = totalSaturdays;
    stats.totalSundays = totalSundays;
    stats.orphanedSaturdays = orphanedSaturdays;
    stats.orphanedSundays = orphanedSundays;
    
    return stats;
  };

  const firstStats = calculateStats(firstSchedule);
  const secondStats = calculateStats(secondSchedule);

  // Render stat comparison row
  const renderStatRow = (label: string, first: number, second: number, suffix?: string, firstTotal?: number, secondTotal?: number) => {
    const diff = first - second;
    const diffColor = diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-500' : 'text-gray-500';
    
    const formatValue = (value: number, total?: number) => {
      if (total !== undefined) {
        return `${value} of ${total}`;
      }
      return `${value}${suffix || ''}`;
    };

    return (
      <div className={`flex items-center justify-between py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <span className={`text-sm ${styles.textSecondary}`}>{label}</span>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${styles.textPrimary}`}>
            {formatValue(first, firstTotal)}
          </span>
          <span className={`text-xs ${diffColor}`}>
            {diff > 0 && '+'}{diff}
          </span>
          <span className={`text-sm font-medium ${styles.textPrimary}`}>
            {formatValue(second, secondTotal)}
          </span>
        </div>
      </div>
    );
  };

  // Get calendars for both schedules
  const firstCalendar = getFullSchedule(firstSchedule);
  const secondCalendar = getFullSchedule(secondSchedule);

  return (
    <div className="space-y-4 pb-20">
      {/* Schedule Headers */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`p-3 rounded-lg ${styles.cardBg} text-center`}>
          <div className={`text-lg font-bold ${styles.textPrimary}`}>{firstSchedule.LINE}</div>
          <div className={`text-xs ${styles.textSecondary}`}>{firstSchedule.GROUP}</div>
        </div>
        <div className={`p-3 rounded-lg ${styles.cardBg} text-center`}>
          <div className={`text-lg font-bold ${styles.textPrimary}`}>{secondSchedule.LINE}</div>
          <div className={`text-xs ${styles.textSecondary}`}>{secondSchedule.GROUP}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`flex gap-2 p-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg`}>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'stats'
              ? theme === 'dark'
                ? 'bg-blue-900/60 text-blue-100 shadow-sm'
                : 'bg-blue-200 text-blue-800 shadow-sm'
              : theme === 'dark'
                ? 'text-gray-300 hover:text-gray-200'
                : 'text-gray-700 hover:text-gray-600'
          }`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'calendar'
              ? theme === 'dark'
                ? 'bg-blue-900/60 text-blue-100 shadow-sm'
                : 'bg-blue-200 text-blue-800 shadow-sm'
              : theme === 'dark'
                ? 'text-gray-300 hover:text-gray-200'
                : 'text-gray-700 hover:text-gray-600'
          }`}
        >
          Calendar
        </button>
      </div>

      {activeTab === 'stats' ? (
        <>
          {/* Work/Off Statistics */}
          <div className={`rounded-lg ${styles.cardBg} p-4`}>
            <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-3`}>
              Work Schedule Comparison
            </h3>
            {renderStatRow("Work Days", firstStats.workDays, secondStats.workDays)}
            {renderStatRow("Days Off", firstStats.daysOff, secondStats.daysOff)}
            {renderStatRow("Weekends Worked", firstStats.weekendsWorked, secondStats.weekendsWorked, undefined, firstStats.totalWeekends, secondStats.totalWeekends)}
            {renderStatRow("Holidays Worked", firstStats.holidaysWorked, secondStats.holidaysWorked, undefined, holidays.length, holidays.length)}
            {(firstStats.orphanedSaturdays > 0 || secondStats.orphanedSaturdays > 0) && 
              renderStatRow("Solo Saturdays", firstStats.orphanedSaturdays, secondStats.orphanedSaturdays)}
            {(firstStats.orphanedSundays > 0 || secondStats.orphanedSundays > 0) && 
              renderStatRow("Solo Sundays", firstStats.orphanedSundays, secondStats.orphanedSundays)}
          </div>

          {/* Shift Type Comparison */}
          <div className={`rounded-lg ${styles.cardBg} p-4`}>
            <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-3`}>
              Shift Types
            </h3>
            {(() => {
              // Get all unique shift types from both schedules
              const allShiftTypes = new Set([
                ...Object.keys(firstStats.shiftTypes),
                ...Object.keys(secondStats.shiftTypes)
              ]);
              
              // Sort shift types by code
              const sortedShiftTypes = Array.from(allShiftTypes).sort((a, b) => {
                const codeA = a.split(' ')[0];
                const codeB = b.split(' ')[0];
                return codeA.localeCompare(codeB);
              });
              
              return sortedShiftTypes.map(shiftType => (
                <div key={shiftType}>
                  {renderStatRow(
                    shiftType,
                    firstStats.shiftTypes[shiftType] || 0,
                    secondStats.shiftTypes[shiftType] || 0
                  )}
                </div>
              ));
            })()}
          </div>

          {/* Key Differences */}
          <div className={`rounded-lg p-4 ${
            theme === 'dark'
              ? 'bg-blue-900/20 border border-blue-800'
              : 'bg-blue-50 border border-blue-300'
          }`}>
            <h4 className={`text-sm font-semibold mb-2 ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-900'
            }`}>
              Key Differences
            </h4>
            <ul className={`text-sm space-y-1 ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
            }`}>
              {Math.abs(firstStats.workDays - secondStats.workDays) > 0 && (
                <li>• {Math.abs(firstStats.workDays - secondStats.workDays)} day difference in work days</li>
              )}
              {Math.abs(firstStats.weekendsWorked - secondStats.weekendsWorked) > 0 && (
                <li>• {Math.abs(firstStats.weekendsWorked - secondStats.weekendsWorked)} weekend difference</li>
              )}
              {Math.abs(firstStats.orphanedSaturdays - secondStats.orphanedSaturdays) > 0 && (
                <li>• {Math.abs(firstStats.orphanedSaturdays - secondStats.orphanedSaturdays)} solo Saturday difference</li>
              )}
              {Math.abs(firstStats.orphanedSundays - secondStats.orphanedSundays) > 0 && (
                <li>• {Math.abs(firstStats.orphanedSundays - secondStats.orphanedSundays)} solo Sunday difference</li>
              )}
              {Math.abs(firstStats.holidaysWorked - secondStats.holidaysWorked) > 0 && (
                <li>• {Math.abs(firstStats.holidaysWorked - secondStats.holidaysWorked)} holiday difference</li>
              )}
            </ul>
          </div>
        </>
      ) : (
        <>
          {/* Calendar Comparison */}
          <div className="space-y-4">
            {/* Legend */}
            <div className={`p-3 rounded-lg ${styles.cardBg} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs font-semibold ${styles.textPrimary} mb-2`}>Legend:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <span className={styles.textSecondary}>Day Off</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${theme === 'dark' ? 'bg-amber-900/40' : 'bg-amber-100'}`}></div>
                  <span className={styles.textSecondary}>Day Shift</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${theme === 'dark' ? 'bg-green-900/40' : 'bg-green-100'}`}></div>
                  <span className={styles.textSecondary}>Afternoon</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${theme === 'dark' ? 'bg-purple-900/40' : 'bg-purple-100'}`}></div>
                  <span className={styles.textSecondary}>Midnight</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded ring-2 ring-red-500"></div>
                  <span className={styles.textSecondary}>Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">##</span>
                  <span className={styles.textSecondary}>Weekend</span>
                </div>
              </div>
            </div>
            
            <p className={`text-xs text-center ${styles.textMuted}`}>
              ← Swipe to see more months →
            </p>
            
            {/* Scrollable month container */}
            <div className="relative">
              <div className="overflow-x-auto -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent snap-x snap-mandatory">
                <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                  {/* Calculate the number of months needed to cover the full schedule */}
                  {(() => {
                    const totalDays = 56 * systemSettings.numCycles; // 56 days per cycle
                    const startDate = parseISO(systemSettings.startDate);
                    const endDate = addDays(startDate, totalDays);
                    
                    const startMonth = startDate;
                    const monthsNeeded = Math.ceil((endDate.getFullYear() - startMonth.getFullYear()) * 12 + 
                                                   (endDate.getMonth() - startMonth.getMonth()) + 1);
                    
                    return Array.from({ length: monthsNeeded }, (_, i) => i).map(monthOffset => {
              const startDate = parseISO(systemSettings.startDate);
              const monthDate = addMonths(startDate, monthOffset);
              const monthName = format(monthDate, 'MMMM yyyy');
              
              return (
                <div key={monthOffset} className={`rounded-lg ${styles.cardBg} p-4 flex-shrink-0 snap-center`} style={{ width: '320px' }}>
                  <h4 className={`text-center font-semibold ${styles.textPrimary} mb-3`}>
                    {monthName}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* First Schedule Calendar */}
                    <div>
                      <p className={`text-xs text-center ${styles.textSecondary} mb-2`}>
                        Line {firstSchedule.LINE}
                      </p>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <div key={`day-${index}`} className={`text-center font-semibold ${styles.textSecondary}`}>
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar days */}
                        {(() => {
                          const firstDay = startOfMonth(monthDate);
                          const startPadding = getDay(firstDay);
                          const daysInMonth = getDaysInMonth(monthDate);
                          const days = [];
                          
                          // Add padding
                          for (let i = 0; i < startPadding; i++) {
                            days.push(<div key={`pad-${i}`} />);
                          }
                          
                          // Add days
                          for (let day = 1; day <= daysInMonth; day++) {
                            const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                            const scheduleDay = firstCalendar.find(d => isSameDay(d.date, currentDate));
                            
                            if (scheduleDay) {
                              const isOff = !scheduleDay.code || scheduleDay.code === "----";
                              const holidayInfo = isHoliday(currentDate);
                              const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                              
                              let bgColor = '';
                              let textColor = '';
                              
                              if (isOff) {
                                bgColor = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
                                textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
                              } else {
                                const shiftDetails = getShiftDetails(scheduleDay.code);
                                if (shiftDetails.category === 'Days' || shiftDetails.category === 'Late Days' || shiftDetails.category === 'Mid Days') {
                                  bgColor = theme === 'dark' ? 'bg-amber-900/40' : 'bg-amber-100';
                                  textColor = theme === 'dark' ? 'text-amber-300' : 'text-amber-700';
                                } else if (shiftDetails.category === 'Afternoons') {
                                  bgColor = theme === 'dark' ? 'bg-green-900/40' : 'bg-green-100';
                                  textColor = theme === 'dark' ? 'text-green-300' : 'text-green-700';
                                } else if (shiftDetails.category === 'Midnights') {
                                  bgColor = theme === 'dark' ? 'bg-purple-900/40' : 'bg-purple-100';
                                  textColor = theme === 'dark' ? 'text-purple-300' : 'text-purple-700';
                                } else {
                                  bgColor = theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100';
                                  textColor = theme === 'dark' ? 'text-blue-300' : 'text-blue-700';
                                }
                              }
                              
                              // Add holiday or weekend indicator
                              const extraClass = holidayInfo.isHoliday ? 'ring-2 ring-red-500' : isWeekend ? 'font-bold' : '';
                              
                              days.push(
                                <div key={day} className={`p-1 rounded text-center ${bgColor} ${textColor} ${extraClass} text-xs`}>
                                  {day}
                                </div>
                              );
                            } else {
                              days.push(
                                <div key={day} className={`p-1 text-center ${styles.textSecondary} text-xs`}>
                                  {day}
                                </div>
                              );
                            }
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                    
                    {/* Second Schedule Calendar */}
                    <div>
                      <p className={`text-xs text-center ${styles.textSecondary} mb-2`}>
                        Line {secondSchedule.LINE}
                      </p>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <div key={`day-${index}`} className={`text-center font-semibold ${styles.textSecondary}`}>
                            {day}
                          </div>
                        ))}
                        
                        {/* Calendar days */}
                        {(() => {
                          const firstDay = startOfMonth(monthDate);
                          const startPadding = getDay(firstDay);
                          const daysInMonth = getDaysInMonth(monthDate);
                          const days = [];
                          
                          // Add padding
                          for (let i = 0; i < startPadding; i++) {
                            days.push(<div key={`pad-${i}`} />);
                          }
                          
                          // Add days
                          for (let day = 1; day <= daysInMonth; day++) {
                            const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                            const scheduleDay = secondCalendar.find(d => isSameDay(d.date, currentDate));
                            
                            if (scheduleDay) {
                              const isOff = !scheduleDay.code || scheduleDay.code === "----";
                              const holidayInfo = isHoliday(currentDate);
                              const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
                              
                              let bgColor = '';
                              let textColor = '';
                              
                              if (isOff) {
                                bgColor = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
                                textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
                              } else {
                                const shiftDetails = getShiftDetails(scheduleDay.code);
                                if (shiftDetails.category === 'Days' || shiftDetails.category === 'Late Days' || shiftDetails.category === 'Mid Days') {
                                  bgColor = theme === 'dark' ? 'bg-amber-900/40' : 'bg-amber-100';
                                  textColor = theme === 'dark' ? 'text-amber-300' : 'text-amber-700';
                                } else if (shiftDetails.category === 'Afternoons') {
                                  bgColor = theme === 'dark' ? 'bg-green-900/40' : 'bg-green-100';
                                  textColor = theme === 'dark' ? 'text-green-300' : 'text-green-700';
                                } else if (shiftDetails.category === 'Midnights') {
                                  bgColor = theme === 'dark' ? 'bg-purple-900/40' : 'bg-purple-100';
                                  textColor = theme === 'dark' ? 'text-purple-300' : 'text-purple-700';
                                } else {
                                  bgColor = theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100';
                                  textColor = theme === 'dark' ? 'text-blue-300' : 'text-blue-700';
                                }
                              }
                              
                              // Add holiday or weekend indicator
                              const extraClass = holidayInfo.isHoliday ? 'ring-2 ring-red-500' : isWeekend ? 'font-bold' : '';
                              
                              days.push(
                                <div key={day} className={`p-1 rounded text-center ${bgColor} ${textColor} ${extraClass} text-xs`}>
                                  {day}
                                </div>
                              );
                            } else {
                              days.push(
                                <div key={day} className={`p-1 text-center ${styles.textSecondary} text-xs`}>
                                  {day}
                                </div>
                              );
                            }
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 to-transparent dark:from-gray-900 dark:to-transparent p-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className={`flex-1 py-2.5 rounded-lg ${styles.cardBg} ${styles.textSecondary} font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
          >
            Back
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 ${styles.textPrimary} font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}