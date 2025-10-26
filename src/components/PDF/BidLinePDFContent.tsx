'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { getTotalWeekendsInPeriod } from '@/utils/bidLineMetrics';
import { useBidLineHolidays } from '@/hooks/useBidLineHolidays';
import { getShiftBreakdown } from '@/utils/bidLineMetrics';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';
import { translateHolidayName } from '@/utils/holidayTranslations';
import PDFCalendar from './PDFCalendar';
import PDFMonthlyCalendar from './PDFMonthlyCalendar';
import PDFTitlePage from './PDFTitlePage';

interface BidLinePDFContentProps {
  bidLine: any;
  translations: Record<string, string>;
  locale: string;
}

const PDFMetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string; 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    pink: 'bg-pink-50 border-pink-200 text-pink-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    violet: 'bg-violet-50 border-violet-200 text-violet-800',
    fuchsia: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800',
    stone: 'bg-stone-50 border-stone-200 text-stone-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    teal: 'bg-teal-50 border-teal-200 text-teal-800',
  };

  return (
    <div className={`pdf-metric-card rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.stone}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon className="w-4 h-4" />
        <span className="pdf-metric-value font-bold">{value}</span>
      </div>
      <div className="text-xs font-medium leading-tight">{title}</div>
    </div>
  );
};

export function BidLinePDFContent({ bidLine, translations, locale }: BidLinePDFContentProps) {
  const [detailedHolidays, setDetailedHolidays] = useState<{
    working: Array<{ name: string; date: Date; shiftCode: string; beginTime: string; endTime: string }>;
    off: Array<{ name: string; date: Date }>;
  }>({ working: [], off: [] });

  const metrics = bidLine.scheduleMetrics;
  const { holidayData } = useBidLineHolidays(bidLine.bidPeriod, bidLine.scheduleShifts);

  useEffect(() => {
    const fetchDetailedHolidays = async () => {
      if (!bidLine.bidPeriod?.startDate || !bidLine.bidPeriod?.endDate) return;

      try {
        const start = new Date(bidLine.bidPeriod.startDate);
        const end = new Date(bidLine.bidPeriod.endDate);
        const holidays = await getHolidaysForPeriod(start, end, HolidayFilters.NO_OBSCURE);
        
        const working: Array<{ name: string; date: Date; shiftCode: string; beginTime: string; endTime: string }> = [];
        const off: Array<{ name: string; date: Date }> = [];

        if (bidLine.scheduleShifts && bidLine.scheduleShifts.length > 0) {
          // Get the total number of cycles for proper day calculation
          const numCycles = bidLine.bidPeriod?.numCycles || 1;
          const cycleDays = 56; // Standard cycle length
          
          holidays.forEach(holiday => {
            // Calculate which day in the overall schedule this holiday falls on
            const daysSinceStart = Math.floor((holiday.date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            
            // Find which cycle we're in (0-indexed)
            const cycleNumber = Math.floor(daysSinceStart / cycleDays);
            
            // Find day within the current cycle (1-56)
            const dayInCycle = (daysSinceStart % cycleDays) + 1;
            
            // Look for the shift on this day of the cycle
            const shift = bidLine.scheduleShifts?.find((s: any) => s.dayNumber === dayInCycle);
            
            if (shift?.shiftCode) {
              working.push({
                name: translateHolidayName(holiday.name, locale),
                date: holiday.date,
                shiftCode: shift.shiftCode.code,
                beginTime: shift.shiftCode.beginTime,
                endTime: shift.shiftCode.endTime
              });
            } else {
              off.push({
                name: translateHolidayName(holiday.name, locale),
                date: holiday.date
              });
            }
          });
        } else {
          holidays.forEach(holiday => {
            const dayOfWeek = holiday.date.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              working.push({
                name: translateHolidayName(holiday.name, locale),
                date: holiday.date,
                shiftCode: 'Unknown',
                beginTime: 'Unknown',
                endTime: 'Unknown'
              });
            } else {
              off.push({
                name: translateHolidayName(holiday.name, locale),
                date: holiday.date
              });
            }
          });
        }

        setDetailedHolidays({ working, off });
      } catch (error) {
        console.error('Failed to fetch detailed holidays:', error);
        setDetailedHolidays({ working: [], off: [] });
      }
    };

    fetchDetailedHolidays();
  }, [bidLine.bidPeriod?.startDate, bidLine.bidPeriod?.endDate, bidLine.scheduleShifts]);
  
  if (!metrics) {
    return <div>No metrics available</div>;
  }

  // Calculate summary stats
  const totalDaysOff = (metrics.totalDaysInPeriod || 0) - (metrics.totalDaysWorked || 0);
  const workPercentage = metrics.totalDaysInPeriod > 0 
    ? Math.round((metrics.totalDaysWorked / metrics.totalDaysInPeriod) * 100)
    : 0;

  // Calculate weekend totals
  const totalWeekendsInPeriod = getTotalWeekendsInPeriod(bidLine.bidPeriod) || 0;
  const totalFridaysInPeriod = metrics.totalFridaysInPeriod || 0;

  // Get shift breakdown
  const shiftBreakdown = getShiftBreakdown(bidLine.scheduleShifts, bidLine.bidPeriod);

  return (
    <>
    {/* Title Page */}
    <PDFTitlePage 
      bidLine={bidLine}
      bidPeriod={bidLine.bidPeriod}
      operationName={bidLine.operation?.name}
      translations={translations}
      locale={locale}
    />

    <div data-pdf-content className="pdf-compact w-full mx-auto p-4 bg-white">
      {/* Header */}
      <div className="mb-3 border-b border-gray-200 pb-2 page-break-avoid">
        <h1 className="font-bold text-gray-900 mb-1 text-center">
          {bidLine.operation?.name || 'Unknown Operation'}
        </h1>
        <div className="text-center mb-1">
          <span className="text-xl font-bold text-gray-800">{translations.line} {bidLine.lineNumber}</span>
          <span className="text-gray-600 mx-2">•</span>
          <span className="text-gray-600">{translations.allMetricsReport}</span>
        </div>
        <p className="text-xs text-gray-500 text-center italic">
          {translations.allMetricsForPeriod}
        </p>
        
        {/* Quick Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 rounded p-2 text-center border border-blue-200">
            <div className="text-lg font-bold text-blue-800">{metrics.totalDaysWorked}</div>
            <div className="text-xs text-blue-600">{translations.totalDaysWorked}</div>
          </div>
          <div className="bg-blue-50 rounded p-2 text-center border border-blue-200">
            <div className="text-lg font-bold text-blue-800">{totalDaysOff}</div>
            <div className="text-xs text-blue-600">{translations.daysOff}</div>
          </div>
          <div className="bg-blue-50 rounded p-2 text-center border border-blue-200">
            <div className="text-lg font-bold text-blue-800">{workPercentage}%</div>
            <div className="text-xs text-blue-600">{translations.workLoad}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Weekend Metrics */}
        <section className="page-break-avoid">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center border-b border-gray-200 pb-1">
            <Calendar className="w-4 h-4 mr-1 text-purple-600" />
            {translations.weekendMetrics}
          </h3>
          <div className="text-xs text-gray-600 mb-2 italic">
            <span className="font-medium">{translations.fullWeekendDef}</span> | 
            <span className="font-medium ml-2">{translations.soloWeekendDef}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <PDFMetricCard
              title={translations.weekendsWorking}
              value={`${metrics.weekendsOn} of ${totalWeekendsInPeriod}`}
              icon={Calendar}
              color="purple"
            />
            <PDFMetricCard
              title={translations.saturdays}
              value={metrics.saturdaysOn}
              icon={Calendar}
              color="indigo"
            />
            <PDFMetricCard
              title={translations.sundays}
              value={metrics.sundaysOn}
              icon={Calendar}
              color="pink"
            />
            <PDFMetricCard
              title={translations.totalSaturdays}
              value={`${metrics.totalSaturdays} of ${metrics.totalSaturdaysInPeriod}`}
              icon={Calendar}
              color="violet"
            />
            <PDFMetricCard
              title={translations.totalSundays}
              value={`${metrics.totalSundays} of ${metrics.totalSundaysInPeriod}`}
              icon={Calendar}
              color="fuchsia"
            />
            <PDFMetricCard
              title={translations.fridayWeekendBlocks}
              value={`${metrics.fridayWeekendBlocks} of ${totalFridaysInPeriod}`}
              icon={Calendar}
              color="emerald"
            />
          </div>
        </section>

        {/* Weekday Breakdown */}
        <section className="page-break-avoid">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center border-b border-gray-200 pb-1">
            <BarChart3 className="w-4 h-4 mr-1 text-blue-600" />
            {translations.weekdayBreakdown}
          </h3>
          <div className="flex flex-wrap gap-2">
            <PDFMetricCard
              title={translations.totalMondays}
              value={`${metrics.totalMondays} of ${metrics.totalMondaysInPeriod}`}
              icon={Calendar}
              color="blue"
            />
            <PDFMetricCard
              title={translations.totalTuesdays}
              value={`${metrics.totalTuesdays} of ${metrics.totalTuesdaysInPeriod}`}
              icon={Calendar}
              color="green"
            />
            <PDFMetricCard
              title={translations.totalWednesdays}
              value={`${metrics.totalWednesdays} of ${metrics.totalWednesdaysInPeriod}`}
              icon={Calendar}
              color="yellow"
            />
            <PDFMetricCard
              title={translations.totalThursdays}
              value={`${metrics.totalThursdays} of ${metrics.totalThursdaysInPeriod}`}
              icon={Calendar}
              color="red"
            />
            <PDFMetricCard
              title={translations.totalFridays}
              value={`${metrics.totalFridays} of ${metrics.totalFridaysInPeriod}`}
              icon={Calendar}
              color="purple"
            />
            <PDFMetricCard
              title={translations.weekdayBlocks}
              value={metrics.weekdayBlocks}
              icon={Calendar}
              color="teal"
            />
          </div>
        </section>

        {/* Work Blocks */}
        <section className="page-break-avoid">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center border-b border-gray-200 pb-1">
            <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" />
            {translations.workBlocks}
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.singleDays > 0 && (
              <PDFMetricCard title={translations.singleDays} value={metrics.singleDays} icon={BarChart3} color="amber" />
            )}
            {metrics.blocks2day > 0 && (
              <PDFMetricCard title={translations.blocks2day} value={metrics.blocks2day} icon={BarChart3} color="red" />
            )}
            {metrics.blocks3day > 0 && (
              <PDFMetricCard title={translations.blocks3day} value={metrics.blocks3day} icon={BarChart3} color="yellow" />
            )}
            {metrics.blocks4day > 0 && (
              <PDFMetricCard title={translations.blocks4day} value={metrics.blocks4day} icon={BarChart3} color="blue" />
            )}
            {metrics.blocks5day > 0 && (
              <PDFMetricCard title={translations.blocks5day} value={metrics.blocks5day} icon={BarChart3} color="emerald" />
            )}
            {metrics.blocks6day > 0 && (
              <PDFMetricCard title={translations.blocks6day} value={metrics.blocks6day} icon={BarChart3} color="purple" />
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <PDFMetricCard
              title={translations.longestStretch}
              value={`${metrics.longestStretch} ${translations.days}`}
              icon={TrendingUp}
              color="stone"
            />
          </div>
        </section>


        {/* Off-Day Blocks */}
        <section className="page-break-avoid">
          <h3 className="font-bold text-gray-900 mb-2 flex items-center border-b border-gray-200 pb-1">
            <Calendar className="w-4 h-4 mr-1 text-cyan-600" />
            {translations.offDayPatterns}
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.offBlocks2day > 0 && (
              <PDFMetricCard title={translations.offBlocks2day} value={metrics.offBlocks2day} icon={Calendar} color="blue" />
            )}
            {metrics.offBlocks3day > 0 && (
              <PDFMetricCard title={translations.offBlocks3day} value={metrics.offBlocks3day} icon={Calendar} color="green" />
            )}
            {metrics.offBlocks4day > 0 && (
              <PDFMetricCard title={translations.offBlocks4day} value={metrics.offBlocks4day} icon={Calendar} color="yellow" />
            )}
            {metrics.offBlocks5day > 0 && (
              <PDFMetricCard title={translations.offBlocks5day} value={metrics.offBlocks5day} icon={Calendar} color="purple" />
            )}
            {metrics.offBlocks6day > 0 && (
              <PDFMetricCard title={translations.offBlocks6day} value={metrics.offBlocks6day} icon={Calendar} color="pink" />
            )}
            {metrics.offBlocks7dayPlus > 0 && (
              <PDFMetricCard title={translations.offBlocks7dayPlus} value={metrics.offBlocks7dayPlus} icon={Calendar} color="indigo" />
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <PDFMetricCard
              title={translations.longestOff}
              value={`${metrics.longestOffStretch} ${translations.days}`}
              icon={TrendingUp}
              color="emerald"
            />
            <PDFMetricCard
              title={translations.shortestOff}
              value={`${metrics.shortestOffStretch} ${translations.days}`}
              icon={Clock}
              color="amber"
            />
          </div>
        </section>

      </div>
    </div>

    {/* Calendar Pages */}
    <PDFCalendar
      schedule={bidLine.schedule}
      bidPeriod={bidLine.bidPeriod}
      bidLineNumber={bidLine.lineNumber}
      operationName={bidLine.operation?.name}
      detailedHolidays={detailedHolidays}
      translations={translations}
      locale={locale}
    />
    
    {/* Full Page Monthly Calendars */}
    <PDFMonthlyCalendar
      schedule={bidLine.schedule}
      bidPeriod={bidLine.bidPeriod}
      bidLineNumber={bidLine.lineNumber}
      operationName={bidLine.operation?.name}
      translations={translations}
      locale={locale}
    />
  </>
  );
}