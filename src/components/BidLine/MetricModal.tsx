'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Users, Clock, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';

interface MetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'weekends' | 'saturdays' | 'sundays' | 'fiveDayBlocks' | 'fourDayBlocks' | 'sixDayBlocks' | 'threeDayBlocks' | 'twoDayBlocks' | 'singleDays' | 'holidays' | 'totalSaturdays' | 'totalSundays' | 'totalMondays' | 'totalTuesdays' | 'totalWednesdays' | 'totalThursdays' | 'totalFridays' | 'totalDays' | 'longestStretch' | 'fridayWeekendBlocks' | 'weekdayBlocks' | 'offBlocks2day' | 'offBlocks3day' | 'offBlocks4day' | 'offBlocks5day' | 'offBlocks6day' | 'offBlocks7dayPlus' | 'longestOffStretch' | 'shortestOffStretch';
  metricValue: number | string;
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
      id: string;
      name: string;
      numCycles: number;
      startDate: string;
      endDate: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
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
      bidPeriod?: {
        id: string;
        name: string;
        numCycles: number;
        startDate: string;
        endDate: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    };
  };
  translations: {
    weekendsWorking?: string;
    saturdays?: string;
    sundays?: string;
    fiveDayBlocks?: string;
    fourDayBlocks?: string;
    sixDayBlocks?: string;
    threeDayBlocks?: string;
    twoDayBlocks?: string;
    singleDays?: string;
    totalSaturdays?: string;
    totalSundays?: string;
    totalMondays?: string;
    totalTuesdays?: string;
    totalWednesdays?: string;
    totalThursdays?: string;
    totalFridays?: string;
    totalDays?: string;
    totalMondaysTitle?: string;
    totalTuesdaysTitle?: string;
    totalWednesdaysTitle?: string;
    totalThursdaysTitle?: string;
    totalFridaysTitle?: string;
    longestStretch?: string;
    fridayWeekendBlocks?: string;
    weekdayBlocks?: string;
    offBlocks2day?: string;
    offBlocks3day?: string;
    offBlocks4day?: string;
    offBlocks5day?: string;
    offBlocks6day?: string;
    offBlocks7dayPlus?: string;
    longestOffStretch?: string;
    shortestOffStretch?: string;
    offBlocks2dayTitle?: string;
    offBlocks3dayTitle?: string;
    offBlocks4dayTitle?: string;
    offBlocks5dayTitle?: string;
    offBlocks6dayTitle?: string;
    offBlocks7dayPlusTitle?: string;
    longestOffStretchTitle?: string;
    shortestOffStretchTitle?: string;
    holidays?: string;
    // Modal-specific translations
    whatThisMeans?: string;
    whyItMatters?: string;
    completeScheduleSummary?: string;
    close?: string;
    // Metric descriptions
    weekendsDescription?: string;
    saturdaysDescription?: string;
    sundaysDescription?: string;
    fiveDayBlocksDescription?: string;
    fourDayBlocksDescription?: string;
    sixDayBlocksDescription?: string;
    threeDayBlocksDescription?: string;
    twoDayBlocksDescription?: string;
    singleDaysDescription?: string;
    totalSaturdaysDescription?: string;
    totalSundaysDescription?: string;
    totalMondaysDescription?: string;
    totalTuesdaysDescription?: string;
    totalWednesdaysDescription?: string;
    totalThursdaysDescription?: string;
    totalFridaysDescription?: string;
    totalDaysDescription?: string;
    longestStretchDescription?: string;
    fridayWeekendBlocksDescription?: string;
    weekdayBlocksDescription?: string;
    offBlocks2dayDescription?: string;
    offBlocks3dayDescription?: string;
    offBlocks4dayDescription?: string;
    offBlocks5dayDescription?: string;
    offBlocks6dayDescription?: string;
    offBlocks7dayPlusDescription?: string;
    longestOffStretchDescription?: string;
    shortestOffStretchDescription?: string;
    holidaysDescription?: string;
    // Metric explanations
    weekendsExplanation?: string;
    saturdaysExplanation?: string;
    sundaysExplanation?: string;
    fiveDayBlocksExplanation?: string;
    fourDayBlocksExplanation?: string;
    sixDayBlocksExplanation?: string;
    threeDayBlocksExplanation?: string;
    twoDayBlocksExplanation?: string;
    singleDaysExplanation?: string;
    totalSaturdaysExplanation?: string;
    totalSundaysExplanation?: string;
    totalMondaysExplanation?: string;
    totalTuesdaysExplanation?: string;
    totalWednesdaysExplanation?: string;
    totalThursdaysExplanation?: string;
    totalFridaysExplanation?: string;
    totalDaysExplanation?: string;
    longestStretchExplanation?: string;
    fridayWeekendBlocksExplanation?: string;
    weekdayBlocksExplanation?: string;
    offBlocks2dayExplanation?: string;
    offBlocks3dayExplanation?: string;
    offBlocks4dayExplanation?: string;
    offBlocks5dayExplanation?: string;
    offBlocks6dayExplanation?: string;
    offBlocks7dayPlusExplanation?: string;
    longestOffStretchExplanation?: string;
    shortestOffStretchExplanation?: string;
    holidaysExplanation?: string;
    // Holiday modal specific translations
    holidaysWorking?: string;
    holidaysOff?: string;
    workingShift?: string;
    dayOff?: string;
  };
}

export default function MetricModal({ 
  isOpen, 
  onClose, 
  metricType, 
  metricValue, 
  bidLine, 
  translations 
}: MetricModalProps) {
  const [mounted, setMounted] = useState(false);

  // Get bid period info from either bidPeriod or schedule.bidPeriod
  const bidPeriod = bidLine.bidPeriod || bidLine.schedule?.bidPeriod;
  
  // Calculate the period description
  const getPeriodDescription = () => {
    if (!bidPeriod) return 'the schedule period';
    
    const { numCycles, startDate, endDate } = bidPeriod;
    
    if (!numCycles || !startDate || !endDate || isNaN(numCycles)) {
      return 'the schedule period';
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeeks = Math.round(totalDays / 7);
    
    if (totalDays === 56 && numCycles === 1) {
      return 'the 8-week cycle';
    } else if (numCycles === 1) {
      return `the ${totalWeeks}-week cycle`;
    } else {
      return `the ${numCycles}-cycle period (${totalDays} days total)`;
    }
  };

  const periodDescription = getPeriodDescription();

  // State for holiday breakdown from API
  const [holidayBreakdown, setHolidayBreakdown] = useState<{
    working: Array<{ name: string; date: Date; shiftCode: string; beginTime: string; endTime: string }>;
    off: Array<{ name: string; date: Date }>;
  }>({ working: [], off: [] });

  // Fetch detailed holiday breakdown
  useEffect(() => {
    const fetchDetailedHolidayBreakdown = async () => {
      if (metricType !== 'holidays') {
        setHolidayBreakdown({ working: [], off: [] });
        return;
      }
      
      if (!bidPeriod?.startDate || !bidPeriod?.endDate) {
        setHolidayBreakdown({ working: [], off: [] });
        return;
      }

      try {
        const start = new Date(bidPeriod.startDate);
        const end = new Date(bidPeriod.endDate);
        const holidays = await getHolidaysForPeriod(start, end, HolidayFilters.NO_OBSCURE);
        
        const working: Array<{
          name: string;
          date: Date;
          shiftCode: string;
          beginTime: string;
          endTime: string;
        }> = [];
        const off: Array<{
          name: string;
          date: Date;
        }> = [];
        
        if (bidLine.schedule?.scheduleShifts && bidLine.schedule.scheduleShifts.length > 0) {
          // Use actual schedule data
          holidays.forEach(holiday => {
            const daysSinceStart = Math.floor((holiday.date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const dayNumber = daysSinceStart + 1;
            // Map to the 56-day cycle pattern (cycle repeats every 56 days)
            const cycleDay = ((dayNumber - 1) % 56) + 1;
            
            const shift = bidLine.schedule?.scheduleShifts?.find(s => s.dayNumber === cycleDay);
            if (shift?.shiftCode) {
              working.push({
                name: holiday.name,
                date: holiday.date,
                shiftCode: shift.shiftCode.code,
                beginTime: shift.shiftCode.beginTime,
                endTime: shift.shiftCode.endTime
              });
            } else {
              off.push({
                name: holiday.name,
                date: holiday.date
              });
            }
          });
        } else {
          // Fallback estimation
          holidays.forEach(holiday => {
            const dayOfWeek = holiday.date.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              // Assume some weekday holidays are worked
              if (Math.random() > 0.4) { // 60% chance of working
                working.push({
                  name: holiday.name,
                  date: holiday.date,
                  shiftCode: 'EST',
                  beginTime: '08:00',
                  endTime: '16:00'
                });
              } else {
                off.push({
                  name: holiday.name,
                  date: holiday.date
                });
              }
            } else {
              off.push({
                name: holiday.name,
                date: holiday.date
              });
            }
          });
        }
        
        // Sort by date
        working.sort((a, b) => a.date.getTime() - b.date.getTime());
        off.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        setHolidayBreakdown({ working, off });
      } catch (error) {
        console.error('Failed to fetch holiday breakdown:', error);
        setHolidayBreakdown({ working: [], off: [] });
      }
    };

    fetchDetailedHolidayBreakdown();
  }, [metricType, bidLine.bidPeriod, bidLine.schedule?.bidPeriod, bidLine.schedule?.scheduleShifts]);

  // Calculate total weekends in the period  
  const getTotalWeekendsInPeriod = () => {
    if (!bidPeriod) return null;
    
    const { numCycles, startDate, endDate } = bidPeriod;
    
    if (!numCycles || !startDate || !endDate || isNaN(numCycles)) {
      return null;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    let weekendCount = 0;
    
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() === 6) { // Saturday = 6
        weekendCount++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return weekendCount;
  };

  const totalWeekendsInPeriod = getTotalWeekendsInPeriod();

  // Generate dynamic metric configuration
  const getMetricConfig = () => ({
    weekends: {
      title: translations.weekendsWorking || 'Total Weekends',
      icon: Calendar,
      color: 'blue',
      description: translations.weekendsDescription || `Total number of weekends in ${periodDescription}`,
      explanation: translations.weekendsExplanation || 'This is the total count of all weekends (Saturday-Sunday pairs) in the entire schedule period. The "Saturdays" and "Sundays" metrics below show how many you actually work.',
    },
    saturdays: {
      title: translations.saturdays || 'Saturdays Working',
      icon: Calendar,
      color: 'purple',
      description: translations.saturdaysDescription || `Number of Saturdays you'll work during ${periodDescription}`,
      explanation: translations.saturdaysExplanation || 'Saturday shifts you will be scheduled to work during the schedule period.',
    },
    sundays: {
      title: translations.sundays || 'Sundays Working',
      icon: Calendar,
      color: 'orange',
      description: translations.sundaysDescription || `Number of Sundays you'll work during ${periodDescription}`,
      explanation: translations.sundaysExplanation || 'Sunday shifts you will be scheduled to work during the schedule period.',
    },
    fiveDayBlocks: {
      title: translations.fiveDayBlocks || '5-Day Blocks',
      icon: BarChart3,
      color: 'emerald',
      description: translations.fiveDayBlocksDescription || 'Number of 5 consecutive working days in the schedule',
      explanation: translations.fiveDayBlocksExplanation || 'Blocks of 5 working days followed by time off. More blocks can mean better work-life balance.',
    },
    fourDayBlocks: {
      title: translations.fourDayBlocks || '4-Day Blocks',
      icon: BarChart3,
      color: 'rose',
      description: translations.fourDayBlocksDescription || 'Number of 4 consecutive working days in the schedule',
      explanation: translations.fourDayBlocksExplanation || 'Blocks of 4 working days. These often provide good balance between work and time off.',
    },
    sixDayBlocks: {
      title: translations.sixDayBlocks || '6-Day Blocks',
      icon: BarChart3,
      color: 'teal',
      description: translations.sixDayBlocksDescription || 'Number of 6 consecutive working days in the schedule',
      explanation: translations.sixDayBlocksExplanation || 'Blocks of 6 working days. These longer stretches mean fewer transitions between work and time off.',
    },
    threeDayBlocks: {
      title: translations.threeDayBlocks || '3-Day Blocks',
      icon: BarChart3,
      color: 'cyan',
      description: translations.threeDayBlocksDescription || 'Number of 3 consecutive working days in the schedule',
      explanation: translations.threeDayBlocksExplanation || 'Blocks of 3 working days. These shorter blocks provide more frequent breaks between work periods.',
    },
    twoDayBlocks: {
      title: translations.twoDayBlocks || '2-Day Blocks',
      icon: BarChart3,
      color: 'lime',
      description: translations.twoDayBlocksDescription || 'Number of 2 consecutive working days in the schedule',
      explanation: translations.twoDayBlocksExplanation || 'Blocks of 2 working days. These minimal blocks mean frequent transitions between work and time off.',
    },
    singleDays: {
      title: translations.singleDays || 'Single Days',
      icon: Calendar,
      color: 'amber',
      description: translations.singleDaysDescription || 'Number of isolated single working days in the schedule',
      explanation: translations.singleDaysExplanation || 'Individual work days surrounded by days off. These can be good for part-time schedules but may involve more transitions.',
    },
    totalSaturdays: {
      title: translations.totalSaturdaysTitle || 'Total Saturdays',
      icon: Calendar,
      color: 'violet',
      description: translations.totalSaturdaysDescription || `Saturdays worked out of total Saturdays in ${periodDescription}`,
      explanation: translations.totalSaturdaysExplanation || 'This shows how many Saturdays you work compared to the total number of Saturdays in the schedule period.',
    },
    totalSundays: {
      title: translations.totalSundaysTitle || 'Total Sundays',
      icon: Calendar,
      color: 'fuchsia',
      description: translations.totalSundaysDescription || `Sundays worked out of total Sundays in ${periodDescription}`,
      explanation: translations.totalSundaysExplanation || 'This shows how many Sundays you work compared to the total number of Sundays in the schedule period.',
    },
    totalMondays: {
      title: translations.totalMondaysTitle || 'Total Mondays',
      icon: Calendar,
      color: 'blue',
      description: translations.totalMondaysDescription || `Mondays worked out of total Mondays in ${periodDescription}`,
      explanation: translations.totalMondaysExplanation || 'This shows how many Mondays you work compared to the total number of Mondays in the schedule period.',
    },
    totalTuesdays: {
      title: translations.totalTuesdaysTitle || 'Total Tuesdays',
      icon: Calendar,
      color: 'green',
      description: translations.totalTuesdaysDescription || `Tuesdays worked out of total Tuesdays in ${periodDescription}`,
      explanation: translations.totalTuesdaysExplanation || 'This shows how many Tuesdays you work compared to the total number of Tuesdays in the schedule period.',
    },
    totalWednesdays: {
      title: translations.totalWednesdaysTitle || 'Total Wednesdays',
      icon: Calendar,
      color: 'yellow',
      description: translations.totalWednesdaysDescription || `Wednesdays worked out of total Wednesdays in ${periodDescription}`,
      explanation: translations.totalWednesdaysExplanation || 'This shows how many Wednesdays you work compared to the total number of Wednesdays in the schedule period.',
    },
    totalThursdays: {
      title: translations.totalThursdaysTitle || 'Total Thursdays',
      icon: Calendar,
      color: 'red',
      description: translations.totalThursdaysDescription || `Thursdays worked out of total Thursdays in ${periodDescription}`,
      explanation: translations.totalThursdaysExplanation || 'This shows how many Thursdays you work compared to the total number of Thursdays in the schedule period.',
    },
    totalFridays: {
      title: translations.totalFridaysTitle || 'Total Fridays',
      icon: Calendar,
      color: 'purple',
      description: translations.totalFridaysDescription || `Fridays worked out of total Fridays in ${periodDescription}`,
      explanation: translations.totalFridaysExplanation || 'This shows how many Fridays you work compared to the total number of Fridays in the schedule period.',
    },
    totalDays: {
      title: translations.totalDays || 'Total Days',
      icon: Calendar,
      color: 'sky',
      description: translations.totalDaysDescription || `Total days worked out of all days in ${periodDescription}`,
      explanation: translations.totalDaysExplanation || 'This shows your overall work density - how many days you work compared to the total days in the schedule period.',
    },
    longestStretch: {
      title: translations.longestStretch || 'Longest Stretch',
      icon: BarChart3,
      color: 'red',
      description: translations.longestStretchDescription || 'The longest consecutive sequence of working days',
      explanation: translations.longestStretchExplanation || 'The maximum number of consecutive work days without a break. Shorter stretches generally provide better work-life balance.',
    },
    fridayWeekendBlocks: {
      title: translations.fridayWeekendBlocks || 'Friday-Weekend Blocks',
      icon: Calendar,
      color: 'pink',
      description: translations.fridayWeekendBlocksDescription || 'Number of Friday-Saturday-Sunday work blocks',
      explanation: translations.fridayWeekendBlocksExplanation || 'Blocks where you work Friday, Saturday, and Sunday consecutively. These can impact weekend social activities.',
    },
    weekdayBlocks: {
      title: translations.weekdayBlocks || 'Weekday Blocks',
      icon: BarChart3,
      color: 'slate',
      description: translations.weekdayBlocksDescription || 'Number of Monday-Friday work blocks',
      explanation: translations.weekdayBlocksExplanation || 'Consecutive work blocks that span Monday through Friday. These align well with traditional work schedules.',
    },
    holidays: {
      title: translations.holidays || 'Canadian Holidays',
      icon: Calendar,
      color: 'indigo',
      description: translations.holidaysDescription || `Canadian holidays you'll work during ${periodDescription}`,
      explanation: translations.holidaysExplanation || 'This shows how many Canadian holidays fall on your scheduled work days vs your days off during the period.',
    },
    offBlocks2day: {
      title: translations.offBlocks2dayTitle || translations.offBlocks2day || '2-Day Off Blocks',
      icon: BarChart3,
      color: 'gray',
      description: translations.offBlocks2dayDescription || `Number of 2-day off blocks during ${periodDescription}`,
      explanation: translations.offBlocks2dayExplanation || 'Consecutive 2-day periods where you have time off. These provide short recovery periods between work blocks.',
    },
    offBlocks3day: {
      title: translations.offBlocks3dayTitle || translations.offBlocks3day || '3-Day Off Blocks',
      icon: BarChart3,
      color: 'neutral',
      description: translations.offBlocks3dayDescription || `Number of 3-day off blocks during ${periodDescription}`,
      explanation: translations.offBlocks3dayExplanation || 'Consecutive 3-day periods where you have time off. These provide good recovery time for relaxation and personal activities.',
    },
    offBlocks4day: {
      title: translations.offBlocks4dayTitle || translations.offBlocks4day || '4-Day Off Blocks',
      icon: BarChart3,
      color: 'zinc',
      description: translations.offBlocks4dayDescription || `Number of 4-day off blocks during ${periodDescription}`,
      explanation: translations.offBlocks4dayExplanation || 'Consecutive 4-day periods where you have time off. These extended breaks allow for longer activities and better work-life balance.',
    },
    offBlocks5day: {
      title: translations.offBlocks5dayTitle || translations.offBlocks5day || '5-Day Off Blocks',
      icon: BarChart3,
      color: 'slate',
      description: translations.offBlocks5dayDescription || `Number of 5-day off blocks during ${periodDescription}`,
      explanation: translations.offBlocks5dayExplanation || 'Consecutive 5-day periods where you have time off. These longer breaks provide excellent recovery time and flexibility for personal projects.',
    },
    offBlocks6day: {
      title: translations.offBlocks6dayTitle || translations.offBlocks6day || '6-Day Off Blocks',
      icon: BarChart3,
      color: 'stone',
      description: translations.offBlocks6dayDescription || `Number of 6-day off blocks during ${periodDescription}`,
      explanation: translations.offBlocks6dayExplanation || 'Consecutive 6-day periods where you have time off. These extended breaks allow for travel, major projects, or significant rest and recovery.',
    },
    offBlocks7dayPlus: {
      title: translations.offBlocks7dayPlusTitle || translations.offBlocks7dayPlus || '7+ Day Off Blocks',
      icon: BarChart3,
      color: 'gray',
      description: translations.offBlocks7dayPlusDescription || `Number of 7+ day off blocks during ${periodDescription}`,
      explanation: translations.offBlocks7dayPlusExplanation || 'Consecutive periods of 7 or more days off. These are the longest breaks in your schedule, perfect for vacations, major projects, or complete rest.',
    },
    longestOffStretch: {
      title: translations.longestOffStretchTitle || translations.longestOffStretch || 'Longest Off Stretch',
      icon: BarChart3,
      color: 'emerald',
      description: translations.longestOffStretchDescription || 'The longest consecutive period of days off',
      explanation: translations.longestOffStretchExplanation || 'The maximum number of consecutive days off without working. Longer stretches provide better opportunities for complete rest, travel, or major personal projects.',
    },
    shortestOffStretch: {
      title: translations.shortestOffStretchTitle || translations.shortestOffStretch || 'Shortest Off Stretch',
      icon: BarChart3,
      color: 'teal',
      description: translations.shortestOffStretchDescription || 'The shortest consecutive period of days off',
      explanation: translations.shortestOffStretchExplanation || 'The minimum number of consecutive days off between work periods. Shorter stretches may indicate less recovery time between work blocks.',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const config = getMetricConfig()[metricType];
  const IconComponent = config.icon;
  
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-700',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-700',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
      rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-700',
      indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
      teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 border-teal-200 dark:border-teal-700',
      cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
      lime: 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-300 border-lime-200 dark:border-lime-700',
      amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-700',
      violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-700',
      fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-700',
      sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-700',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 border-red-200 dark:border-red-700',
      pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-700',
      slate: 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 border-green-200 dark:border-green-700',
      gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
      neutral: 'bg-neutral-100 dark:bg-neutral-900/30 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
      zinc: 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
      stone: 'bg-stone-100 dark:bg-stone-900/30 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };
  
  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl mx-2 sm:mx-4 transform transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getColorClasses(config.color)}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {config.title}
              </h2>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6 space-y-4">
            {/* Line Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {translations.bidLineNumber || 'Bid Line'} {bidLine.lineNumber}
                </span>
                {bidLine.operation && (
                  <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                    {bidLine.operation.name}
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {metricType === 'weekends' && totalWeekendsInPeriod 
                  ? `${metricValue} ${translations.of || 'of'} ${totalWeekendsInPeriod}`
                  : metricType === 'holidays' || metricType === 'totalSaturdays' || metricType === 'totalSundays' || metricType === 'totalMondays' || metricType === 'totalTuesdays' || metricType === 'totalWednesdays' || metricType === 'totalThursdays' || metricType === 'totalFridays' || metricType === 'totalDays'
                  ? metricValue // metricValue is already in "X of Y" format for these metrics
                  : metricValue
                }
                {typeof metricValue === 'number' && (
                  <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">
                    {metricType === 'weekends' 
                      ? 'weekends'
                      : metricType === 'saturdays' || metricType === 'sundays' || metricType === 'singleDays'
                      ? 'days'
                      : metricType === 'longestStretch' || metricType === 'longestOffStretch' || metricType === 'shortestOffStretch'
                      ? 'consecutive days'
                      : 'blocks'}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {translations.whatThisMeans || 'What this means'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* Explanation */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {translations.whyItMatters || 'Why it matters'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {config.explanation}
              </p>
            </div>

            {/* Holiday Breakdown for holidays metric */}
            {metricType === 'holidays' && (holidayBreakdown.working.length > 0 || holidayBreakdown.off.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Working Holidays */}
                {holidayBreakdown.working.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      {translations.holidaysWorking || 'Holidays You\'re Working'} ({holidayBreakdown.working.length})
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {holidayBreakdown.working.map((holiday, index) => (
                        <div key={index} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {holiday.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {format(holiday.date, 'EEEE, MMMM d, yyyy')}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded-md text-sm font-medium mb-2">
                                {holiday.shiftCode}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {holiday.beginTime} - {holiday.endTime}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Off Holidays */}
                {holidayBreakdown.off.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      {translations.holidaysOff || 'Holidays You\'re Off'} ({holidayBreakdown.off.length})
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {holidayBreakdown.off.map((holiday, index) => (
                        <div key={index} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {holiday.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {format(holiday.date, 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-3 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
            >
              {translations.close || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
  
  // Render modal using portal to avoid z-index issues
  return createPortal(modalContent, document.body);
}