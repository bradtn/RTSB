interface BidPeriod {
  id: string;
  name: string;
  numCycles: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleShift {
  dayNumber: number;
  shiftCode?: {
    code: string;
    beginTime: string;
    endTime: string;
    category: string;
    hoursLength: number;
  };
}

interface ShiftBreakdown {
  [key: string]: {
    count: number;
    beginTime: string;
    endTime: string;
    hoursLength: number;
  };
}

/**
 * Calculate total weekends in a bid period
 */
export const getTotalWeekendsInPeriod = (bidPeriod?: Pick<BidPeriod, 'numCycles' | 'startDate' | 'endDate'>): number | null => {
  if (!bidPeriod) return null;
  
  const { numCycles, startDate, endDate } = bidPeriod;
  
  if (!numCycles || !startDate || !endDate || isNaN(numCycles)) {
    return null;
  }
  
  // Count actual weekends between start and end dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  let weekendCount = 0;
  
  // Iterate through all days and count Saturday-Sunday pairs
  const current = new Date(start);
  while (current <= end) {
    // If it's a Saturday, count it as a weekend (Saturday-Sunday pair)
    if (current.getDay() === 6) { // Saturday = 6
      weekendCount++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return weekendCount;
};

/**
 * Calculate shift code breakdown from schedule shifts
 */
export const getShiftBreakdown = (
  scheduleShifts?: ScheduleShift[], 
  bidPeriod?: BidPeriod
): ShiftBreakdown | null => {
  if (!scheduleShifts) return null;
  
  const numCycles = bidPeriod?.numCycles || 1;
  
  const shiftDetails: ShiftBreakdown = {};
  
  // Calculate for one cycle
  scheduleShifts.forEach(shift => {
    if (shift.shiftCode) {
      const { code, beginTime, endTime, hoursLength } = shift.shiftCode;
      if (!shiftDetails[code]) {
        shiftDetails[code] = { 
          count: 0, 
          beginTime, 
          endTime,
          hoursLength: hoursLength || 0
        };
      }
      shiftDetails[code].count++;
    }
  });
  
  // Multiply by number of cycles for the full period
  Object.keys(shiftDetails).forEach(code => {
    shiftDetails[code].count *= numCycles;
  });
  
  return shiftDetails;
};

/**
 * Get metric label with internationalization support
 */
export const getMetricLabel = (metric: string, t?: (key: string) => string): string => {
  if (t) {
    // Use translations if available
    const translationMap: { [key: string]: string } = {
      'Wknds': t('scheduleMetrics.weekendsWorking'),
      'Sat': t('scheduleMetrics.saturdays'),
      'Sun': t('scheduleMetrics.sundays'),
      '6-Day': t('scheduleMetrics.sixDayBlocks'),
      '5-Day': t('scheduleMetrics.fiveDayBlocks'),
      '4-Day': t('scheduleMetrics.fourDayBlocks'),
      '3-Day': t('scheduleMetrics.threeDayBlocks'),
      '2-Day': t('scheduleMetrics.twoDayBlocks'),
      'Single': t('scheduleMetrics.singleDays'),
      'Holidays': t('scheduleMetrics.holidays'),
      'Tot Sat': t('scheduleMetrics.totalSaturdays'),
      'Tot Sun': t('scheduleMetrics.totalSundays'),
      'Tot Mon': t('scheduleMetrics.totalMondays'),
      'Tot Tue': t('scheduleMetrics.totalTuesdays'),
      'Tot Wed': t('scheduleMetrics.totalWednesdays'),
      'Tot Thu': t('scheduleMetrics.totalThursdays'),
      'Tot Fri': t('scheduleMetrics.totalFridays'),
      'Tot Days': t('scheduleMetrics.totalDays'),
      'Longest': t('scheduleMetrics.longestStretch'),
      'Fri-Wknd': t('scheduleMetrics.fridayWeekendBlocks'),
      'Weekday': t('scheduleMetrics.weekdayBlocks'),
      'Off 2d': t('scheduleMetrics.offBlocks2day'),
      'Off 3d': t('scheduleMetrics.offBlocks3day'),
      'Off 4d': t('scheduleMetrics.offBlocks4day'),
      'Off 5d': t('scheduleMetrics.offBlocks5day'),
      'Off 6d': t('scheduleMetrics.offBlocks6day'),
      'Off 7d+': t('scheduleMetrics.offBlocks7dayPlus'),
      'Off Max': t('scheduleMetrics.longestOffStretch'),
      'Off Min': t('scheduleMetrics.shortestOffStretch')
    };
    
    return translationMap[metric] || metric;
  }
  
  // Fallback to English labels
  const labels: { [key: string]: string } = {
    'Wknds': 'Wknds',
    'Sat': 'Sat',
    'Sun': 'Sun',
    '6-Day': '6-Day',
    '5-Day': '5-Day',
    '4-Day': '4-Day',
    '3-Day': '3-Day',
    '2-Day': '2-Day',
    'Single': 'Single',
    'Holidays': 'Holidays',
    'Tot Sat': 'Tot Sat',
    'Tot Sun': 'Tot Sun',
    'Tot Mon': 'Tot Mon',
    'Tot Tue': 'Tot Tue',
    'Tot Wed': 'Tot Wed',
    'Tot Thu': 'Tot Thu',
    'Tot Fri': 'Tot Fri',
    'Tot Days': 'Tot Days',
    'Longest': 'Longest',
    'Fri-Wknd': 'Fri-Wknd',
    'Weekday': 'Weekday',
    'Off 2d': 'Off 2d',
    'Off 3d': 'Off 3d',
    'Off 4d': 'Off 4d',
    'Off 5d': 'Off 5d',
    'Off 6d': 'Off 6d',
    'Off 7d+': 'Off 7d+',
    'Off Max': 'Off Max',
    'Off Min': 'Off Min'
  };
  
  return labels[metric] || metric;
};

/**
 * Format days of week for display
 */
export const formatDaysOfWeek = (days: string[], translations: any): string => {
  if (!days || days.length === 0) return '';
  
  const dayMap: { [key: string]: string } = {
    'mon': translations.daysMon,
    'tue': translations.daysTue, 
    'wed': translations.daysWed,
    'thu': translations.daysThu,
    'fri': translations.daysFri,
    'sat': translations.daysSat,
    'sun': translations.daysSun,
  };
  
  return days.map(day => dayMap[day.toLowerCase()] || day).join(', ');
};

/**
 * Get status-based styling for bid line cards
 */
export const getStatusColor = (status: 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT'): string => {
  switch (status) {
    case 'AVAILABLE':
      return 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/10 dark:to-emerald-900/10';
    case 'TAKEN':
      return 'border-red-300 dark:border-red-600 bg-gradient-to-br from-red-200 to-rose-200 dark:from-red-900/20 dark:to-rose-900/20';
    case 'BLACKED_OUT':
      return 'border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-300 to-slate-300 dark:from-gray-800 dark:to-slate-800';
    default:
      return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
  }
};