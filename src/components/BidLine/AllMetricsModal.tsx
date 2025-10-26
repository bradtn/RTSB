'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Users, Clock, BarChart3, TrendingUp, Download } from 'lucide-react';
import { formatDate, formatMonthYear } from '@/utils/dateFormatting';
import { translateHolidayName } from '@/utils/holidayTranslations';
import { getTotalWeekendsInPeriod } from '@/utils/bidLineMetrics';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';
import ScheduleCalendar from './ScheduleCalendar';

interface HolidayData {
  holidaysWorking: number;
  holidaysOff: number;
  totalHolidays: number;
}

interface DetailedHolidayData {
  working: Array<{ name: string; date: Date; shiftCode: string; beginTime: string; endTime: string }>;
  off: Array<{ name: string; date: Date }>;
}

interface ShiftBreakdown {
  [key: string]: {
    count: number;
    beginTime: string;
    endTime: string;
    hoursLength: number;
  };
}

interface AllMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  bidLine: {
    id: string;
    lineNumber: string;
    operation?: {
      name: string;
    };
    scheduleMetrics?: {
      weekendsOn: number;
      saturdaysOn: number;
      sundaysOn: number;
      blocks5day: number;
      blocks4day: number;
      blocks3day: number;
      blocks2day: number;
      blocks6day: number;
      singleDays: number;
      holidaysWorking: number;
      holidaysOff: number;
      shiftPattern: string;
      totalSaturdays: number;
      totalSaturdaysInPeriod: number;
      totalSundays: number;
      totalSundaysInPeriod: number;
      totalMondays: number;
      totalMondaysInPeriod: number;
      totalTuesdays: number;
      totalTuesdaysInPeriod: number;
      totalWednesdays: number;
      totalWednesdaysInPeriod: number;
      totalThursdays: number;
      totalThursdaysInPeriod: number;
      totalFridays: number;
      totalFridaysInPeriod: number;
      totalDaysWorked: number;
      totalDaysInPeriod: number;
      longestStretch: number;
      fridayWeekendBlocks: number;
      weekdayBlocks: number;
      offBlocks2day: number;
      offBlocks3day: number;
      offBlocks4day: number;
      offBlocks5day: number;
      offBlocks6day: number;
      offBlocks7dayPlus: number;
      longestOffStretch: number;
      shortestOffStretch: number;
    };
    bidPeriod?: {
      name: string;
      numCycles: number;
      startDate: string;
      endDate: string;
    };
    scheduleShifts?: Array<{
      dayNumber: number;
      shiftCode?: {
        code: string;
        beginTime: string;
        endTime: string;
        category: string;
        hoursLength: number;
      };
    }>;
    schedule?: {
      scheduleShifts?: Array<{
        dayNumber: number;
        shiftCode?: {
          code: string;
          beginTime: string;
          endTime: string;
          category: string;
          hoursLength: number;
        };
      }>;
    };
  };
  holidayData?: HolidayData; // Made optional - we'll calculate it internally
  shiftBreakdown?: ShiftBreakdown | null;
  translations: {
    // Modal structure
    allMetricsTitle?: string;
    weekendMetrics?: string;
    weekdayBreakdown?: string;
    workBlocks?: string;
    specialPatterns?: string;
    holidayInfo?: string;
    summaryStats?: string;
    close?: string;
    of?: string;
    bidLineNumber?: string;
    
    // Individual metric labels  
    weekendsWorking?: string;
    saturdays?: string;
    sundays?: string;
    totalSaturdays?: string;
    totalSundays?: string;
    totalMondays?: string;
    totalTuesdays?: string;
    totalWednesdays?: string;
    totalThursdays?: string;
    totalFridays?: string;
    fiveDayBlocks?: string;
    fourDayBlocks?: string;
    threeDayBlocks?: string;
    twoDayBlocks?: string;
    sixDayBlocks?: string;
    singleDays?: string;
    longestStretch?: string;
    fridayWeekendBlocks?: string;
    weekdayBlocks?: string;
    holidays?: string;
    holidaysWorking?: string;
    holidaysOff?: string;
    totalDaysWorked?: string;
    totalDaysInPeriod?: string;
    shiftPattern?: string;
    
    // Missing translations that are used in the component
    daysOff?: string;
    workLoad?: string;
    blocks2day?: string;
    blocks3day?: string;
    blocks4day?: string;
    blocks5day?: string;
    blocks6day?: string;
    offBlocks2day?: string;
    offBlocks3day?: string;
    offBlocks4day?: string;
    offBlocks5day?: string;
    offBlocks6day?: string;
    offBlocks7dayPlus?: string;
    longestOff?: string;
    shortestOff?: string;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    purple: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-200',
    pink: 'bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-200',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200',
    violet: 'bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-200',
    fuchsia: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-900/20 dark:border-fuchsia-800 dark:text-fuchsia-200',
    stone: 'bg-stone-50 border-stone-200 text-stone-800 dark:bg-stone-900/20 dark:border-stone-800 dark:text-stone-200',
    amber: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200',
    teal: 'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-200',
  };

  return (
    <div className={`w-40 h-24 p-3 rounded-lg border-2 transition-all hover:shadow-md ${colorClasses[color as keyof typeof colorClasses] || colorClasses.stone}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-sm font-medium">{title}</div>
      {subtitle && <div className="text-xs opacity-75 mt-1">{subtitle}</div>}
    </div>
  );
};

export default function AllMetricsModal({ 
  isOpen, 
  onClose, 
  locale = 'en',
  bidLine, 
  holidayData: externalHolidayData,
  shiftBreakdown,
  translations 
}: AllMetricsModalProps) {
  const [mounted, setMounted] = useState(false);
  
  
  const [detailedHolidays, setDetailedHolidays] = useState<DetailedHolidayData>({ working: [], off: [] });
  const [holidayData, setHolidayData] = useState<HolidayData>({
    holidaysWorking: 0,
    holidaysOff: 0,
    totalHolidays: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchDetailedHolidays = async () => {
      if (!bidLine.bidPeriod?.startDate || !bidLine.bidPeriod?.endDate) return;

      try {
        const start = new Date(bidLine.bidPeriod.startDate);
        const end = new Date(bidLine.bidPeriod.endDate);
        const holidays = await getHolidaysForPeriod(start, end, HolidayFilters.NO_OBSCURE);
        
        const working: Array<{ name: string; date: Date; shiftCode: string; beginTime: string; endTime: string }> = [];
        const off: Array<{ name: string; date: Date }> = [];

        // Use the same path as MetricModal: bidLine.schedule?.scheduleShifts
        const scheduleShifts = bidLine.schedule?.scheduleShifts || bidLine.scheduleShifts;
        
        if (scheduleShifts && scheduleShifts.length > 0) {
          holidays.forEach(holiday => {
            const daysSinceStart = Math.floor((holiday.date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const dayNumber = daysSinceStart + 1;
            // Map to the 56-day cycle pattern (cycle repeats every 56 days)
            const cycleDay = ((dayNumber - 1) % 56) + 1;
            
            const shift = scheduleShifts.find(s => s.dayNumber === cycleDay);
            
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
          // Fallback when no schedule shifts data is available
          holidays.forEach(holiday => {
            const dayOfWeek = holiday.date.getDay();
            // Conservative estimate: only count Mon-Fri as potential working days
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
        
        // Update the holiday summary data
        setHolidayData({
          holidaysWorking: working.length,
          holidaysOff: off.length,
          totalHolidays: holidays.length
        });
        
        // Debug logging to help troubleshoot
        console.log('Holiday breakdown debug for line', bidLine.lineNumber, {
          totalHolidays: holidays.length,
          workingCount: working.length,
          offCount: off.length,
          hasScheduleShifts: !!(scheduleShifts && scheduleShifts.length > 0),
          scheduleShiftsCount: scheduleShifts?.length || 0,
          workingHolidays: working.map(h => ({ name: h.name, date: h.date, shiftCode: h.shiftCode })),
          offHolidays: off.map(h => ({ name: h.name, date: h.date }))
        });
      } catch (error) {
        console.error('Failed to fetch detailed holidays:', error);
        setDetailedHolidays({ working: [], off: [] });
      }
    };

    fetchDetailedHolidays();
  }, [bidLine.bidPeriod?.startDate, bidLine.bidPeriod?.endDate, bidLine.schedule?.scheduleShifts, bidLine.scheduleShifts]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidLineId: bidLine.id,
          operationName: bidLine.operation?.name || 'Unknown',
          lineNumber: bidLine.lineNumber,
          locale: locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Format: Operation-Line-Number-Metrics.pdf
      const operationName = (bidLine.operation?.name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '-');
      a.download = `${operationName}-Line-${bidLine.lineNumber}-Metrics.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // You might want to show a toast notification here
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const metrics = bidLine.scheduleMetrics;
  if (!metrics) return null;

  // Calculate summary stats
  const totalDaysOff = (metrics.totalDaysInPeriod || 0) - (metrics.totalDaysWorked || 0);
  const workPercentage = metrics.totalDaysInPeriod > 0 
    ? Math.round((metrics.totalDaysWorked / metrics.totalDaysInPeriod) * 100)
    : 0;

  // Calculate weekend totals
  const totalWeekendsInPeriod = getTotalWeekendsInPeriod(bidLine.bidPeriod) || 0;
  const totalFridaysInPeriod = metrics.totalFridaysInPeriod || 0;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold">
                {bidLine.operation?.name || 'Unknown Operation'}
              </h2>
              <p className="text-blue-100 text-lg">
                {translations.bidLineNumber || 'Line'} {bidLine.lineNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download PDF Report"
              >
                {isGeneratingPDF ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-6 h-6" />
                )}
              </button>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Quick Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{metrics.totalDaysWorked}</div>
              <div className="text-sm text-blue-100">{translations.totalDaysWorked || translations.summaryStats || 'Days Worked'}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{totalDaysOff}</div>
              <div className="text-sm text-blue-100">{translations.daysOff || 'Days Off'}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{workPercentage}%</div>
              <div className="text-sm text-blue-100">{translations.workLoad || 'Charge de Travail'}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-8">
            
            {/* Weekend Metrics */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                {translations.weekendMetrics || 'Weekend Metrics'}
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                <MetricCard
                  title={translations.weekendsWorking || 'Week-ends Travaillés'}
                  value={`${metrics.weekendsOn} ${translations.of || 'of'} ${totalWeekendsInPeriod}`}
                  icon={Calendar}
                  color="purple"
                />
                <MetricCard
                  title={translations.saturdays || 'Sat Solo'}
                  value={metrics.saturdaysOn}
                  icon={Calendar}
                  color="indigo"
                />
                <MetricCard
                  title={translations.sundays || 'Sun Solo'}
                  value={metrics.sundaysOn}
                  icon={Calendar}
                  color="pink"
                />
                <MetricCard
                  title={translations.totalSaturdays || 'Total Saturdays'}
                  value={`${metrics.totalSaturdays} ${translations.of || 'of'} ${metrics.totalSaturdaysInPeriod}`}
                  icon={Calendar}
                  color="violet"
                />
                <MetricCard
                  title={translations.totalSundays || 'Total Sundays'}
                  value={`${metrics.totalSundays} ${translations.of || 'of'} ${metrics.totalSundaysInPeriod}`}
                  icon={Calendar}
                  color="fuchsia"
                />
                <MetricCard
                  title={translations.fridayWeekendBlocks || 'Blocs Ven-FdS'}
                  value={`${metrics.fridayWeekendBlocks} ${translations.of || 'of'} ${totalFridaysInPeriod}`}
                  icon={Calendar}
                  color="emerald"
                />
              </div>
            </section>

            {/* Weekday Breakdown */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                {translations.weekdayBreakdown || 'Weekday Breakdown'}
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                <MetricCard
                  title={translations.totalMondays || 'Mondays'}
                  value={`${metrics.totalMondays} ${translations.of || 'of'} ${metrics.totalMondaysInPeriod}`}
                  icon={Calendar}
                  color="blue"
                />
                <MetricCard
                  title={translations.totalTuesdays || 'Tuesdays'}
                  value={`${metrics.totalTuesdays} ${translations.of || 'of'} ${metrics.totalTuesdaysInPeriod}`}
                  icon={Calendar}
                  color="green"
                />
                <MetricCard
                  title={translations.totalWednesdays || 'Wednesdays'}
                  value={`${metrics.totalWednesdays} ${translations.of || 'of'} ${metrics.totalWednesdaysInPeriod}`}
                  icon={Calendar}
                  color="yellow"
                />
                <MetricCard
                  title={translations.totalThursdays || 'Thursdays'}
                  value={`${metrics.totalThursdays} ${translations.of || 'of'} ${metrics.totalThursdaysInPeriod}`}
                  icon={Calendar}
                  color="red"
                />
                <MetricCard
                  title={translations.totalFridays || 'Fridays'}
                  value={`${metrics.totalFridays} ${translations.of || 'of'} ${metrics.totalFridaysInPeriod}`}
                  icon={Calendar}
                  color="purple"
                />
                <MetricCard
                  title={translations.weekdayBlocks || 'Blocs Lun-Ven'}
                  value={metrics.weekdayBlocks}
                  icon={Calendar}
                  color="teal"
                />
              </div>
            </section>

            {/* Work Blocks */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                {translations.workBlocks || 'Work Block Patterns'}
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {/* Show work blocks in ascending order, only if > 0 */}
                {metrics.singleDays > 0 && (
                  <MetricCard
                    title={'Single Days'}
                    value={metrics.singleDays}
                    icon={BarChart3}
                    color="amber"
                  />
                )}
                {metrics.blocks2day > 0 && (
                  <MetricCard
                    title={translations.blocks2day || translations.twoDayBlocks || 'Blocs 2-Jours'}
                    value={metrics.blocks2day}
                    icon={BarChart3}
                    color="red"
                  />
                )}
                {metrics.blocks3day > 0 && (
                  <MetricCard
                    title={translations.blocks3day || translations.threeDayBlocks || 'Blocs 3-Jours'}
                    value={metrics.blocks3day}
                    icon={BarChart3}
                    color="yellow"
                  />
                )}
                {metrics.blocks4day > 0 && (
                  <MetricCard
                    title={translations.blocks4day || translations.fourDayBlocks || 'Blocs 4-Jours'}
                    value={metrics.blocks4day}
                    icon={BarChart3}
                    color="blue"
                  />
                )}
                {metrics.blocks5day > 0 && (
                  <MetricCard
                    title={translations.blocks5day || translations.fiveDayBlocks || 'Blocs 5-Jours'}
                    value={metrics.blocks5day}
                    icon={BarChart3}
                    color="emerald"
                  />
                )}
                {metrics.blocks6day > 0 && (
                  <MetricCard
                    title={translations.blocks6day || translations.sixDayBlocks || 'Blocs 6-Jours'}
                    value={metrics.blocks6day}
                    icon={BarChart3}
                    color="purple"
                  />
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <MetricCard
                  title={translations.longestStretch || 'Max Jours'}
                  value={`${metrics.longestStretch} jours`}
                  icon={TrendingUp}
                  color="stone"
                />
              </div>
            </section>

            {/* Special Patterns */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-fuchsia-600" />
                {translations.specialPatterns || 'Special Patterns'}
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {/* Detailed Shift Breakdown */}
                {shiftBreakdown && Object.keys(shiftBreakdown).length > 0 ? (
                  <div className="col-span-2 md:col-span-3">
                    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-yellow-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-600/40 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                          <span className="text-sm font-semibold text-gray-800 dark:text-amber-200 uppercase tracking-wider">
                            {translations.shiftPattern || 'Codes de Quart'}
                          </span>
                        </div>
                        <span className="text-sm text-amber-700 dark:text-amber-400">
                          {Object.keys(shiftBreakdown).length} {Object.keys(shiftBreakdown).length === 1 ? 'code' : 'codes'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(shiftBreakdown)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([code, details]) => (
                            <div 
                              key={code} 
                              className="bg-white/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-lg p-3 border border-amber-100 dark:border-amber-700/40 hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-md hover:bg-white dark:hover:bg-amber-900/30 transition-all duration-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-base text-amber-700 dark:text-amber-200">
                                  {code}
                                </span>
                                <span className="text-sm font-semibold text-orange-700 dark:text-orange-200 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-800/50 dark:to-orange-800/50 px-2 py-1 rounded-lg">
                                  {details.count}x
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 dark:text-amber-100 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600 dark:text-amber-200">Temps:</span>
                                  <span className="font-medium">{details.beginTime} - {details.endTime}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600 dark:text-amber-200">{'Durée'}:</span>
                                  <span className="font-medium text-amber-600 dark:text-orange-300">
                                    {details.hoursLength}h
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <MetricCard
                    title={translations.shiftPattern || 'Shift Pattern'}
                    value={metrics.shiftPattern || 'No data'}
                    icon={Users}
                    color="stone"
                  />
                )}
              </div>
            </section>

            {/* Off-Day Blocks */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-cyan-600" />
                Off-Day Block Patterns
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {/* Show off-day blocks in ascending order, only if > 0 */}
                {metrics.offBlocks2day > 0 && (
                  <MetricCard
                    title={translations.offBlocks2day || '2-Day Off'}
                    value={metrics.offBlocks2day}
                    icon={Calendar}
                    color="blue"
                  />
                )}
                {metrics.offBlocks3day > 0 && (
                  <MetricCard
                    title={translations.offBlocks3day || '3-Day Off'}
                    value={metrics.offBlocks3day}
                    icon={Calendar}
                    color="green"
                  />
                )}
                {metrics.offBlocks4day > 0 && (
                  <MetricCard
                    title={translations.offBlocks4day || '4-Day Off'}
                    value={metrics.offBlocks4day}
                    icon={Calendar}
                    color="yellow"
                  />
                )}
                {metrics.offBlocks5day > 0 && (
                  <MetricCard
                    title={translations.offBlocks5day || '5-Day Off'}
                    value={metrics.offBlocks5day}
                    icon={Calendar}
                    color="purple"
                  />
                )}
                {metrics.offBlocks6day > 0 && (
                  <MetricCard
                    title={translations.offBlocks6day || '6-Day Off'}
                    value={metrics.offBlocks6day}
                    icon={Calendar}
                    color="pink"
                  />
                )}
                {metrics.offBlocks7dayPlus > 0 && (
                  <MetricCard
                    title={translations.offBlocks7dayPlus || '7+ Days Off'}
                    value={metrics.offBlocks7dayPlus}
                    icon={Calendar}
                    color="indigo"
                  />
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {/* Always show longest/shortest off stretches like holidays */}
                <MetricCard
                  title={translations.longestOff || 'Congé Max'}
                  value={`${metrics.longestOffStretch} jours`}
                  icon={TrendingUp}
                  color="emerald"
                />
                <MetricCard
                  title={translations.shortestOff || 'Congé Min'}
                  value={`${metrics.shortestOffStretch} jours`}
                  icon={Clock}
                  color="amber"
                />
              </div>
            </section>

            {/* Holiday Info */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-red-600" />
                {translations.holidayInfo || 'Holiday Information'}
              </h3>

              {/* Detailed Holiday Breakdown */}
              {(detailedHolidays.working.length > 0 || detailedHolidays.off.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Working Holidays */}
                  {detailedHolidays.working.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {translations.holidaysWorking || 'Working Holidays'} ({detailedHolidays.working.length})
                      </h4>
                      <div className="space-y-2">
                        {detailedHolidays.working.map((holiday, index) => (
                          <div key={index} className="bg-white/80 dark:bg-red-800/30 rounded p-2 border border-red-100 dark:border-red-700">
                            <div className="flex justify-between items-start text-sm">
                              <div className="font-medium text-red-900 dark:text-red-100">
                                {holiday.name}
                              </div>
                              <div className="text-xs text-red-700 dark:text-red-300">
                                {formatDate(holiday.date, 'MMM d', locale)}
                              </div>
                            </div>
                            <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                              {holiday.shiftCode !== 'Unknown' ? (
                                <span>
                                  <span className="font-medium">{holiday.shiftCode}</span> | {holiday.beginTime}-{holiday.endTime}
                                </span>
                              ) : (
                                <span className="italic">Shift details not available</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Off Holidays */}
                  {detailedHolidays.off.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {translations.holidaysOff || 'Holidays Off'} ({detailedHolidays.off.length})
                      </h4>
                      <div className="space-y-2">
                        {detailedHolidays.off.map((holiday, index) => (
                          <div key={index} className="bg-white/80 dark:bg-green-800/30 rounded p-2 border border-green-100 dark:border-green-700">
                            <div className="flex justify-between items-center text-sm">
                              <div className="font-medium text-green-900 dark:text-green-100">
                                {holiday.name}
                              </div>
                              <div className="text-xs text-green-700 dark:text-green-300">
                                {formatDate(holiday.date, 'MMM d', locale)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Schedule Calendar */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                Schedule Calendar
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <ScheduleCalendar
                  schedule={
                    bidLine.schedule?.scheduleShifts
                      ? { scheduleShifts: bidLine.schedule.scheduleShifts }
                      : bidLine.scheduleShifts
                        ? { scheduleShifts: bidLine.scheduleShifts }
                        : undefined
                  }
                  bidPeriod={bidLine.bidPeriod ? {
                    startDate: new Date(bidLine.bidPeriod.startDate),
                    endDate: new Date(bidLine.bidPeriod.endDate),
                    numCycles: bidLine.bidPeriod.numCycles
                  } : undefined}
                  compact={true}
                  className="bg-white dark:bg-gray-800"
                />
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {translations.close || 'Close'}
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}