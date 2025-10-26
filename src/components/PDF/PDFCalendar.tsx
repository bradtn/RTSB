'use client';

import { useState, useEffect } from 'react';
import { formatDate, formatMonthYear } from '@/utils/dateFormatting';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';
import { Users } from 'lucide-react';

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

interface PDFCalendarProps {
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
  detailedHolidays?: {
    working: Array<{ name: string; date: Date; shiftCode: string; beginTime: string; endTime: string }>;
    off: Array<{ name: string; date: Date }>;
  };
  translations: Record<string, string>;
  locale?: string;
}

export default function PDFCalendar({ 
  schedule, 
  bidPeriod, 
  bidLineNumber, 
  operationName,
  detailedHolidays,
  translations,
  locale = 'en' 
}: PDFCalendarProps) {
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
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 text-sm">No schedule data available</p>
      </div>
    );
  }

  // Create a map of day numbers to shifts
  const shiftMap = new Map<number, ScheduleShift>();
  schedule.scheduleShifts.forEach(shift => {
    shiftMap.set(shift.dayNumber, shift);
  });

  const generateCompactCalendar = () => {
    const months = [];
    const startDate = new Date(bidPeriod.startDate);
    const numCycles = bidPeriod.numCycles || 1;
    const totalDays = 56 * numCycles;
    
    let currentDate = new Date(startDate);
    let dayNumber = 1;
    
    // Generate months that cover the schedule period
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
          
          week.push({
            date: new Date(cellDate),
            dayNumber: scheduleDayNumber,
            shift,
            isHoliday,
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

  const months = generateCompactCalendar();

  const getShiftColor = (shift: ScheduleShift | undefined, isWeekend: boolean, isHoliday: boolean, isInSchedule: boolean) => {
    const fadeStyle = !isInSchedule ? 'opacity-40 ' : '';
    
    if (!shift?.shiftCode) {
      if (isHoliday) return fadeStyle + 'bg-yellow-100 text-yellow-800';
      return fadeStyle + 'bg-green-100 text-green-800';
    }

    if (isHoliday) return fadeStyle + 'bg-red-100 text-red-800 border border-red-300';
    if (isWeekend) return fadeStyle + 'bg-orange-100 text-orange-800 border border-orange-300';
    
    const category = shift.shiftCode?.category?.toLowerCase() || '';
    if (category.includes('day') || category.includes('am')) {
      return fadeStyle + 'bg-blue-100 text-blue-800 border border-blue-300';
    } else if (category.includes('evening') || category.includes('pm')) {
      return fadeStyle + 'bg-purple-100 text-purple-800 border border-purple-300';
    } else if (category.includes('night') || category.includes('mid')) {
      return fadeStyle + 'bg-indigo-100 text-indigo-800 border border-indigo-300';
    }
    
    return fadeStyle + 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  // Group months into rows for better layout
  const monthRows = [];
  for (let i = 0; i < months.length; i += 3) {
    monthRows.push(months.slice(i, i + 3));
  }

  return (
    <div className="pdf-calendar-page px-2">
      {/* Page Break Before Calendar */}
      <div className="page-break-before"></div>
      
      {/* Calendar Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{translations.scheduleCalendar}</h2>
        <h3 className="text-lg font-semibold text-gray-600">
          {operationName} - Line {bidLineNumber}
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          {formatDate(new Date(bidPeriod.startDate), 'MMM dd, yyyy', locale)} - {formatDate(new Date(bidPeriod.endDate), 'MMM dd, yyyy', locale)}
          {bidPeriod.numCycles && bidPeriod.numCycles > 1 && ` • ${bidPeriod.numCycles} Cycles`}
        </p>
      </div>

      {/* Legend */}
      <div className="mb-3 text-center">
        <div className="inline-flex flex-wrap gap-3 text-xs justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>{translations.off}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span>{translations.day}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
            <span>{translations.evening}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300"></div>
            <span>{translations.night}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
            <span>{translations.weekendWork}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
            <span>{translations.holiday}</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid space-y-6">
        {monthRows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-3">
            {row.map((monthData) => (
              <div key={`${monthData.year}-${monthData.month}`} className="month-container">
                {/* Month Header */}
                <div className="text-center mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">
                    {formatMonthYear(new Date(monthData.year, monthData.month), locale)}
                  </h4>
                </div>
                
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {monthData.weeks.flatMap(week =>
                    week.map((day, dayIndex) => (
                      day ? (
                        <div
                          key={day.date.getTime()}
                          className={`
                            relative aspect-square text-xs border transition-all flex flex-col justify-between p-0.5
                            ${getShiftColor(day.shift, day.isWeekend, day.isHoliday, day.isInSchedule)}
                          `}
                          style={{ minHeight: '32px', fontSize: '6px' }}
                        >
                          {/* Date */}
                          <div className="text-right font-semibold leading-none" style={{ fontSize: '7px' }}>
                            {day.date.getDate()}
                          </div>
                          
                          {/* Shift Code */}
                          {day.isInSchedule && (
                            <div className="text-center leading-none">
                              {day.shift?.shiftCode ? (
                                <div className="font-bold" style={{ fontSize: '8px' }}>
                                  {day.shift.shiftCode.code}
                                </div>
                              ) : (
                                <div className="font-medium" style={{ fontSize: '8px' }}>OFF</div>
                              )}
                            </div>
                          )}
                          
                          {/* Holiday indicator */}
                          {day.isHoliday && (
                            <div className="absolute top-0 left-0 w-1 h-1 bg-yellow-500 rounded-full"></div>
                          )}
                        </div>
                      ) : (
                        <div key={`empty-${dayIndex}`} className="aspect-square" style={{ minHeight: '32px' }}></div>
                      )
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Shift Codes and Holiday Summary */}
      <div className="mt-6 px-2">
        
        {/* Shift Codes Summary - Horizontal Display */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2 text-center">{translations.shiftCodesSummary}</h3>
          <div className="bg-gray-50 border border-gray-200 rounded p-2">
            <div className="flex flex-wrap justify-center gap-2">
              {schedule?.scheduleShifts && (() => {
                const shiftCounts = new Map<string, { count: number; time: string; hours: number }>();
                schedule.scheduleShifts.forEach(shift => {
                  if (shift.shiftCode) {
                    const code = shift.shiftCode.code;
                    if (!shiftCounts.has(code)) {
                      shiftCounts.set(code, {
                        count: 0,
                        time: `${shift.shiftCode.beginTime?.slice(0,5) || ''}-${shift.shiftCode.endTime?.slice(0,5) || ''}`,
                        hours: shift.shiftCode.hoursLength
                      });
                    }
                    shiftCounts.get(code)!.count++;
                  }
                });
                
                return Array.from(shiftCounts.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([code, info]) => (
                    <div key={code} className="bg-white border border-gray-300 rounded px-2 py-1 text-center">
                      <div className="font-bold text-blue-600" style={{ fontSize: '10px' }}>{code}</div>
                      <div className="text-gray-600" style={{ fontSize: '8px' }}>×{info.count * (bidPeriod?.numCycles || 1)}</div>
                      <div className="text-gray-500" style={{ fontSize: '7px' }}>{info.time}</div>
                      <div className="text-gray-400" style={{ fontSize: '7px' }}>{info.hours}h</div>
                    </div>
                  ));
              })()}
            </div>
          </div>
        </div>

        {/* Holiday Information - Centered */}
        {detailedHolidays && (detailedHolidays.working.length > 0 || detailedHolidays.off.length > 0) && (() => {
          const workingCount = detailedHolidays.working.length;
          const offCount = detailedHolidays.off.length;
          const workingColumns = workingCount > 6 ? 3 : workingCount > 3 ? 2 : 1;
          const offColumns = offCount > 6 ? 3 : offCount > 3 ? 2 : 1;
          
          return (
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2 text-center flex items-center justify-center">
                <Users className="w-4 h-4 mr-1 text-red-600" />
                {translations.holidayInfo}
              </h3>
              <div className="flex justify-center gap-4">
                {/* Working Holidays */}
                {detailedHolidays.working.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3" style={{ maxWidth: '500px' }}>
                    <h4 className="font-semibold text-red-800 mb-2 text-center" style={{ fontSize: '12px' }}>
                      {translations.working} {translations.holidaysWorking} ({detailedHolidays.working.length})
                    </h4>
                    <div className={`grid grid-cols-${workingColumns} gap-2`}>
                      {detailedHolidays.working.map((holiday, index) => (
                        <div key={index} className="bg-white rounded px-2 py-1 border border-red-100 text-center">
                          <div className="font-medium text-red-900 leading-tight" style={{ fontSize: '9px' }}>
                            {holiday.name.length > 18 ? holiday.name.substring(0, 18) + '...' : holiday.name}
                          </div>
                          <div className="text-red-700 leading-tight" style={{ fontSize: '8px' }}>
                            {formatDate(holiday.date, 'MMM d', locale)} • {holiday.shiftCode}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Off Holidays */}
                {detailedHolidays.off.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-3" style={{ maxWidth: '500px' }}>
                    <h4 className="font-semibold text-green-800 mb-2 text-center" style={{ fontSize: '12px' }}>
                      {translations.holidaysOff} ({detailedHolidays.off.length})
                    </h4>
                    <div className={`grid grid-cols-${offColumns} gap-2`}>
                      {detailedHolidays.off.map((holiday, index) => (
                        <div key={index} className="bg-white rounded px-2 py-1 border border-green-100 text-center">
                          <div className="font-medium text-green-900 leading-tight" style={{ fontSize: '9px' }}>
                            {holiday.name.length > 18 ? holiday.name.substring(0, 18) + '...' : holiday.name}
                          </div>
                          <div className="text-green-700 leading-tight" style={{ fontSize: '8px' }}>
                            {formatDate(holiday.date, 'MMM d', locale)}
                          </div>
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
      
      <style jsx>{`
        .pdf-calendar-page {
          page-break-inside: avoid;
        }
        
        .calendar-grid {
          font-size: 8px;
        }
        
        .month-container {
          page-break-inside: avoid;
        }
        
        @media print {
          .pdf-calendar-page {
            break-after: page;
          }
          
          .calendar-grid {
            font-size: 7px;
          }
          
          .month-container {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}