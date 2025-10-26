// src/components/mobile/shared/MobileScheduleDisplay.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { format, parseISO, addDays, parse } from "date-fns";

interface MobileScheduleDisplayProps {
  scheduleData: any;
  showDownloadButton?: boolean;
  onDownload?: () => void;
}

export default function MobileScheduleDisplay({
  scheduleData,
  showDownloadButton = false,
  onDownload
}: MobileScheduleDisplayProps) {
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
  }, [scheduleData]);

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSystemSettings({
            startDate: data.settings.startDate || DEFAULT_SETTINGS.startDate,
            numCycles: data.settings.numCycles || DEFAULT_SETTINGS.numCycles
          });
        }
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

  // Check if a date is a holiday
  const isHoliday = (date: Date): { isHoliday: boolean; name?: string } => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(h => h.date === dateStr);
    return {
      isHoliday: !!holiday,
      name: holiday?.name
    };
  };

  // Generate full schedule based on cycles - adapt for Excel data
  const getFullSchedule = () => {
    const schedule = [];
    
    // Handle Excel data format (array of shifts)
    if (scheduleData.shifts && Array.isArray(scheduleData.shifts)) {
      scheduleData.shifts.forEach((shift, index) => {
        // Parse date as local date to avoid timezone issues
        const shiftDate = parse(shift.date, 'yyyy-MM-dd', new Date());
        schedule.push({
          date: shiftDate,
          dayNum: index + 1,
          code: (shift.shiftCode === 'OFF' || shift.shiftCode === '*' || shift.shiftCode === '') ? '----' : shift.shiftCode,
          dayInCycle: (index % 56) + 1
        });
      });
      return schedule;
    }
    
    // Handle regular schedule data format (DAY_ columns)
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

  // Calculate working blocks (5-day and 4-day)  
  const getWorkingBlocks = () => {
    const fullSchedule = getFullSchedule();
    const workingDays = fullSchedule.map(day => day.code !== "----" ? 1 : 0);
    
    // Count blocks of exactly targetSize consecutive working days
    const countConsecutiveBlocks = (workingDays: number[], targetSize: number): number => {
      let count = 0;
      let i = 0;
      
      while (i <= workingDays.length - targetSize) {
        // Check if we have exactly targetSize consecutive working days
        let isValidBlock = true;
        for (let j = 0; j < targetSize; j++) {
          if (workingDays[i + j] !== 1) {
            isValidBlock = false;
            break;
          }
        }
        
        if (isValidBlock) {
          // Check that this block is bounded by off days (not part of a longer stretch)
          const leftBounded = i === 0 || workingDays[i - 1] === 0;
          const rightBounded = i + targetSize === workingDays.length || workingDays[i + targetSize] === 0;
          
          if (leftBounded && rightBounded) {
            count++;
            i += targetSize; // Skip past this block
          } else {
            i++; // Part of a longer stretch, keep looking
          }
        } else {
          i++;
        }
      }
      
      return count;
    };
    
    return {
      blocks5day: countConsecutiveBlocks(workingDays, 5),
      blocks4day: countConsecutiveBlocks(workingDays, 4)
    };
  };

  if (!scheduleData) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const fullSchedule = getFullSchedule();
  const workDays = fullSchedule.filter(d => d.code !== "----").length;
  const offDays = fullSchedule.filter(d => d.code === "----").length;

  return (
    <div className="space-y-4">
      {/* Schedule Info Card */}
      <div className={`rounded-lg bg-gradient-to-r ${
        theme === 'dark' 
          ? 'from-gray-800 to-gray-700' 
          : 'from-gray-50 to-white'
      } p-4 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Schedule Name and Period */}
        <div className="text-center">
          <div className={`text-xl font-bold ${styles.textPrimary}`}>
            {scheduleData.name || scheduleData.LINE}
          </div>
          <div className={`text-sm ${styles.textSecondary} mb-2`}>
            {scheduleData.period || (scheduleData.GROUP ? `Line ${scheduleData.LINE}` : 'Schedule')}
          </div>
          {scheduleData.GROUP && (
            <>
              <div className={`text-lg font-semibold ${styles.textPrimary}`}>{scheduleData.GROUP}</div>
              <div className={`text-xs ${styles.textSecondary}`}>Operation</div>
            </>
          )}
        </div>
        
        {/* Work Statistics */}
        <div className={`grid grid-cols-3 gap-2 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="text-center">
            <div className={`text-lg font-semibold ${styles.textPrimary}`}>
              {workDays}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>Work Days</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${styles.textPrimary}`}>
              {offDays}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>Days Off</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold text-purple-500`}>
              {(() => {
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
        </div>
        
        {/* Second row with 5-day, 4-day, and holidays */}
        <div className={`grid grid-cols-3 gap-2 mt-2`}>
          <div className="text-center">
            <div className={`text-lg font-semibold text-blue-500`}>
              {getWorkingBlocks().blocks5day}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>5-Day</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold text-purple-500`}>
              {getWorkingBlocks().blocks4day}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>4-Day</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold text-red-500`}>
              {getHolidaysWorked()} of {holidays.length}
            </div>
            <div className={`text-xs ${styles.textSecondary}`}>Holidays</div>
          </div>
        </div>
      </div>

      {/* Shift Times and Holidays Side by Side */}
      {(shiftCodes.length > 0 || holidays.length > 0) && (
        <div className="space-y-4">
          {/* Shift Code Legend */}
          <div className={`rounded-lg ${styles.cardBg} p-4 shadow-lg`}>
            <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-blue-500">🕐</span>
              Your Shift Times
            </h3>
            {shiftCodes.length > 0 ? (
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
                    const isKnownCode = !!shiftInfo;
                    
                    // Always get time info from Excel data (Excel is king!)
                    const excelShift = scheduleData.shifts?.find(s => s.shiftCode === code);
                    const excelTimeInfo = excelShift?.shiftTime || 'No time info';
                    
                    // Parse Excel time for color coding
                    let shiftType = "gray";
                    if (excelTimeInfo && excelTimeInfo !== 'No time info') {
                      const timeMatch = excelTimeInfo.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
                      if (timeMatch) {
                        const startHour = parseInt(timeMatch[1]);
                        if (startHour >= 5 && startHour < 12) shiftType = "amber";
                        else if (startHour >= 12 && startHour < 17) shiftType = "green";
                        else shiftType = "purple";
                      }
                    }
                    
                    return (
                      <div 
                        key={code}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                            shiftType === 'amber' ? 'bg-amber-500' :
                            shiftType === 'green' ? 'bg-green-500' :
                            shiftType === 'purple' ? 'bg-purple-500' :
                            shiftType === 'gray' ? 'bg-gray-500' :
                            'bg-blue-500'
                          }`}>
                            {code}
                          </div>
                          <div>
                            <div className={`font-medium ${styles.textPrimary}`}>
                              {excelTimeInfo}
                            </div>
                            <div className={`text-xs ${styles.textSecondary}`}>
                              {isKnownCode ? (
                                <>
                                  {shiftType === 'amber' ? 'Morning' :
                                   shiftType === 'green' ? 'Afternoon' :
                                   shiftType === 'purple' ? 'Evening/Night' :
                                   'Regular'} • From Excel
                                </>
                              ) : (
                                'Unknown code • From Excel'
                              )}
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
            ) : (
              <div className={`text-sm ${styles.textSecondary} py-4 text-center`}>
                No shift codes available
              </div>
            )}
          </div>

          {/* Holiday List */}
          <div className={`rounded-lg ${styles.cardBg} p-4 shadow-lg`}>
            <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-3 flex items-center gap-2`}>
              <span className="text-red-500">🎉</span>
              Holidays ({getHolidaysWorked()} working)
            </h3>
            {holidays.length > 0 ? (
              <>
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
                            : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
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
              </>
            ) : (
              <div className={`text-sm ${styles.textSecondary} py-4 text-center`}>
                No holidays data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Calendar Display - Horizontal Scroll */}
      <div className="space-y-3">
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${styles.textPrimary} mb-1`}>
            Schedule Calendar
          </h3>
          <p className={`text-sm ${styles.textMuted} mb-4`}>
            Scroll horizontally to see more months
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
          <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800" style={{ scrollBehavior: 'smooth' }}>
            <div className="flex gap-6" style={{ width: 'max-content', minWidth: '100%' }}>
              {Object.entries(getScheduleByMonth()).map(([month, days]) => (
                <div key={month} className={`flex-shrink-0 rounded-lg ${styles.cardBg} p-4 shadow-md`} style={{ width: '350px' }}>
                  <h4 className={`font-medium ${styles.textPrimary} mb-4 text-center text-lg`}>{month}</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <div key={idx} className={`text-center font-semibold text-sm ${styles.textMuted} py-1`}>
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
                        bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50';
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
                          className={`p-2 rounded-lg text-center ${bgColor} relative transition-all hover:scale-105`}
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

      {/* Download button if provided */}
      {showDownloadButton && onDownload && (
        <div className="fixed bottom-4 left-4 right-4">
          <button
            onClick={onDownload}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-lg"
          >
            Generate iCal File
          </button>
        </div>
      )}
    </div>
  );
}