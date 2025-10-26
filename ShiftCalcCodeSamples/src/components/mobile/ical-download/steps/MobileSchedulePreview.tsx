// src/components/mobile/ical-download/steps/MobileSchedulePreview.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import ICalButton from "@/components/schedules/ICalButton";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { format, parseISO, addDays } from "date-fns";

interface MobileSchedulePreviewProps {
  scheduleData: any;
  onBack: () => void;
  onClose: () => void;
}

export default function MobileSchedulePreview({
  scheduleData,
  onBack,
  onClose
}: MobileSchedulePreviewProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [shiftCodes, setShiftCodes] = useState<any[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(true);
  const [systemSettings, setSystemSettings] = useState({
    startDate: DEFAULT_SETTINGS.startDate,
    numCycles: DEFAULT_SETTINGS.numCycles
  });
  const [holidays, setHolidays] = useState<any[]>([]);
  const [showAllHolidays, setShowAllHolidays] = useState(false);

  useEffect(() => {
    fetchShiftCodes();
    fetchSystemSettings();
    fetchHolidays();
    
    // If schedule has holiday data, parse it
    if (scheduleData?.holidays_data) {
      try {
        const holidayData = JSON.parse(scheduleData.holidays_data);
      } catch (e) {
        console.error("Failed to parse holiday data:", e);
      }
    }
  }, [scheduleData]);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        // The API returns settings directly, not nested under 'settings'
        setSystemSettings({
          startDate: data.startDate || DEFAULT_SETTINGS.startDate,
          numCycles: data.numCycles || DEFAULT_SETTINGS.numCycles
        });
      }
    } catch (error) {
      console.error("Error fetching system settings:", error);
    }
  };

  const fetchShiftCodes = async () => {
    try {
      const response = await fetch("/api/shift-codes");
      if (response.ok) {
        const data = await response.json();
        setShiftCodes(data || []);
      } else {
        console.error("Failed to fetch shift codes:", response.status);
      }
    } catch (error) {
      console.error("Error fetching shift codes:", error);
    } finally {
      setIsLoadingCodes(false);
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
    if (!code || code === "----") return { label: "Day Off", color: "gray" };
    
    const shiftCode = shiftCodes.find(sc => sc.code === code);
    if (!shiftCode) return { label: code, color: "blue" };
    
    // Determine shift type by time
    const startHour = parseInt(shiftCode.begin?.split(':')[0] || "0");
    let color = "blue"; // default
    if (startHour >= 5 && startHour < 12) color = "amber"; // morning
    else if (startHour >= 12 && startHour < 17) color = "green"; // afternoon
    else color = "purple"; // evening/night
    
    return {
      label: code,
      time: `${shiftCode.begin || ""} - ${shiftCode.end || ""}`,
      color
    };
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

  // Generate a preview of the schedule pattern
  const getSchedulePattern = () => {
    const pattern = [];
    const dayColumns = Object.keys(scheduleData)
      .filter(key => key.startsWith('DAY_'))
      .sort();
    
    // Show first 14 days as a sample
    for (let i = 0; i < Math.min(14, dayColumns.length); i++) {
      const dayKey = dayColumns[i];
      const shiftCode = scheduleData[dayKey];
      pattern.push({ day: i + 1, code: shiftCode });
    }
    
    return pattern;
  };

  // Generate full schedule based on cycles
  const getFullSchedule = () => {
    const schedule = [];
    const dayColumns = Object.keys(scheduleData)
      .filter(key => key.startsWith('DAY_'))
      .sort();
    const daysInCycle = dayColumns.length; // Should be 56
    const totalDays = daysInCycle * systemSettings.numCycles;
    
    // Parse the start date
    const start = parseISO(systemSettings.startDate);
    
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const dayInCycle = (dayIndex % daysInCycle);
      const dayKey = dayColumns[dayInCycle];
      const shiftCode = scheduleData[dayKey];
      
      const currentDate = addDays(start, dayIndex);
      
      schedule.push({
        date: currentDate,
        dayNum: dayIndex + 1,
        code: shiftCode,
        dayInCycle: dayInCycle + 1
      });
    }
    
    return schedule;
  };

  // Group schedule by month for display
  const getScheduleByMonth = () => {
    const fullSchedule = getFullSchedule();
    const months: { [key: string]: any[] } = {};
    
    fullSchedule.forEach(day => {
      const monthKey = day.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(day);
    });
    
    return months;
  };

  // Helper to format dates
  const formatScheduleDate = (dateString: string) => {
    const date = parseISO(dateString);
    // No adjustment needed - date is already correct
    return format(date, 'MMM d, yyyy');
  };

  // Calculate end date
  const getEndDate = () => {
    const startDate = parseISO(systemSettings.startDate);
    
    // Calculate end date: start + total days - 1
    const endDate = addDays(startDate, (56 * systemSettings.numCycles) - 1);
    
    return format(endDate, 'MMM d, yyyy');
  };

  // Calculate holidays worked
  const getHolidaysWorked = () => {
    const fullSchedule = getFullSchedule();
    let holidaysWorked = 0;
    
    fullSchedule.forEach(day => {
      if (day.code !== "----") { // Working day
        const holidayInfo = isHoliday(day.date);
        if (holidayInfo.isHoliday) {
          holidaysWorked++;
        }
      }
    });
    
    return holidaysWorked;
  };

  if (!scheduleData) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }


  return (
    <div className="space-y-4 pb-20"> {/* Add padding for fixed button */}
      

      {/* Schedule Info Card - Enhanced with Stats */}
      <div className={`rounded-lg bg-gradient-to-r ${
        theme === 'dark' 
          ? 'from-gray-800 to-gray-700' 
          : 'from-gray-50 to-white'
      } p-4 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Stacked Line and Operation */}
        <div className="text-center">
          <div className={`text-xl font-bold ${styles.textPrimary}`}>{scheduleData.LINE}</div>
          <div className={`text-sm ${styles.textSecondary} mb-2`}>Line</div>
          <div className={`text-lg font-semibold ${styles.textPrimary}`}>{scheduleData.GROUP}</div>
          <div className={`text-xs ${styles.textSecondary}`}>Operation</div>
        </div>
        
        {/* Work Statistics */}
        <div className={`grid grid-cols-4 gap-2 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="text-center">
            <div className={`text-lg font-semibold ${styles.textPrimary}`}>
              {getFullSchedule().filter(d => d.code !== "----").length}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>Work Days</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${styles.textPrimary}`}>
              {getFullSchedule().filter(d => d.code === "----").length}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>Days Off</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold text-purple-500`}>
              {(() => {
                const fullSchedule = getFullSchedule();
                const weekendPairs = new Set();
                const totalWeekends = new Set();
                
                fullSchedule.forEach(day => {
                  const dayOfWeek = day.date.getDay();
                  
                  // Count total weekends in schedule period
                  if (dayOfWeek === 6) { // Saturday
                    const weekendKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${Math.floor(day.date.getDate() / 7)}`;
                    totalWeekends.add(weekendKey);
                  }
                  
                  // Count worked weekend pairs
                  if (day.code !== "----") {
                    // If it's a Saturday, check if Sunday is also worked
                    if (dayOfWeek === 6) {
                      const nextDay = fullSchedule.find(d => 
                        d.date.getTime() === day.date.getTime() + 86400000
                      );
                      if (nextDay && nextDay.code !== "----") {
                        // Both Saturday and Sunday are worked - this is one weekend
                        const weekendKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${Math.floor(day.date.getDate() / 7)}`;
                        weekendPairs.add(weekendKey);
                      }
                    }
                  }
                });
                
                return `${weekendPairs.size} of ${totalWeekends.size}`;
              })()}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>Weekends</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold text-red-500`}>
              {scheduleData.holidays_on || getHolidaysWorked()} of {holidays.length}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>Holidays</div>
          </div>
        </div>
        
        {/* Orphaned Weekend Days - Only show if there are any */}
        {(() => {
          const fullSchedule = getFullSchedule();
          let orphanedSaturdays = 0;
          let orphanedSundays = 0;
          
          fullSchedule.forEach(day => {
            if (day.code !== "----") {
              const dayOfWeek = day.date.getDay();
              
              if (dayOfWeek === 6) { // Saturday
                const nextDay = fullSchedule.find(d => 
                  d.date.getTime() === day.date.getTime() + 86400000
                );
                if (!nextDay || nextDay.code === "----") {
                  orphanedSaturdays++;
                }
              } else if (dayOfWeek === 0) { // Sunday
                const prevDay = fullSchedule.find(d => 
                  d.date.getTime() === day.date.getTime() - 86400000
                );
                if (!prevDay || prevDay.code === "----") {
                  orphanedSundays++;
                }
              }
            }
          });
          
          if (orphanedSaturdays === 0 && orphanedSundays === 0) return null;
          
          return (
            <div className={`grid grid-cols-2 gap-2 mt-2`}>
              {orphanedSaturdays > 0 && (
                <div className="text-center">
                  <div className={`text-lg font-semibold text-orange-500`}>
                    {orphanedSaturdays}
                  </div>
                  <div className={`text-xs ${styles.textSecondary}`}>Solo Sat</div>
                </div>
              )}
              {orphanedSundays > 0 && (
                <div className="text-center">
                  <div className={`text-lg font-semibold text-blue-500`}>
                    {orphanedSundays}
                  </div>
                  <div className={`text-xs ${styles.textSecondary}`}>Solo Sun</div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* Schedule dates */}
        <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              <div className={`text-xs ${styles.textSecondary}`}>Start Date</div>
              <div className={`font-medium ${styles.textPrimary}`}>
                {formatScheduleDate(systemSettings.startDate)}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-xs ${styles.textSecondary}`}>End Date</div>
              <div className={`font-medium ${styles.textPrimary}`}>
                {getEndDate()}
              </div>
            </div>
          </div>
          <div className={`text-center mt-2 text-xs ${styles.textMuted}`}>
            {systemSettings.numCycles} cycle{systemSettings.numCycles > 1 ? 's' : ''} × 56 days = {56 * systemSettings.numCycles} days
          </div>
        </div>
      </div>

      {/* Shift Code Legend */}
      {shiftCodes.length > 0 && (
        <div className={`rounded-lg ${styles.cardBg} p-4 shadow-lg`}>
          <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-3 flex items-center gap-2`}>
            <span className="text-blue-500">🕐</span>
            Your Shift Times
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(() => {
              // Get unique shift codes from the schedule
              const fullSchedule = getFullSchedule();
              const uniqueShiftCodes = [...new Set(
                fullSchedule
                  .filter(d => d.code !== "----")
                  .map(d => d.code)
              )].sort();
              
              return uniqueShiftCodes.map(code => {
                const shiftInfo = shiftCodes.find(sc => sc.code === code);
                if (!shiftInfo) return null;
                
                const startHour = parseInt(shiftInfo.begin?.split(':')[0] || "0");
                let shiftType = "blue";
                if (startHour >= 5 && startHour < 12) shiftType = "amber";
                else if (startHour >= 12 && startHour < 17) shiftType = "green";
                else shiftType = "purple";
                
                return (
                  <div 
                    key={code}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                        shiftType === 'amber' ? 'bg-amber-500' :
                        shiftType === 'green' ? 'bg-green-500' :
                        shiftType === 'purple' ? 'bg-purple-500' :
                        'bg-blue-500'
                      }`}>
                        {code}
                      </div>
                      <div>
                        <div className={`font-medium ${styles.textPrimary}`}>
                          {shiftInfo.begin} - {shiftInfo.end}
                        </div>
                        <div className={`text-xs ${styles.textSecondary}`}>
                          {shiftType === 'amber' ? 'Morning' :
                           shiftType === 'green' ? 'Afternoon' :
                           shiftType === 'purple' ? 'Evening/Night' :
                           'Regular'}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm ${styles.textSecondary}`}>
                      {fullSchedule.filter(d => d.code === code).length} days
                    </div>
                  </div>
                );
              }).filter(Boolean);
            })()}
          </div>
        </div>
      )}

      {/* Holiday List */}
      {holidays.length > 0 && (
        <div className={`rounded-lg ${styles.cardBg} p-4 shadow-lg`}>
          <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-3 flex items-center gap-2`}>
            <span className="text-red-500">🎉</span>
            Holidays ({getHolidaysWorked()} working)
          </h3>
          <div className="space-y-2">
            {(showAllHolidays ? holidays : holidays.slice(0, 3)).map((holiday, index) => {
              const holidayDate = parseISO(holiday.date);
              const fullSchedule = getFullSchedule();
              const scheduleDay = fullSchedule.find(d => 
                format(d.date, 'yyyy-MM-dd') === holiday.date
              );
              const isWorking = scheduleDay && scheduleDay.code !== "----";
              
              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isWorking 
                      ? theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
                      : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      isWorking ? 'text-red-500' : styles.textSecondary
                    }`}>
                      {isWorking ? '🏢' : '🏠'}
                    </span>
                    <div>
                      <div className={`font-medium ${styles.textPrimary}`}>
                        {holiday.name}
                      </div>
                      <div className={`text-xs ${styles.textSecondary}`}>
                        {format(holidayDate, 'EEE, MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    isWorking ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {isWorking ? 'Working' : 'Off'}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Show more/less button */}
          {holidays.length > 3 && (
            <button
              onClick={() => setShowAllHolidays(!showAllHolidays)}
              className={`
                w-full mt-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${theme === "dark" 
                  ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"}
              `}
            >
              {showAllHolidays ? (
                <span>Show Less</span>
              ) : (
                <span>Show {holidays.length - 3} More Holiday{holidays.length - 3 !== 1 ? 's' : ''}</span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Enhanced Calendar Display - Horizontal Scroll */}
      <div className="space-y-3">
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-1`}>
            Schedule Calendar
          </h3>
          <p className={`text-xs ${styles.textMuted} mb-2`}>
            ← Swipe to see more months →
          </p>
          {/* Centered Legend */}
          <div className="flex justify-center gap-3 text-xs mb-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className={styles.textSecondary}>Work</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className={styles.textSecondary}>Off</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className={styles.textSecondary}>Holiday</span>
            </div>
          </div>
        </div>
        
        {/* Horizontal scrolling calendar */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-100 dark:from-gray-900 to-transparent pointer-events-none z-10"></div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2">
              {Object.entries(getScheduleByMonth()).map(([month, days]) => (
                <div key={month} className={`flex-shrink-0 rounded-lg ${styles.cardBg} p-4 shadow-md`} style={{ width: '320px' }}>
                  <h4 className={`font-medium ${styles.textPrimary} mb-3 text-center`}>{month}</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div key={idx} className={`text-center font-semibold text-xs ${styles.textMuted} py-0.5`}>
                        {day}
                      </div>
                    ))}
                    
                    {/* Empty cells for first week alignment */}
                    {Array.from({ length: days[0].date.getDay() }, (_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    
                    {/* Days */}
                    {days.map((day) => {
                      const isOff = day.code === "----";
                      const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                      const holidayInfo = isHoliday(day.date);
                      
                      // Determine background color based on priority
                      let bgColor = '';
                      let textColor = '';
                      
                      if (holidayInfo.isHoliday) {
                        // Holiday takes priority
                        bgColor = theme === 'dark' 
                          ? 'bg-red-900/50 ring-1 ring-red-500' 
                          : 'bg-red-100 ring-1 ring-red-400';
                        textColor = theme === 'dark' ? 'text-red-200' : 'text-red-700';
                      } else if (isOff) {
                        // Day off
                        bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100';
                        textColor = 'text-gray-500';
                      } else if (isWeekend) {
                        // Weekend work day
                        bgColor = theme === 'dark' 
                          ? 'bg-purple-900/50 ring-1 ring-purple-500' 
                          : 'bg-purple-100 ring-1 ring-purple-400';
                        textColor = theme === 'dark' ? 'text-purple-200' : 'text-purple-700';
                      } else {
                        // Regular work day
                        bgColor = theme === 'dark' 
                          ? 'bg-blue-900/30' 
                          : 'bg-blue-50';
                        textColor = theme === 'dark' ? 'text-blue-200' : 'text-blue-700';
                      }
                      
                      return (
                        <div
                          key={day.dayNum}
                          className={`p-1.5 rounded-lg text-center ${bgColor} relative transition-all hover:scale-105`}
                          title={holidayInfo.isHoliday ? holidayInfo.name : ''}
                        >
                          <div className={`font-bold text-sm ${textColor}`}>
                            {day.date.getDate()}
                          </div>
                          <div className={`text-xs font-medium ${textColor}`}>
                            {isOff ? 'OFF' : day.code}
                          </div>
                          {holidayInfo.isHoliday && (
                            <div className="absolute -top-1 -right-1 text-xs">
                              🎉
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
      </div>

      {/* Fixed bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-100 to-transparent dark:from-gray-900 dark:to-transparent p-4 space-y-2">
        <ICalButton
          scheduleId={scheduleData.id}
          className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-lg"
          buttonText="Download iCal File"
        />
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