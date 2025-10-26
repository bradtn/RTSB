'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';

interface ScheduleDay {
  date: Date;
  shiftCode?: string;
  isWorking: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isWeekend: boolean;
  isInCurrentMonth?: boolean;
  isInSchedule?: boolean;
}

interface MobileCalendarViewProps {
  scheduleData: any[];
  bidLineId?: number;
  className?: string;
}

export default function MobileCalendarView({ scheduleData, bidLineId, className = '' }: MobileCalendarViewProps) {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const params = useParams();
  const { t } = useTranslation(params.locale as string);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Fetch holidays for the period
  useEffect(() => {
    const fetchHolidays = async () => {
      if (!scheduleData?.length || !scheduleData[1]?.startDate) return;
      
      const bidPeriod = scheduleData[1];
      try {
        const holidayData = await getHolidaysForPeriod(
          new Date(bidPeriod.startDate),
          new Date(bidPeriod.endDate || new Date(bidPeriod.startDate).setDate(new Date(bidPeriod.startDate).getDate() + 56 * (bidPeriod.numCycles || 1))),
          HolidayFilters.NO_OBSCURE
        );
        setHolidays(holidayData);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };
    
    fetchHolidays();
  }, [scheduleData]);

  // Process schedule data into calendar format - using same logic as ScheduleCalendar
  const processedSchedule = useMemo(() => {
    // Debug logging - remove in production
    // console.log('=== MobileCalendarView Debug ===');
    // console.log('scheduleData received:', scheduleData);
    
    if (!scheduleData?.length || !scheduleData[0]) {
      // No schedule data or empty first element
      return {};
    }

    const scheduleByMonth: { [key: string]: ScheduleDay[] } = {};
    
    // Extract the actual schedule data from the transformed format
    const schedule = scheduleData[0];
    const bidPeriod = scheduleData[1]; // Second item should be bidPeriod
    
    // Validate bidPeriod data
    
    if (!schedule || !Array.isArray(schedule)) {
      // Schedule is not an array
      return {};
    }

    // Create shift map by dayNumber (same as ScheduleCalendar)
    const shiftMap = new Map<number, any>();
    schedule.forEach((shift: any) => {
      if (shift.dayNumber) {
        shiftMap.set(shift.dayNumber, shift);
      }
    });

    // Extract bid period info 
    if (!bidPeriod?.startDate) {
      // Fallback calendar generation - no bidPeriod.startDate
      // No bid period start date, using default fallback
      // If no bid period, use current date as default
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const numCycles = 1;
      const totalDays = 56 * numCycles;
      
      // Still generate a basic calendar even without proper bid period
      let currentDate = new Date(startDate);
      let dayNumber = 1;
      
      // Generate just the current and next month as fallback
      for (let m = 0; m < 2; m++) {
        const monthKey = format(currentDate, 'yyyy-MM');
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const monthStart7Day = startOfWeek(monthStart);
        const monthEnd7Day = endOfWeek(monthEnd);
        
        const monthDays = eachDayOfInterval({
          start: monthStart7Day,
          end: monthEnd7Day
        });

        scheduleByMonth[monthKey] = monthDays.map(date => ({
          date,
          shiftCode: undefined,
          isWorking: false,
          isHoliday: false,
          holidayName: undefined,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isInCurrentMonth: isSameMonth(date, monthStart),
          isInSchedule: false
        }));
        
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
      
      return scheduleByMonth;
    }

    // Ensure we have a valid date
    const startDate = bidPeriod.startDate instanceof Date 
      ? bidPeriod.startDate 
      : new Date(bidPeriod.startDate);
      
    // Check if date is valid
    if (isNaN(startDate.getTime())) {
      console.error('Invalid start date:', bidPeriod.startDate);
      return {};
    }
    
    const numCycles = bidPeriod.numCycles || 1;
    const totalDays = 56 * numCycles; // Same as ScheduleCalendar
    
    // Final startDate for calendar generation

    // Generate calendar data for all months in the period
    // Calculate the actual end date of the schedule
    const endDate = new Date(startDate.getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000);
    
    // Calculate exact number of months needed
    let monthsNeeded = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
    
    // Start from the actual start date's month
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    let monthsGenerated = 0;
    
    while (monthsGenerated < monthsNeeded) {
      const monthKey = format(currentDate, 'yyyy-MM');
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Generating month
      
      const monthStart7Day = startOfWeek(monthStart);
      const monthEnd7Day = endOfWeek(monthEnd);
      
      const monthDays = eachDayOfInterval({
        start: monthStart7Day,
        end: monthEnd7Day
      });

      scheduleByMonth[monthKey] = monthDays.map(date => {
        const isInCurrentMonth = isSameMonth(date, monthStart);
        
        // Calculate day number within schedule period
        const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const isInSchedule = daysDiff >= 1 && daysDiff <= totalDays;
        const scheduleDayNumber = isInSchedule ? daysDiff : null;
        
        // Map to 56-day cycle pattern
        const cycleDay = scheduleDayNumber ? ((scheduleDayNumber - 1) % 56) + 1 : null;
        const shift = cycleDay ? shiftMap.get(cycleDay) : undefined;
        
        // Check if this date is a holiday
        const holiday = holidays.find(h => {
          // Compare year, month, and day directly to avoid timezone issues
          return h.date.getFullYear() === date.getFullYear() &&
                 h.date.getMonth() === date.getMonth() &&
                 h.date.getDate() === date.getDate();
        });

        return {
          date,
          shiftCode: shift?.shiftCode?.code,
          isWorking: !!shift?.shiftCode,
          isHoliday: !!holiday,
          holidayName: holiday?.name,
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          isInCurrentMonth,
          isInSchedule
        };
      });

      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      monthsGenerated++;
    }

    // Final scheduleByMonth generated
    return scheduleByMonth;
  }, [scheduleData, bidLineId, holidays]);

  const getDayClassName = (day: ScheduleDay & { isInCurrentMonth?: boolean; isInSchedule?: boolean }) => {
    const baseClasses = 'p-1 rounded-lg text-center relative transition-all hover:scale-105 min-h-[56px] flex flex-col justify-center';
    
    // Dim days that are not in current month
    if (!day.isInCurrentMonth) {
      return `${baseClasses} text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800`;
    }

    // Days outside schedule period
    if (!day.isInSchedule) {
      return `${baseClasses} text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700`;
    }

    if (day.isHoliday) {
      // Holiday styling (red theme)
      if (day.isWorking) {
        // Working on a holiday
        return `${baseClasses} bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200 ring-2 ring-red-400 dark:ring-red-500`;
      } else {
        // Holiday off
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300`;
      }
    }

    if (day.isWorking) {
      if (day.isWeekend) {
        // Weekend work day - purple highlight like ShiftCalc
        return `${baseClasses} bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 ring-1 ring-purple-400 dark:ring-purple-500`;
      } else {
        // Regular work day - blue highlight
        return `${baseClasses} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200`;
      }
    }

    // Off days (including weekends when not working)
    return `${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400`;
  };

  const renderDayContent = (day: ScheduleDay & { isInCurrentMonth?: boolean; isInSchedule?: boolean; holidayName?: string }) => {
    const dateOpacity = !day.isInCurrentMonth ? 'opacity-40' : '';
    const textColor = day.isInCurrentMonth ? '' : 'text-gray-400';
    
    return (
      <>
        {/* Date number - larger, bold like ShiftCalc */}
        <div className={`font-bold text-sm ${dateOpacity} ${textColor}`}>
          {day.date.getDate()}
        </div>
        
        {/* Shift code or OFF - smaller text below date like ShiftCalc */}
        {day.isInSchedule && (
          <div className={`text-xs font-medium ${dateOpacity} ${textColor}`}>
            {day.isWorking ? (day.shiftCode || 'WORK') : 'OFF'}
          </div>
        )}
        
        {/* Holiday emoji indicator like ShiftCalc */}
        {day.isHoliday && (
          <div className="absolute -top-1 -right-1 text-xs" title={day.holidayName}>
            🎉
          </div>
        )}
      </>
    );
  };

  if (!Object.keys(processedSchedule).length) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p>{t('calendar.noScheduleData')}</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('calendar.scheduleCalendar')}</h3>
        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-600 rounded"></div>
            <span>{t('calendar.legend.working')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-600 rounded"></div>
            <span>{t('calendar.legend.weekendWork')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-600 rounded"></div>
            <span>{t('calendar.legend.holiday')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded"></div>
            <span>{t('calendar.legend.off')}</span>
          </div>
        </div>
      </div>

      {/* Horizontal scrolling calendar */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-2" style={{ width: `${Object.keys(processedSchedule).length * 360}px` }}>
          {Object.entries(processedSchedule)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, days]) => {
              // Parse the month key properly - monthKey is like '2025-10'
              const [year, month] = monthKey.split('-').map(Number);
              const monthDate = new Date(year, month - 1, 1); // month - 1 because JS months are 0-indexed
              // Rendering month card
              return (
                <div key={monthKey} className="flex-shrink-0 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm" style={{ width: '340px' }}>
                  {/* Month header */}
                  <div className="text-center mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      {format(monthDate, 'MMMM yyyy')}
                    </h4>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayHeader, index) => (
                      <div key={index} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                        {dayHeader}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, dayIndex) => (
                      <div 
                        key={dayIndex} 
                        className={getDayClassName(day)}
                        title={day.holidayName || ''}
                      >
                        {renderDayContent(day)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Touch scroll indicator */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        {t('calendar.scrollToSeeMore')}
      </div>
    </div>
  );
}