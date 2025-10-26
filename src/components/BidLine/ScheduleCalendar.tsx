'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n';
import { useParams } from 'next/navigation';

interface ScheduleShift {
  dayNumber: number;
  shiftCode?: {
    code: string;
    beginTime: string;
    endTime: string;
    category: string;
    hoursLength: number;
  } | null;
}

interface CalendarDay {
  dayNumber: number | null;
  date: Date;
  shift?: ScheduleShift;
  isHoliday: boolean;
  holiday?: string;
  isWeekend: boolean;
  isInCurrentMonth: boolean;
  isInSchedule: boolean;
}

interface ScheduleCalendarProps {
  schedule?: {
    scheduleShifts: ScheduleShift[];
  };
  bidPeriod?: {
    startDate: Date;
    endDate: Date;
    numCycles?: number;
  };
  compact?: boolean;
  className?: string;
}

export default function ScheduleCalendar({ 
  schedule, 
  bidPeriod, 
  compact = false,
  className = ''
}: ScheduleCalendarProps) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [holidays, setHolidays] = useState<any[]>([]);
  const params = useParams();
  const { t } = useTranslation(params.locale as string);
  
  useEffect(() => {
    const fetchHolidays = async () => {
      if (!bidPeriod) return;
      
      try {
        const holidayData = await getHolidaysForPeriod(
          new Date(bidPeriod.startDate), 
          new Date(bidPeriod.endDate), 
          HolidayFilters.NO_OBSCURE
        );
        setHolidays(holidayData);
      } catch (error) {
        console.error('Error fetching holidays:', error);
      }
    };
    
    fetchHolidays();
  }, [bidPeriod]);

  if (!schedule?.scheduleShifts || !bidPeriod) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center ${className}`}>
        <Calendar className="mx-auto mb-2 text-gray-400" size={24} />
        <p className="text-gray-500 text-sm">{t('calendar.noScheduleData')}</p>
      </div>
    );
  }

  // Create a map of day numbers to shifts
  const shiftMap = new Map<number, ScheduleShift>();
  schedule.scheduleShifts.forEach(shift => {
    shiftMap.set(shift.dayNumber, shift);
  });

  // Generate calendar data for display as monthly calendars
  const generateCalendarData = () => {
    const months = [];
    const startDate = new Date(bidPeriod.startDate);
    
    // Calculate total days based on cycles (56 days per cycle)
    const numCycles = bidPeriod.numCycles || 1;
    const totalDays = 56 * numCycles;
    
    // Generate calendars for the months that cover the full cycle period
    let currentDate = new Date(startDate);
    let dayNumber = 1;
    
    while (dayNumber <= totalDays) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const weeks = [];
      
      // Start from the first day of the month
      const current = new Date(monthStart);
      
      // Create weeks only for days in the current month
      while (current <= monthEnd) {
        const week = [];
        
        // Fill the first week with empty cells if month doesn't start on Sunday
        if (current.getDate() === 1) {
          const startDay = current.getDay();
          for (let i = 0; i < startDay; i++) {
            week.push(null); // Empty cell
          }
        }
        
        // Add days of the current month
        while (week.length < 7 && current <= monthEnd) {
          const cellDate = new Date(current);
          const isInCurrentMonth = true; // All days are in current month now
          
          // Calculate the day number within our full schedule period
          const daysDiff = Math.floor((cellDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const isInSchedule = daysDiff >= 1 && daysDiff <= totalDays;
          const scheduleDayNumber = isInSchedule ? daysDiff : null;
          
          // Map to the 56-day cycle pattern (cycle repeats every 56 days)
          const cycleDay = scheduleDayNumber ? ((scheduleDayNumber - 1) % 56) + 1 : null;
          const shift = cycleDay ? shiftMap.get(cycleDay) : undefined;
          const isHoliday = holidays.some(h => 
            h.date.getFullYear() === cellDate.getFullYear() &&
            h.date.getMonth() === cellDate.getMonth() &&
            h.date.getDate() === cellDate.getDate()
          );
          const holiday = holidays.find(h => 
            h.date.getFullYear() === cellDate.getFullYear() &&
            h.date.getMonth() === cellDate.getMonth() &&
            h.date.getDate() === cellDate.getDate()
          );
          
          week.push({
            date: new Date(cellDate),
            dayNumber: scheduleDayNumber,
            shift,
            isHoliday,
            holiday: holiday?.name,
            isWeekend: cellDate.getDay() === 0 || cellDate.getDay() === 6,
            isInCurrentMonth,
            isInSchedule
          } as CalendarDay);
          
          current.setDate(current.getDate() + 1);
        }
        
        // Fill the last week with empty cells if needed
        while (week.length < 7) {
          week.push(null);
        }
        
        weeks.push(week);
      }
      
      months.push({
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        weeks
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
      
      // Update dayNumber to track our position in the full schedule period
      const nextMonthStart = new Date(currentDate);
      dayNumber = Math.floor((nextMonthStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    return months;
  };

  const months = generateCalendarData();
  const currentMonth = months[currentMonthIndex] || months[0];

  const getShiftColor = (shift: ScheduleShift | undefined, isWeekend: boolean, isHoliday: boolean, isInSchedule: boolean = true, isInCurrentMonth: boolean = true) => {
    // Faded style for days outside the current month or outside the schedule
    const fadeStyle = !isInCurrentMonth || !isInSchedule ? 'opacity-50 ' : '';
    
    if (!shift?.shiftCode) {
      // Day off
      if (isHoliday) return fadeStyle + 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      if (isWeekend) return fadeStyle + 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      return fadeStyle + 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    }

    // Working day
    if (isHoliday) return fadeStyle + 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-600';
    if (isWeekend) return fadeStyle + 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-600';
    
    // Regular working day - color by shift type
    const category = shift.shiftCode?.category?.toLowerCase() || '';
    if (category.includes('day') || category.includes('am')) {
      return fadeStyle + 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600';
    } else if (category.includes('evening') || category.includes('pm')) {
      return fadeStyle + 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600';
    } else if (category.includes('night') || category.includes('mid')) {
      return fadeStyle + 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-600';
    }
    
    return fadeStyle + 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return '--:--';
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch {
      return time || '--:--';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('calendar.scheduleCalendar')}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonthIndex(Math.max(0, currentMonthIndex - 1))}
              disabled={currentMonthIndex === 0}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            
            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
              {currentMonth ? new Date(currentMonth.year, currentMonth.month).toLocaleDateString(params.locale as string, { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase()) : ''}
            </span>
            
            <button
              onClick={() => setCurrentMonthIndex(Math.min(months.length - 1, currentMonthIndex + 1))}
              disabled={currentMonthIndex >= months.length - 1}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('calendar.legend.off')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('calendar.legend.dayShift')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('calendar.legend.evening')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('calendar.legend.night')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-300"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('calendar.legend.weekendWork')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300"></div>
            <span className="text-gray-600 dark:text-gray-400">{t('calendar.legend.holiday')}</span>
          </div>
        </div>
      </div>

      {/* Monthly Calendar Grid */}
      <div className="p-2 lg:p-3">
        {currentMonth && (
          <div className="space-y-2 lg:space-y-3">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1">
              {(params.locale === 'fr' ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-2 border-b border-gray-200 dark:border-gray-600">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {currentMonth.weeks.flatMap((week, weekIndex) =>
                week.map((day, dayIndex) => (
                  day ? (
                    <div
                      key={`${day.date.getTime()}`}
                      className={`
                        relative p-0.5 text-xs aspect-square border transition-all duration-200 hover:shadow-md flex flex-col justify-between
                        ${getShiftColor(day.shift || undefined, day.isWeekend, day.isHoliday, day.isInSchedule, day.isInCurrentMonth)}
                      `}
                      title={`${day.date.toLocaleDateString(params.locale as string, { weekday: 'long', month: 'long', day: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}${day.holiday ? ` - ${day.holiday}` : ''}${day.dayNumber ? ` (Day ${day.dayNumber}, Cycle Day ${((day.dayNumber - 1) % 56) + 1})` : ''}`}
                    >
                    {/* Top row - Date and day number */}
                    <div className="flex justify-between items-start">
                      <div className={`text-xs font-semibold ${!day.isInCurrentMonth ? 'text-gray-400' : ''}`}>
                        {day.date.getDate()}
                      </div>
                      {day.dayNumber && day.isInCurrentMonth && (
                        <div className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-600 rounded px-0.5">
                          {day.dayNumber}
                        </div>
                      )}
                    </div>
                    
                    {/* Center - Shift info */}
                    <div className="flex-1 flex items-center justify-center">
                      {day.isInSchedule && (
                        <div className="text-center">
                          {day.shift?.shiftCode ? (
                            <div>
                              <div className="text-xs font-bold">
                                {day.shift.shiftCode.code}
                              </div>
                              {(day.shift.shiftCode.beginTime || day.shift.shiftCode.endTime) ? (
                                <div className="text-xs flex items-center justify-center">
                                  <Clock size={4} />
                                  <span className="text-xs ml-0.5">
                                    {formatTime(day.shift.shiftCode.beginTime).slice(0, 5)}-{formatTime(day.shift.shiftCode.endTime).slice(0, 5)}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="text-xs font-medium">
                              OFF
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                      {/* Bottom right - Holiday indicator */}
                      {day.isHoliday && (
                        <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="aspect-square border border-transparent"
                    ></div>
                  )
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}