import React from 'react';
import { Clock } from 'lucide-react';
import { getMetricLabel } from '@/utils/bidLineMetrics';

interface MetricSettings {
  showWeekends: boolean;
  showSaturdays: boolean;
  showSundays: boolean;
  show5DayBlocks: boolean;
  show4DayBlocks: boolean;
  show3DayBlocks: boolean;
  show2DayBlocks: boolean;
  show6DayBlocks: boolean;
  showSingleDays: boolean;
  showHolidays: boolean;
  showTotalSaturdays: boolean;
  showTotalSundays: boolean;
  showTotalDays: boolean;
  showTotalMondays: boolean;
  showTotalTuesdays: boolean;
  showTotalWednesdays: boolean;
  showTotalThursdays: boolean;
  showTotalFridays: boolean;
  showLongestStretch: boolean;
  showFridayWeekendBlocks: boolean;
  showWeekdayBlocks: boolean;
  showOffBlocks2day: boolean;
  showOffBlocks3day: boolean;
  showOffBlocks4day: boolean;
  showOffBlocks5day: boolean;
  showOffBlocks6day: boolean;
  showOffBlocks7dayPlus: boolean;
  showLongestOffStretch: boolean;
  showShortestOffStretch: boolean;
}

interface ScheduleMetrics {
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
  totalDaysWorked: number;
  totalDaysInPeriod: number;
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
}

interface ShiftBreakdown {
  [key: string]: {
    count: number;
    beginTime: string;
    endTime: string;
    hoursLength: number;
  };
}

interface HolidayData {
  holidaysWorking: number;
  totalHolidays: number;
}

interface ScheduleMetricsProps {
  scheduleMetrics?: ScheduleMetrics;
  metricSettings: MetricSettings;
  holidayData: HolidayData;
  shiftBreakdown?: ShiftBreakdown | null;
  onMetricClick: (e: React.MouseEvent, type: string, value: number | string) => void;
  t: (key: string, params?: any) => string;
}

export default function ScheduleMetrics({
  scheduleMetrics,
  metricSettings,
  holidayData,
  shiftBreakdown,
  onMetricClick,
  t,
}: ScheduleMetricsProps) {
  if (!scheduleMetrics) return null;

  const visibleMetrics = [];
  
  if (metricSettings.showWeekends) {
    visibleMetrics.push(
      <div 
        key="weekends"
        onClick={(e) => onMetricClick(e, 'weekends', scheduleMetrics.weekendsOn || 0)}
        className="bg-blue-600 p-1.5 rounded text-center cursor-pointer hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Wknds', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.weekendsOn || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showSaturdays) {
    visibleMetrics.push(
      <div 
        key="saturdays"
        onClick={(e) => onMetricClick(e, 'saturdays', scheduleMetrics.saturdaysOn || 0)}
        className="bg-purple-600 p-1.5 rounded text-center cursor-pointer hover:bg-purple-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Sat', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.saturdaysOn || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showSundays) {
    visibleMetrics.push(
      <div 
        key="sundays"
        onClick={(e) => onMetricClick(e, 'sundays', scheduleMetrics.sundaysOn || 0)}
        className="bg-indigo-600 p-1.5 rounded text-center cursor-pointer hover:bg-indigo-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Sun', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.sundaysOn || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.show5DayBlocks) {
    visibleMetrics.push(
      <div 
        key="fiveDayBlocks"
        onClick={(e) => onMetricClick(e, 'fiveDayBlocks', scheduleMetrics.blocks5day || 0)}
        className="bg-teal-600 p-1.5 rounded text-center cursor-pointer hover:bg-teal-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('5-Day', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.blocks5day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.show4DayBlocks) {
    visibleMetrics.push(
      <div 
        key="fourDayBlocks"
        onClick={(e) => onMetricClick(e, 'fourDayBlocks', scheduleMetrics.blocks4day || 0)}
        className="bg-orange-600 p-1.5 rounded text-center cursor-pointer hover:bg-orange-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('4-Day', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.blocks4day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.show6DayBlocks) {
    visibleMetrics.push(
      <div 
        key="sixDayBlocks"
        onClick={(e) => onMetricClick(e, 'sixDayBlocks', scheduleMetrics.blocks6day || 0)}
        className="bg-rose-600 p-1.5 rounded text-center cursor-pointer hover:bg-rose-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('6-Day', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.blocks6day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.show3DayBlocks) {
    visibleMetrics.push(
      <div 
        key="threeDayBlocks"
        onClick={(e) => onMetricClick(e, 'threeDayBlocks', scheduleMetrics.blocks3day || 0)}
        className="bg-emerald-600 p-1.5 rounded text-center cursor-pointer hover:bg-emerald-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('3-Day', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.blocks3day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.show2DayBlocks) {
    visibleMetrics.push(
      <div 
        key="twoDayBlocks"
        onClick={(e) => onMetricClick(e, 'twoDayBlocks', scheduleMetrics.blocks2day || 0)}
        className="bg-cyan-600 p-1.5 rounded text-center cursor-pointer hover:bg-cyan-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('2-Day', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.blocks2day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showSingleDays) {
    visibleMetrics.push(
      <div 
        key="singleDays"
        onClick={(e) => onMetricClick(e, 'singleDays', scheduleMetrics.singleDays || 0)}
        className="bg-slate-600 p-1.5 rounded text-center cursor-pointer hover:bg-slate-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Single', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.singleDays || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showTotalSaturdays) {
    visibleMetrics.push(
      <div 
        key="totalSaturdays"
        onClick={(e) => onMetricClick(e, 'totalSaturdays', `${scheduleMetrics.totalSaturdays || 0} ${t('scheduleMetrics.of', 'of')} ${scheduleMetrics.totalSaturdaysInPeriod || 0}`)}
        className="bg-violet-600 p-1.5 rounded text-center cursor-pointer hover:bg-violet-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Tot Sat', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.totalSaturdays || 0} / {scheduleMetrics.totalSaturdaysInPeriod || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showTotalSundays) {
    visibleMetrics.push(
      <div 
        key="totalSundays"
        onClick={(e) => onMetricClick(e, 'totalSundays', `${scheduleMetrics.totalSundays || 0} ${t('scheduleMetrics.of', 'of')} ${scheduleMetrics.totalSundaysInPeriod || 0}`)}
        className="bg-fuchsia-600 p-1.5 rounded text-center cursor-pointer hover:bg-fuchsia-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Tot Sun', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.totalSundays || 0} / {scheduleMetrics.totalSundaysInPeriod || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showTotalDays) {
    visibleMetrics.push(
      <div 
        key="totalDays"
        onClick={(e) => onMetricClick(e, 'totalDays', `${scheduleMetrics.totalDaysWorked || 0} ${t('scheduleMetrics.of', 'of')} ${scheduleMetrics.totalDaysInPeriod || 0}`)}
        className="bg-stone-600 p-1.5 rounded text-center cursor-pointer hover:bg-stone-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Tot Days', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.totalDaysWorked || 0} / {scheduleMetrics.totalDaysInPeriod || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showTotalMondays) {
    visibleMetrics.push(
      <div 
        key="totalMondays"
        onClick={(e) => onMetricClick(e, 'totalMondays', `${scheduleMetrics.totalMondays || 0} ${t('scheduleMetrics.of', 'of')} ${scheduleMetrics.totalMondaysInPeriod || 0}`)}
        className="bg-blue-500 p-1.5 rounded text-center cursor-pointer hover:bg-blue-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Tot Mon', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.totalMondays || 0} / {scheduleMetrics.totalMondaysInPeriod || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showTotalTuesdays) {
    visibleMetrics.push(
      <div 
        key="totalTuesdays"
        onClick={(e) => onMetricClick(e, 'totalTuesdays', `${scheduleMetrics.totalTuesdays || 0} ${t('scheduleMetrics.of', 'of')} ${scheduleMetrics.totalTuesdaysInPeriod || 0}`)}
        className="bg-green-500 p-1.5 rounded text-center cursor-pointer hover:bg-green-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Tot Tue', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.totalTuesdays || 0} / {scheduleMetrics.totalTuesdaysInPeriod || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showTotalWednesdays) {
    visibleMetrics.push(
      <div 
        key="totalWednesdays"
        onClick={(e) => onMetricClick(e, 'totalWednesdays', `${scheduleMetrics.totalWednesdays || 0} ${t('scheduleMetrics.of', 'of')} ${scheduleMetrics.totalWednesdaysInPeriod || 0}`)}
        className="bg-yellow-500 p-1.5 rounded text-center cursor-pointer hover:bg-yellow-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Tot Wed', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.totalWednesdays || 0} / {scheduleMetrics.totalWednesdaysInPeriod || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showTotalThursdays) {
    visibleMetrics.push(
      <div 
        key="totalThursdays"
        onClick={(e) => onMetricClick(e, 'totalThursdays', `${scheduleMetrics.totalThursdays || 0} ${t('scheduleMetrics.of', 'of')} ${scheduleMetrics.totalThursdaysInPeriod || 0}`)}
        className="bg-red-500 p-1.5 rounded text-center cursor-pointer hover:bg-red-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Tot Thu', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.totalThursdays || 0} / {scheduleMetrics.totalThursdaysInPeriod || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showTotalFridays) {
    visibleMetrics.push(
      <div 
        key="totalFridays"
        onClick={(e) => onMetricClick(e, 'totalFridays', `${scheduleMetrics.totalFridays || 0} ${t('scheduleMetrics.of', 'of')} ${scheduleMetrics.totalFridaysInPeriod || 0}`)}
        className="bg-purple-500 p-1.5 rounded text-center cursor-pointer hover:bg-purple-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Tot Fri', t)}</p>
        <p className="text-white font-bold text-sm">
          {scheduleMetrics.totalFridays || 0} / {scheduleMetrics.totalFridaysInPeriod || 0}
        </p>
      </div>
    );
  }
  
  if (metricSettings.showLongestStretch) {
    visibleMetrics.push(
      <div 
        key="longestStretch"
        onClick={(e) => onMetricClick(e, 'longestStretch', scheduleMetrics.longestStretch || 0)}
        className="bg-amber-600 p-1.5 rounded text-center cursor-pointer hover:bg-amber-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Longest', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.longestStretch || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showFridayWeekendBlocks) {
    visibleMetrics.push(
      <div 
        key="fridayWeekendBlocks"
        onClick={(e) => onMetricClick(e, 'fridayWeekendBlocks', scheduleMetrics.fridayWeekendBlocks || 0)}
        className="bg-pink-600 p-1.5 rounded text-center cursor-pointer hover:bg-pink-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Fri-Wknd', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.fridayWeekendBlocks || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showWeekdayBlocks) {
    visibleMetrics.push(
      <div 
        key="weekdayBlocks"
        onClick={(e) => onMetricClick(e, 'weekdayBlocks', scheduleMetrics.weekdayBlocks || 0)}
        className="bg-lime-600 p-1.5 rounded text-center cursor-pointer hover:bg-lime-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Weekday', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.weekdayBlocks || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showOffBlocks2day) {
    visibleMetrics.push(
      <div 
        key="offBlocks2day"
        onClick={(e) => onMetricClick(e, 'offBlocks2day', scheduleMetrics.offBlocks2day || 0)}
        className="bg-gray-500 p-1.5 rounded text-center cursor-pointer hover:bg-gray-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Off 2d', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.offBlocks2day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showOffBlocks3day) {
    visibleMetrics.push(
      <div 
        key="offBlocks3day"
        onClick={(e) => onMetricClick(e, 'offBlocks3day', scheduleMetrics.offBlocks3day || 0)}
        className="bg-neutral-500 p-1.5 rounded text-center cursor-pointer hover:bg-neutral-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Off 3d', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.offBlocks3day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showOffBlocks4day) {
    visibleMetrics.push(
      <div 
        key="offBlocks4day"
        onClick={(e) => onMetricClick(e, 'offBlocks4day', scheduleMetrics.offBlocks4day || 0)}
        className="bg-zinc-500 p-1.5 rounded text-center cursor-pointer hover:bg-zinc-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Off 4d', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.offBlocks4day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showOffBlocks5day) {
    visibleMetrics.push(
      <div 
        key="offBlocks5day"
        onClick={(e) => onMetricClick(e, 'offBlocks5day', scheduleMetrics.offBlocks5day || 0)}
        className="bg-slate-500 p-1.5 rounded text-center cursor-pointer hover:bg-slate-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Off 5d', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.offBlocks5day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showOffBlocks6day) {
    visibleMetrics.push(
      <div 
        key="offBlocks6day"
        onClick={(e) => onMetricClick(e, 'offBlocks6day', scheduleMetrics.offBlocks6day || 0)}
        className="bg-stone-500 p-1.5 rounded text-center cursor-pointer hover:bg-stone-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Off 6d', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.offBlocks6day || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showOffBlocks7dayPlus) {
    visibleMetrics.push(
      <div 
        key="offBlocks7dayPlus"
        onClick={(e) => onMetricClick(e, 'offBlocks7dayPlus', scheduleMetrics.offBlocks7dayPlus || 0)}
        className="bg-gray-600 p-1.5 rounded text-center cursor-pointer hover:bg-gray-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Off 7d+', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.offBlocks7dayPlus || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showLongestOffStretch) {
    visibleMetrics.push(
      <div 
        key="longestOffStretch"
        onClick={(e) => onMetricClick(e, 'longestOffStretch', scheduleMetrics.longestOffStretch || 0)}
        className="bg-emerald-500 p-1.5 rounded text-center cursor-pointer hover:bg-emerald-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Off Max', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.longestOffStretch || 0}</p>
      </div>
    );
  }
  
  if (metricSettings.showShortestOffStretch) {
    visibleMetrics.push(
      <div 
        key="shortestOffStretch"
        onClick={(e) => onMetricClick(e, 'shortestOffStretch', scheduleMetrics.shortestOffStretch || 0)}
        className="bg-teal-500 p-1.5 rounded text-center cursor-pointer hover:bg-teal-600 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Off Min', t)}</p>
        <p className="text-white font-bold text-sm">{scheduleMetrics.shortestOffStretch || 0}</p>
      </div>
    );
  }

  if (metricSettings.showHolidays) {
    visibleMetrics.push(
      <div 
        key="holidays"
        onClick={(e) => onMetricClick(e, 'holidays', `${holidayData.holidaysWorking} ${t('scheduleMetrics.of', 'of')} ${holidayData.totalHolidays}`)}
        className="bg-red-600 p-1.5 rounded text-center cursor-pointer hover:bg-red-700 transition-all duration-200 hover:scale-105 hover:shadow-md transform"
      >
        <p className="text-white text-xs font-medium">{getMetricLabel('Holidays', t)}</p>
        <p className="text-white font-bold text-sm">
          {holidayData.holidaysWorking} / {holidayData.totalHolidays}
        </p>
      </div>
    );
  }
  
  // Dynamic grid columns based on number of visible metrics
  const gridCols = Math.min(visibleMetrics.length, 8);
  const gridColsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8'
  };
  const gridColsClass = gridColsMap[gridCols as keyof typeof gridColsMap] || 'grid-cols-8';

  return (
    <>
      {/* Schedule Metrics - Dynamic based on settings */}
      <div className="mb-3">
        <div className={`grid ${gridColsClass} gap-1 text-xs`}>
          {visibleMetrics}
        </div>
      </div>
      
      {/* Tap for details text - show only if metrics exist */}
      <div className="flex items-center gap-2 text-sm mt-1 mb-2 text-gray-700 dark:text-gray-300 font-medium">
        <span>👆</span>
        <span>{t('common.tapForDetails')}</span>
      </div>
      
      {/* Shift Codes Summary - Compact Design */}
      {shiftBreakdown && Object.keys(shiftBreakdown).length > 0 && (
        <div className="mt-3 mb-3 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-yellow-950/30 rounded-lg p-2.5 border border-amber-200 dark:border-amber-600/40 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-amber-600 dark:text-amber-300" />
              <span className="text-xs font-semibold text-gray-800 dark:text-amber-200 uppercase tracking-wider">
                {t('calendar.shiftCodesSummary')}
              </span>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400">
              {Object.keys(shiftBreakdown).length} codes
            </span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {Object.entries(shiftBreakdown)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, details]) => (
                <div 
                  key={code} 
                  className="bg-white/80 dark:bg-amber-900/20 backdrop-blur-sm rounded p-1 border border-amber-100 dark:border-amber-700/40 hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-sm hover:bg-white dark:hover:bg-amber-900/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-700 dark:text-amber-200 truncate">
                      {code}
                    </span>
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-200 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-800/50 dark:to-orange-800/50 px-0.5 py-0.5 rounded text-xs ml-1">
                      {details.count}x
                    </span>
                  </div>
                  <div className="text-xs text-gray-700 dark:text-amber-100 mt-0.5">
                    <div className="text-xs truncate">{details.beginTime}-{details.endTime}</div>
                    <div className="text-amber-600 dark:text-orange-300 text-xs">
                      {details.hoursLength}h
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}