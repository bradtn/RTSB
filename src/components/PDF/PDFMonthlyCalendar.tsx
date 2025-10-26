'use client';

import { useState, useEffect } from 'react';
import { formatDate, formatMonthYear } from '@/utils/dateFormatting';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';
import { translateHolidayName } from '@/utils/holidayTranslations';

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

interface PDFMonthlyCalendarProps {
  schedule?: {
    scheduleShifts: ScheduleShift[];
  };
  bidPeriod?: {
    startDate: Date;
    endDate: Date;
    numCycles?: number;
  };
  bidLineNumber?: string;
  operationName?: string;
  translations: Record<string, string>;
  locale?: string;
}

export default function PDFMonthlyCalendar({ 
  schedule, 
  bidPeriod, 
  bidLineNumber, 
  operationName,
  translations,
  locale = 'en' 
}: PDFMonthlyCalendarProps) {
  const [holidays, setHolidays] = useState<any[]>([]);
  
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
    return null;
  }

  // Create a map of day numbers to shifts
  const shiftMap = new Map<number, ScheduleShift>();
  schedule.scheduleShifts.forEach(shift => {
    shiftMap.set(shift.dayNumber, shift);
  });

  const generateMonthlyCalendars = () => {
    const months = [];
    const startDate = new Date(bidPeriod.startDate);
    const numCycles = bidPeriod.numCycles || 1;
    const totalDays = 56 * numCycles;
    
    let currentDate = new Date(startDate);
    let dayNumber = 1;
    
    while (dayNumber <= totalDays) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const weeks = [];
      const current = new Date(monthStart);
      
      while (current <= monthEnd) {
        const week = [];
        
        if (current.getDate() === 1) {
          const startDay = current.getDay();
          for (let i = 0; i < startDay; i++) {
            week.push(null);
          }
        }
        
        while (week.length < 7 && current <= monthEnd) {
          const cellDate = new Date(current);
          const daysDiff = Math.floor((cellDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const isInSchedule = daysDiff >= 1 && daysDiff <= totalDays;
          const scheduleDayNumber = isInSchedule ? daysDiff : null;
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
            holiday: holiday ? translateHolidayName(holiday.name, locale) : undefined,
            isWeekend: cellDate.getDay() === 0 || cellDate.getDay() === 6,
            isInSchedule
          });
          
          current.setDate(current.getDate() + 1);
        }
        
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
      
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
      
      const nextMonthStart = new Date(currentDate);
      dayNumber = Math.floor((nextMonthStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    return months;
  };

  const months = generateMonthlyCalendars();

  const getShiftColor = (shift: ScheduleShift | undefined, isWeekend: boolean, isHoliday: boolean, isInSchedule: boolean) => {
    const fadeStyle = !isInSchedule ? 'opacity-40 ' : '';
    
    if (!shift?.shiftCode) {
      if (isHoliday) return fadeStyle + 'bg-yellow-100 text-yellow-800 border-yellow-300';
      return fadeStyle + 'bg-green-100 text-green-800 border-green-300';
    }

    if (isHoliday) return fadeStyle + 'bg-red-100 text-red-800 border-red-400';
    if (isWeekend) return fadeStyle + 'bg-orange-100 text-orange-800 border-orange-400';
    
    const category = shift.shiftCode?.category?.toLowerCase() || '';
    if (category.includes('day') || category.includes('am')) {
      return fadeStyle + 'bg-blue-100 text-blue-800 border-blue-400';
    } else if (category.includes('evening') || category.includes('pm')) {
      return fadeStyle + 'bg-purple-100 text-purple-800 border-purple-400';
    } else if (category.includes('night') || category.includes('mid')) {
      return fadeStyle + 'bg-indigo-100 text-indigo-800 border-indigo-400';
    }
    
    return fadeStyle + 'bg-gray-100 text-gray-800 border-gray-400';
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return '';
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: false 
      });
    } catch {
      return time || '';
    }
  };

  return (
    <>
      {months.map((monthData, monthIndex) => (
        <div key={`${monthData.year}-${monthData.month}`} className="pdf-monthly-page page-break-before">
          {/* Month Header */}
          <div className="text-center mb-3">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {formatMonthYear(new Date(monthData.year, monthData.month), locale)}
            </h2>
            <h3 className="text-lg font-semibold text-gray-600">
              {operationName} - {translations.line} {bidLineNumber}
            </h3>
            <p className="text-xs text-gray-500">
              {formatDate(new Date(bidPeriod.startDate), 'MMM dd, yyyy', locale)} - {formatDate(new Date(bidPeriod.endDate), 'MMM dd, yyyy', locale)}
              {bidPeriod.numCycles && bidPeriod.numCycles > 1 && ` • ${bidPeriod.numCycles} Cycles`}
            </p>
          </div>

          {/* Legend */}
          <div className="mb-3 text-center">
            <div className="inline-flex flex-wrap gap-3 text-xs justify-center">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                <span className="font-medium">{translations.off}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-100 border border-blue-400"></div>
                <span className="font-medium">{translations.day}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-purple-100 border border-purple-400"></div>
                <span className="font-medium">{translations.evening}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-400"></div>
                <span className="font-medium">{translations.night}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-100 border border-orange-400"></div>
                <span className="font-medium">{translations.weekendWork}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
                <span className="font-medium">{translations.holiday}</span>
              </div>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {(locale === 'fr' ? ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']).map(day => (
              <div key={day} className="text-center font-bold text-sm text-gray-700 py-2 bg-gray-50 rounded">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthData.weeks.flatMap(week =>
              week.map((day, dayIndex) => (
                day ? (
                  <div
                    key={day.date.getTime()}
                    className={`
                      relative border-2 rounded-lg p-2 transition-all flex flex-col justify-between
                      ${getShiftColor(day.shift, day.isWeekend, day.isHoliday, day.isInSchedule)}
                    `}
                    style={{ height: '85px' }}
                  >
                    {/* Date */}
                    <div className="text-left">
                      <div className="text-lg font-bold leading-none">
                        {day.date.getDate()}
                      </div>
                    </div>
                    
                    {/* Shift Information */}
                    {day.isInSchedule && (
                      <div className="text-center mt-1">
                        {day.shift?.shiftCode ? (
                          <div className="space-y-0">
                            <div className="text-base font-bold leading-tight">
                              {day.shift.shiftCode.code}
                            </div>
                            {(day.shift.shiftCode.beginTime || day.shift.shiftCode.endTime) && (
                              <div className="text-xs font-medium leading-tight">
                                {formatTime(day.shift.shiftCode.beginTime).slice(0,5)}-{formatTime(day.shift.shiftCode.endTime).slice(0,5)}
                              </div>
                            )}
                            {day.shift.shiftCode.hoursLength && (
                              <div className="text-xs opacity-75 leading-tight">
                                {day.shift.shiftCode.hoursLength}h
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-base font-bold">
                            OFF
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Holiday Information */}
                    {day.isHoliday && day.holiday && (
                      <div className="mt-1 text-xs font-medium text-center bg-white/80 rounded px-1 truncate">
                        {day.holiday.split(' ').slice(0, 2).join(' ')}
                      </div>
                    )}
                    
                    {/* Holiday indicator dot */}
                    {day.isHoliday && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                  </div>
                ) : (
                  <div
                    key={`empty-${monthIndex}-${dayIndex}`}
                    className="border-2 border-transparent rounded-lg"
                    style={{ height: '85px' }}
                  ></div>
                )
              ))
            )}
          </div>

          {/* Month-specific Holidays at Bottom */}
          {(() => {
            // Get holidays for this specific month
            const monthHolidays = monthData.weeks.flatMap(week =>
              week.filter((day): day is NonNullable<typeof day> => day !== null && day.isHoliday).map(day => ({
                ...day,
                holidayName: day.holiday || '',
                isWorking: day.shift?.shiftCode ? true : false,
                shiftCode: day.shift?.shiftCode?.code || '',
                shiftTime: day.shift?.shiftCode ?
                  `${day.shift.shiftCode.beginTime?.slice(0,5) || ''}-${day.shift.shiftCode.endTime?.slice(0,5) || ''}` : ''
              }))
            );

            const workingHolidays = monthHolidays.filter(h => h.isWorking);
            const offHolidays = monthHolidays.filter(h => !h.isWorking);

            if (monthHolidays.length === 0) return null;

            return (
              <div className="mt-4 border-t pt-3">
                <h4 className="text-sm font-bold text-gray-800 mb-2">{translations.holidaysThisMonth}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {workingHolidays.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <h5 className="font-semibold text-red-800 text-xs mb-1">
                        {translations.working} ({workingHolidays.length})
                      </h5>
                      <div className="space-y-1">
                        {workingHolidays.map((holiday, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium text-red-900">
                              {holiday.date ? formatDate(holiday.date, 'MMM d', locale) : ''} - {holiday.holidayName}
                            </span>
                            <span className="text-red-700 ml-2">
                              {holiday.shiftCode} {holiday.shiftTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {offHolidays.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <h5 className="font-semibold text-green-800 text-xs mb-1">
                        {translations.off} ({offHolidays.length})
                      </h5>
                      <div className="space-y-1">
                        {offHolidays.map((holiday, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium text-green-900">
                              {holiday.date ? formatDate(holiday.date, 'MMM d', locale) : ''} - {holiday.holidayName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ))}
      
      <style jsx>{`
        .pdf-monthly-page {
          page-break-before: always;
          break-before: page;
          padding: 20px;
        }
        
        @media print {
          .pdf-monthly-page {
            page-break-before: always !important;
            break-before: page !important;
            margin: 0;
            padding: 15px;
          }
        }
      `}</style>
    </>
  );
}