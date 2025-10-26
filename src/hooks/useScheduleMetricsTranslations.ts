import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

/**
 * Custom hook to get all schedule metrics translations
 * This eliminates the need to pass translations through multiple component layers
 */
export function useScheduleMetricsTranslations() {
  const params = useParams();
  const { t } = useTranslation(params.locale as string);

  return {
    // Basic metrics
    title: t('scheduleMetrics.title'),
    weekendsWorking: t('scheduleMetrics.weekendsWorking'),
    saturdays: t('scheduleMetrics.saturdays'),
    sundays: t('scheduleMetrics.sundays'),
    fiveDayBlocks: t('scheduleMetrics.fiveDayBlocks'),
    fourDayBlocks: t('scheduleMetrics.fourDayBlocks'),
    sixDayBlocks: t('scheduleMetrics.sixDayBlocks'),
    threeDayBlocks: t('scheduleMetrics.threeDayBlocks'),
    twoDayBlocks: t('scheduleMetrics.twoDayBlocks'),
    singleDays: t('scheduleMetrics.singleDays'),
    holidays: t('scheduleMetrics.holidays'),
    longestStretch: t('scheduleMetrics.longestStretch'),
    fridayWeekendBlocks: t('scheduleMetrics.fridayWeekendBlocks'),
    weekdayBlocks: t('scheduleMetrics.weekdayBlocks'),
    
    // Off-day blocks
    offBlocks2day: t('scheduleMetrics.offBlocks2day'),
    offBlocks3day: t('scheduleMetrics.offBlocks3day'),
    offBlocks4day: t('scheduleMetrics.offBlocks4day'),
    offBlocks5day: t('scheduleMetrics.offBlocks5day'),
    offBlocks6day: t('scheduleMetrics.offBlocks6day'),
    offBlocks7dayPlus: t('scheduleMetrics.offBlocks7dayPlus'),
    longestOffStretch: t('scheduleMetrics.longestOffStretch'),
    shortestOffStretch: t('scheduleMetrics.shortestOffStretch'),
    
    // Titles
    totalSaturdaysTitle: t('scheduleMetrics.totalSaturdaysTitle'),
    totalSundaysTitle: t('scheduleMetrics.totalSundaysTitle'),
    totalMondaysTitle: t('scheduleMetrics.totalMondaysTitle'),
    totalTuesdaysTitle: t('scheduleMetrics.totalTuesdaysTitle'),
    totalWednesdaysTitle: t('scheduleMetrics.totalWednesdaysTitle'),
    totalThursdaysTitle: t('scheduleMetrics.totalThursdaysTitle'),
    totalFridaysTitle: t('scheduleMetrics.totalFridaysTitle'),
    totalDays: t('scheduleMetrics.totalDays'),
    
    // Off-day block titles
    offBlocks2dayTitle: t('scheduleMetrics.offBlocks2dayTitle'),
    offBlocks3dayTitle: t('scheduleMetrics.offBlocks3dayTitle'),
    offBlocks4dayTitle: t('scheduleMetrics.offBlocks4dayTitle'),
    offBlocks5dayTitle: t('scheduleMetrics.offBlocks5dayTitle'),
    offBlocks6dayTitle: t('scheduleMetrics.offBlocks6dayTitle'),
    offBlocks7dayPlusTitle: t('scheduleMetrics.offBlocks7dayPlusTitle'),
    longestOffStretchTitle: t('scheduleMetrics.longestOffStretchTitle'),
    shortestOffStretchTitle: t('scheduleMetrics.shortestOffStretchTitle'),
    
    // Descriptions
    weekendsDescription: t('scheduleMetrics.weekendsDescription'),
    saturdaysDescription: t('scheduleMetrics.saturdaysDescription'),
    sundaysDescription: t('scheduleMetrics.sundaysDescription'),
    fiveDayBlocksDescription: t('scheduleMetrics.fiveDayBlocksDescription'),
    fourDayBlocksDescription: t('scheduleMetrics.fourDayBlocksDescription'),
    sixDayBlocksDescription: t('scheduleMetrics.sixDayBlocksDescription'),
    threeDayBlocksDescription: t('scheduleMetrics.threeDayBlocksDescription'),
    twoDayBlocksDescription: t('scheduleMetrics.twoDayBlocksDescription'),
    singleDaysDescription: t('scheduleMetrics.singleDaysDescription'),
    holidaysDescription: t('scheduleMetrics.holidaysDescription'),
    longestStretchDescription: t('scheduleMetrics.longestStretchDescription'),
    fridayWeekendBlocksDescription: t('scheduleMetrics.fridayWeekendBlocksDescription'),
    weekdayBlocksDescription: t('scheduleMetrics.weekdayBlocksDescription'),
    
    totalSaturdaysDescription: t('scheduleMetrics.totalSaturdaysDescription'),
    totalSundaysDescription: t('scheduleMetrics.totalSundaysDescription'),
    totalMondaysDescription: t('scheduleMetrics.totalMondaysDescription'),
    totalTuesdaysDescription: t('scheduleMetrics.totalTuesdaysDescription'),
    totalWednesdaysDescription: t('scheduleMetrics.totalWednesdaysDescription'),
    totalThursdaysDescription: t('scheduleMetrics.totalThursdaysDescription'),
    totalFridaysDescription: t('scheduleMetrics.totalFridaysDescription'),
    totalDaysDescription: t('scheduleMetrics.totalDaysDescription'),
    
    // Off-day block descriptions
    offBlocks2dayDescription: t('scheduleMetrics.offBlocks2dayDescription'),
    offBlocks3dayDescription: t('scheduleMetrics.offBlocks3dayDescription'),
    offBlocks4dayDescription: t('scheduleMetrics.offBlocks4dayDescription'),
    offBlocks5dayDescription: t('scheduleMetrics.offBlocks5dayDescription'),
    offBlocks6dayDescription: t('scheduleMetrics.offBlocks6dayDescription'),
    offBlocks7dayPlusDescription: t('scheduleMetrics.offBlocks7dayPlusDescription'),
    longestOffStretchDescription: t('scheduleMetrics.longestOffStretchDescription'),
    shortestOffStretchDescription: t('scheduleMetrics.shortestOffStretchDescription'),
    
    // Explanations
    weekendsExplanation: t('scheduleMetrics.weekendsExplanation'),
    saturdaysExplanation: t('scheduleMetrics.saturdaysExplanation'),
    sundaysExplanation: t('scheduleMetrics.sundaysExplanation'),
    fiveDayBlocksExplanation: t('scheduleMetrics.fiveDayBlocksExplanation'),
    fourDayBlocksExplanation: t('scheduleMetrics.fourDayBlocksExplanation'),
    sixDayBlocksExplanation: t('scheduleMetrics.sixDayBlocksExplanation'),
    threeDayBlocksExplanation: t('scheduleMetrics.threeDayBlocksExplanation'),
    twoDayBlocksExplanation: t('scheduleMetrics.twoDayBlocksExplanation'),
    singleDaysExplanation: t('scheduleMetrics.singleDaysExplanation'),
    holidaysExplanation: t('scheduleMetrics.holidaysExplanation'),
    longestStretchExplanation: t('scheduleMetrics.longestStretchExplanation'),
    fridayWeekendBlocksExplanation: t('scheduleMetrics.fridayWeekendBlocksExplanation'),
    weekdayBlocksExplanation: t('scheduleMetrics.weekdayBlocksExplanation'),
    
    totalSaturdaysExplanation: t('scheduleMetrics.totalSaturdaysExplanation'),
    totalSundaysExplanation: t('scheduleMetrics.totalSundaysExplanation'),
    totalMondaysExplanation: t('scheduleMetrics.totalMondaysExplanation'),
    totalTuesdaysExplanation: t('scheduleMetrics.totalTuesdaysExplanation'),
    totalWednesdaysExplanation: t('scheduleMetrics.totalWednesdaysExplanation'),
    totalThursdaysExplanation: t('scheduleMetrics.totalThursdaysExplanation'),
    totalFridaysExplanation: t('scheduleMetrics.totalFridaysExplanation'),
    totalDaysExplanation: t('scheduleMetrics.totalDaysExplanation'),
    
    // Off-day block explanations
    offBlocks2dayExplanation: t('scheduleMetrics.offBlocks2dayExplanation'),
    offBlocks3dayExplanation: t('scheduleMetrics.offBlocks3dayExplanation'),
    offBlocks4dayExplanation: t('scheduleMetrics.offBlocks4dayExplanation'),
    offBlocks5dayExplanation: t('scheduleMetrics.offBlocks5dayExplanation'),
    offBlocks6dayExplanation: t('scheduleMetrics.offBlocks6dayExplanation'),
    offBlocks7dayPlusExplanation: t('scheduleMetrics.offBlocks7dayPlusExplanation'),
    longestOffStretchExplanation: t('scheduleMetrics.longestOffStretchExplanation'),
    shortestOffStretchExplanation: t('scheduleMetrics.shortestOffStretchExplanation'),
    
    // Modal specific
    whatThisMeans: t('scheduleMetrics.whatThisMeans'),
    whyItMatters: t('scheduleMetrics.whyItMatters'),
    completeScheduleSummary: t('scheduleMetrics.completeScheduleSummary'),
    close: t('common.close'),
    of: t('scheduleMetrics.of'),
    bidLineNumber: t('scheduleMetrics.bidLineNumber'),
    
    // Holiday modal specific
    holidaysWorking: t('scheduleMetrics.holidaysWorking'),
    holidaysOff: t('scheduleMetrics.holidaysOff'),
    workingShift: t('scheduleMetrics.workingShift'),
    dayOff: t('scheduleMetrics.dayOff'),
    
    // Other metrics
    viewAllMetrics: t('scheduleMetrics.viewAllMetrics'),
    allMetricsTitle: t('scheduleMetrics.allMetricsTitle'),
    weekendMetrics: t('scheduleMetrics.weekendMetrics'),
    weekdayBreakdown: t('scheduleMetrics.weekdayBreakdown'),
    workBlocks: t('scheduleMetrics.workBlocks'),
    specialPatterns: t('scheduleMetrics.specialPatterns'),
    holidayInfo: t('scheduleMetrics.holidayInfo'),
    summaryStats: t('scheduleMetrics.summaryStats'),
  };
}