/**
 * Utility functions for calculating and updating schedule metrics
 */

import { prisma } from '@/lib/prisma';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';

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

interface ScheduleForCalculation {
  scheduleShifts: Array<{
    dayNumber: number;
    date: Date;
    shiftCodeId: string | null;
    shiftCode?: {
      code: string;
      beginTime: string;
      endTime: string;
      category: string;
      hoursLength: number;
    } | null;
  }>;
  bidPeriod?: {
    numCycles: number;
    startDate: Date;
    endDate: Date;
  } | null;
}

/**
 * Calculate schedule metrics for a given schedule
 */
export async function calculateScheduleMetrics(schedule: ScheduleForCalculation): Promise<ScheduleMetrics | null> {
  if (!schedule?.scheduleShifts) {
    return null;
  }
  
  const shiftsWithCodes = schedule.scheduleShifts.filter((s) => s.shiftCode);
  
  // Get the number of cycles from the bid period (default to 1 if not available)
  const numCycles = schedule.bidPeriod?.numCycles || 1;
  
  const metrics: ScheduleMetrics = {
    weekendsOn: 0,
    saturdaysOn: 0,
    sundaysOn: 0,
    blocks5day: 0,
    blocks4day: 0,
    blocks3day: 0,
    blocks2day: 0,
    blocks6day: 0,
    singleDays: 0,
    holidaysWorking: 0,
    holidaysOff: 0,
    shiftPattern: "Mixed",
    totalSaturdays: 0,
    totalSaturdaysInPeriod: 0,
    totalSundays: 0,
    totalSundaysInPeriod: 0,
    totalDaysWorked: 0,
    totalDaysInPeriod: 0,
    totalMondays: 0,
    totalMondaysInPeriod: 0,
    totalTuesdays: 0,
    totalTuesdaysInPeriod: 0,
    totalWednesdays: 0,
    totalWednesdaysInPeriod: 0,
    totalThursdays: 0,
    totalThursdaysInPeriod: 0,
    totalFridays: 0,
    totalFridaysInPeriod: 0,
    longestStretch: 0,
    fridayWeekendBlocks: 0,
    weekdayBlocks: 0,
    offBlocks2day: 0,
    offBlocks3day: 0,
    offBlocks4day: 0,
    offBlocks5day: 0,
    offBlocks6day: 0,
    offBlocks7dayPlus: 0,
    longestOffStretch: 0,
    shortestOffStretch: 0,
  };

  if (shiftsWithCodes.length === 0) {
    metrics.shiftPattern = "No shifts";
    return metrics;
  }

  const sortedShifts = schedule.scheduleShifts.sort((a, b) => a.dayNumber - b.dayNumber);
  const shiftTypes: string[] = [];
  let consecutiveWorkDays = 0;
  const workBlocks: number[] = [];
  
  // Track weekend work per weekend pair
  const weekends: { [weekendKey: string]: { saturday: boolean, sunday: boolean } } = {};
  let workingShifts = 0;
  
  // Get holidays for the schedule period using the existing holiday system
  let holidays: Date[] = [];
  if (sortedShifts.length > 0) {
    try {
      const firstShift = sortedShifts[0];
      const lastShift = sortedShifts[sortedShifts.length - 1];
      const startDate = new Date(firstShift.date);
      const endDate = new Date(lastShift.date);
      
      const holidayData = await getHolidaysForPeriod(startDate, endDate, HolidayFilters.WORKPLACE_STANDARD);
      holidays = holidayData.map(h => h.date);
    } catch (error) {
      console.warn('Failed to fetch holidays for schedule metrics:', error);
    }
  }
  
  // Create a set of holiday date strings for quick lookup
  const holidayDates = new Set(holidays.map(d => d.toISOString().split('T')[0]));
  
  // First pass: identify all weekend work and holidays
  for (const shift of sortedShifts) {
    const date = new Date(shift.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dateString = date.toISOString().split('T')[0];
    const isHolidayDate = holidayDates.has(dateString);
    
    if (shift.shiftCode) {
      // Working day
      workingShifts++;
      consecutiveWorkDays++;
      shiftTypes.push(shift.shiftCode.code);
      
      // Track holiday work
      if (isHolidayDate) {
        metrics.holidaysWorking++;
      }
      
      // Track weekend work by weekend pair
      if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
        const weekStart = new Date(date);
        if (dayOfWeek === 0) { // If Sunday, go back to previous Saturday
          weekStart.setDate(weekStart.getDate() - 1);
        }
        const weekendKey = weekStart.toISOString().split('T')[0]; // Use Saturday date as key
        
        if (!weekends[weekendKey]) {
          weekends[weekendKey] = { saturday: false, sunday: false };
        }
        
        if (dayOfWeek === 6) {
          weekends[weekendKey].saturday = true;
        }
        if (dayOfWeek === 0) {
          weekends[weekendKey].sunday = true;
        }
      }
      
    } else {
      // Day off
      if (isHolidayDate) {
        metrics.holidaysOff++;
      }
      
      // End of work block
      if (consecutiveWorkDays > 0) {
        workBlocks.push(consecutiveWorkDays);
        consecutiveWorkDays = 0;
      }
    }
  }
  
  // Count weekend work patterns
  for (const weekend of Object.values(weekends)) {
    if (weekend.saturday && weekend.sunday) {
      metrics.weekendsOn++;
    } else if (weekend.saturday) {
      metrics.saturdaysOn++;
    } else if (weekend.sunday) {
      metrics.sundaysOn++;
    }
  }
  
  // Don't forget the last work block if the schedule ends on working days
  if (consecutiveWorkDays > 0) {
    workBlocks.push(consecutiveWorkDays);
  }
  
  // Count all work blocks
  for (const blockLength of workBlocks) {
    if (blockLength === 1) {
      metrics.singleDays++;
    } else if (blockLength === 2) {
      metrics.blocks2day++;
    } else if (blockLength === 3) {
      metrics.blocks3day++;
    } else if (blockLength === 4) {
      metrics.blocks4day++;
    } else if (blockLength === 5) {
      metrics.blocks5day++;
    } else if (blockLength === 6) {
      metrics.blocks6day++;
    }
  }
  
  // Calculate longest consecutive work stretch
  metrics.longestStretch = workBlocks.length > 0 ? Math.max(...workBlocks) : 0;
  
  // Calculate total days worked and period length
  metrics.totalDaysWorked = workingShifts;
  metrics.totalDaysInPeriod = sortedShifts.length;
  
  // Count total weekdays in the period vs worked
  let totalSaturdaysInPeriod = 0;
  let totalSundaysInPeriod = 0;
  let totalMondaysInPeriod = 0;
  let totalTuesdaysInPeriod = 0;
  let totalWednesdaysInPeriod = 0;
  let totalThursdaysInPeriod = 0;
  let totalFridaysInPeriod = 0;
  let fridayWeekendBlockCount = 0;
  let weekdayBlockCount = 0;
  
  // Count all weekdays in the period
  for (const shift of sortedShifts) {
    const date = new Date(shift.date);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    
    switch (dayOfWeek) {
      case 0: // Sunday
        totalSundaysInPeriod++;
        break;
      case 1: // Monday
        totalMondaysInPeriod++;
        break;
      case 2: // Tuesday
        totalTuesdaysInPeriod++;
        break;
      case 3: // Wednesday
        totalWednesdaysInPeriod++;
        break;
      case 4: // Thursday
        totalThursdaysInPeriod++;
        break;
      case 5: // Friday
        totalFridaysInPeriod++;
        break;
      case 6: // Saturday
        totalSaturdaysInPeriod++;
        break;
    }
  }
  
  // Count worked Saturdays and Sundays
  for (const weekend of Object.values(weekends)) {
    if (weekend.saturday) {
      metrics.totalSaturdays++;
    }
    if (weekend.sunday) {
      metrics.totalSundays++;
    }
  }
  
  // Count worked weekdays (Monday-Friday)
  for (const shift of sortedShifts) {
    if (shift.shiftCode) { // Only count working days
      const date = new Date(shift.date);
      const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      
      switch (dayOfWeek) {
        case 1: // Monday
          metrics.totalMondays++;
          break;
        case 2: // Tuesday
          metrics.totalTuesdays++;
          break;
        case 3: // Wednesday
          metrics.totalWednesdays++;
          break;
        case 4: // Thursday
          metrics.totalThursdays++;
          break;
        case 5: // Friday
          metrics.totalFridays++;
          break;
      }
    }
  }
  
  // Set period totals
  metrics.totalSaturdaysInPeriod = totalSaturdaysInPeriod;
  metrics.totalSundaysInPeriod = totalSundaysInPeriod;
  metrics.totalMondaysInPeriod = totalMondaysInPeriod;
  metrics.totalTuesdaysInPeriod = totalTuesdaysInPeriod;
  metrics.totalWednesdaysInPeriod = totalWednesdaysInPeriod;
  metrics.totalThursdaysInPeriod = totalThursdaysInPeriod;
  metrics.totalFridaysInPeriod = totalFridaysInPeriod;
  
  // Properly detect Friday-Weekend blocks and weekday blocks by analyzing actual work patterns
  let currentBlockStart = -1;
  let currentBlockLength = 0;
  const workBlockDetails: Array<{startIndex: number, length: number, days: number[]}> = [];
  
  // Track actual work blocks with their day-of-week patterns
  for (let i = 0; i < sortedShifts.length; i++) {
    const shift = sortedShifts[i];
    
    if (shift.shiftCode) {
      // Working day
      if (currentBlockStart === -1) {
        currentBlockStart = i;
      }
      currentBlockLength++;
    } else {
      // Day off - end of work block
      if (currentBlockStart !== -1) {
        const blockDays = sortedShifts.slice(currentBlockStart, currentBlockStart + currentBlockLength)
          .map(s => new Date(s.date).getDay());
        workBlockDetails.push({
          startIndex: currentBlockStart,
          length: currentBlockLength,
          days: blockDays
        });
        currentBlockStart = -1;
        currentBlockLength = 0;
      }
    }
  }
  
  // Don't forget the last block if schedule ends on working days
  if (currentBlockStart !== -1) {
    const blockDays = sortedShifts.slice(currentBlockStart, currentBlockStart + currentBlockLength)
      .map(s => new Date(s.date).getDay());
    workBlockDetails.push({
      startIndex: currentBlockStart,
      length: currentBlockLength,
      days: blockDays
    });
  }
  
  // Analyze each work block for Friday-Weekend and weekday patterns
  for (const block of workBlockDetails) {
    const { days, length } = block;
    
    // Friday-Weekend blocks: Must contain Friday(5) + Saturday(6) + Sunday(0)
    if (length >= 3) {
      const hasFriday = days.includes(5);
      const hasSaturday = days.includes(6);
      const hasSunday = days.includes(0);
      
      if (hasFriday && hasSaturday && hasSunday) {
        // Check for consecutive Fri-Sat-Sun pattern
        for (let i = 0; i <= days.length - 3; i++) {
          if (days[i] === 5 && days[i + 1] === 6 && days[i + 2] === 0) {
            fridayWeekendBlockCount++;
            break; // Only count once per block
          }
        }
      }
    }
    
    // Weekday blocks: Must be exactly Monday(1) through Friday(5)
    if (length === 5) {
      const expectedWeekdays = [1, 2, 3, 4, 5]; // Mon-Fri
      const sortedBlockDays = [...days].sort((a, b) => a - b);
      
      if (JSON.stringify(sortedBlockDays) === JSON.stringify(expectedWeekdays)) {
        weekdayBlockCount++;
      }
    }
  }
  
  metrics.fridayWeekendBlocks = fridayWeekendBlockCount;
  metrics.weekdayBlocks = weekdayBlockCount;
  
  // Calculate off-day blocks
  let currentOffBlockStart = -1;
  let currentOffBlockLength = 0;
  const offBlockLengths: number[] = [];
  
  for (let i = 0; i < sortedShifts.length; i++) {
    const shift = sortedShifts[i];
    
    if (!shift.shiftCode) {
      // Day off
      if (currentOffBlockStart === -1) {
        currentOffBlockStart = i;
      }
      currentOffBlockLength++;
    } else {
      // Working day - end of off block
      if (currentOffBlockStart !== -1 && currentOffBlockLength > 0) {
        offBlockLengths.push(currentOffBlockLength);
        currentOffBlockStart = -1;
        currentOffBlockLength = 0;
      }
    }
  }
  
  // Don't forget the last off block if schedule ends on days off
  if (currentOffBlockStart !== -1 && currentOffBlockLength > 0) {
    offBlockLengths.push(currentOffBlockLength);
  }
  
  // Count off blocks by length
  for (const blockLength of offBlockLengths) {
    if (blockLength === 2) {
      metrics.offBlocks2day++;
    } else if (blockLength === 3) {
      metrics.offBlocks3day++;
    } else if (blockLength === 4) {
      metrics.offBlocks4day++;
    } else if (blockLength === 5) {
      metrics.offBlocks5day++;
    } else if (blockLength === 6) {
      metrics.offBlocks6day++;
    } else if (blockLength >= 7) {
      metrics.offBlocks7dayPlus++;
    }
  }
  
  // Calculate longest and shortest off stretches
  if (offBlockLengths.length > 0) {
    metrics.longestOffStretch = Math.max(...offBlockLengths);
    metrics.shortestOffStretch = Math.min(...offBlockLengths);
  } else {
    metrics.longestOffStretch = 0;
    metrics.shortestOffStretch = 0;
  }
  
  // Multiply all counts by the number of cycles for the full bid period
  metrics.weekendsOn *= numCycles;
  metrics.saturdaysOn *= numCycles;
  metrics.sundaysOn *= numCycles;
  metrics.blocks5day *= numCycles;
  metrics.blocks4day *= numCycles;
  metrics.blocks3day *= numCycles;
  metrics.blocks2day *= numCycles;
  metrics.blocks6day *= numCycles;
  metrics.singleDays *= numCycles;
  metrics.holidaysWorking *= numCycles;
  metrics.holidaysOff *= numCycles;
  metrics.totalSaturdays *= numCycles;
  metrics.totalSaturdaysInPeriod *= numCycles;
  metrics.totalSundays *= numCycles;
  metrics.totalSundaysInPeriod *= numCycles;
  metrics.totalMondays *= numCycles;
  metrics.totalMondaysInPeriod *= numCycles;
  metrics.totalTuesdays *= numCycles;
  metrics.totalTuesdaysInPeriod *= numCycles;
  metrics.totalWednesdays *= numCycles;
  metrics.totalWednesdaysInPeriod *= numCycles;
  metrics.totalThursdays *= numCycles;
  metrics.totalThursdaysInPeriod *= numCycles;
  metrics.totalFridays *= numCycles;
  metrics.totalFridaysInPeriod *= numCycles;
  metrics.totalDaysWorked *= numCycles;
  metrics.totalDaysInPeriod *= numCycles;
  metrics.fridayWeekendBlocks *= numCycles;
  metrics.weekdayBlocks *= numCycles;
  metrics.offBlocks2day *= numCycles;
  metrics.offBlocks3day *= numCycles;
  metrics.offBlocks4day *= numCycles;
  metrics.offBlocks5day *= numCycles;
  metrics.offBlocks6day *= numCycles;
  metrics.offBlocks7dayPlus *= numCycles;
  // Note: longestStretch and longestOffStretch are not multiplied as they represent the single longest stretches
  // shortestOffStretch is also not multiplied as it represents the single shortest off stretch
  
  // Determine shift pattern for display
  const uniqueShifts = [...new Set(shiftTypes)];
  if (uniqueShifts.length === 0) {
    metrics.shiftPattern = "No shifts";
  } else if (uniqueShifts.length === 1) {
    metrics.shiftPattern = uniqueShifts[0];
  } else if (uniqueShifts.length <= 3) {
    metrics.shiftPattern = uniqueShifts.join("/");
  } else {
    metrics.shiftPattern = "Mixed";
  }
  
  return metrics;
}

/**
 * Calculate and update schedule metrics for a specific bid line
 */
export async function updateBidLineMetrics(bidLineId: string): Promise<void> {
  const bidLine = await prisma.bidLine.findUnique({
    where: { id: bidLineId },
    include: {
      schedule: {
        include: {
          bidPeriod: true,
          scheduleShifts: {
            include: {
              shiftCode: true
            },
            orderBy: {
              dayNumber: 'asc'
            }
          }
        }
      }
    }
  });

  if (!bidLine?.schedule) {
    console.warn(`No schedule found for bid line ${bidLineId}`);
    return;
  }

  const metrics = await calculateScheduleMetrics(bidLine.schedule);
  
  if (metrics) {
    await prisma.bidLine.update({
      where: { id: bidLineId },
      data: {
        weekendsOn: metrics.weekendsOn,
        saturdaysOn: metrics.saturdaysOn,
        sundaysOn: metrics.sundaysOn,
        blocks5day: metrics.blocks5day,
        blocks4day: metrics.blocks4day,
        blocks3day: metrics.blocks3day,
        blocks2day: metrics.blocks2day,
        blocks6day: metrics.blocks6day,
        singleDays: metrics.singleDays,
        holidaysWorking: metrics.holidaysWorking,
        holidaysOff: metrics.holidaysOff,
        shiftPattern: metrics.shiftPattern,
        totalSaturdays: metrics.totalSaturdays,
        totalSaturdaysInPeriod: metrics.totalSaturdaysInPeriod,
        totalSundays: metrics.totalSundays,
        totalSundaysInPeriod: metrics.totalSundaysInPeriod,
        totalMondays: metrics.totalMondays,
        totalMondaysInPeriod: metrics.totalMondaysInPeriod,
        totalTuesdays: metrics.totalTuesdays,
        totalTuesdaysInPeriod: metrics.totalTuesdaysInPeriod,
        totalWednesdays: metrics.totalWednesdays,
        totalWednesdaysInPeriod: metrics.totalWednesdaysInPeriod,
        totalThursdays: metrics.totalThursdays,
        totalThursdaysInPeriod: metrics.totalThursdaysInPeriod,
        totalFridays: metrics.totalFridays,
        totalFridaysInPeriod: metrics.totalFridaysInPeriod,
        totalDaysWorked: metrics.totalDaysWorked,
        totalDaysInPeriod: metrics.totalDaysInPeriod,
        longestStretch: metrics.longestStretch,
        fridayWeekendBlocks: metrics.fridayWeekendBlocks,
        weekdayBlocks: metrics.weekdayBlocks,
        offBlocks2day: metrics.offBlocks2day,
        offBlocks3day: metrics.offBlocks3day,
        offBlocks4day: metrics.offBlocks4day,
        offBlocks5day: metrics.offBlocks5day,
        offBlocks6day: metrics.offBlocks6day,
        offBlocks7dayPlus: metrics.offBlocks7dayPlus,
        longestOffStretch: metrics.longestOffStretch,
        shortestOffStretch: metrics.shortestOffStretch,
      }
    });
    
    console.log(`Updated metrics for bid line ${bidLine.lineNumber}: ${metrics.shiftPattern}, weekends: ${metrics.weekendsOn}, 5-day blocks: ${metrics.blocks5day}`);
  }
}

/**
 * Calculate and update schedule metrics for all bid lines in a bid period
 */
export async function updateAllBidLineMetricsForPeriod(bidPeriodId: string): Promise<{ updated: number; skipped: number }> {
  const bidLines = await prisma.bidLine.findMany({
    where: {
      bidPeriodId: bidPeriodId,
      scheduleId: { not: null }
    },
    include: {
      schedule: {
        include: {
          bidPeriod: true,
          scheduleShifts: {
            include: {
              shiftCode: true
            },
            orderBy: {
              dayNumber: 'asc'
            }
          }
        }
      }
    }
  });

  console.log(`Updating metrics for ${bidLines.length} bid lines in bid period ${bidPeriodId}`);

  let updated = 0;
  let skipped = 0;

  for (const bidLine of bidLines) {
    try {
      if (!bidLine.schedule) {
        skipped++;
        continue;
      }

      const metrics = await calculateScheduleMetrics(bidLine.schedule);
      
      if (metrics) {
        await prisma.bidLine.update({
          where: { id: bidLine.id },
          data: {
            weekendsOn: metrics.weekendsOn,
            saturdaysOn: metrics.saturdaysOn,
            sundaysOn: metrics.sundaysOn,
            blocks5day: metrics.blocks5day,
            blocks4day: metrics.blocks4day,
            blocks3day: metrics.blocks3day,
            blocks2day: metrics.blocks2day,
            blocks6day: metrics.blocks6day,
            singleDays: metrics.singleDays,
            holidaysWorking: metrics.holidaysWorking,
            holidaysOff: metrics.holidaysOff,
            shiftPattern: metrics.shiftPattern,
            totalSaturdays: metrics.totalSaturdays,
            totalSaturdaysInPeriod: metrics.totalSaturdaysInPeriod,
            totalSundays: metrics.totalSundays,
            totalSundaysInPeriod: metrics.totalSundaysInPeriod,
            totalMondays: metrics.totalMondays,
            totalMondaysInPeriod: metrics.totalMondaysInPeriod,
            totalTuesdays: metrics.totalTuesdays,
            totalTuesdaysInPeriod: metrics.totalTuesdaysInPeriod,
            totalWednesdays: metrics.totalWednesdays,
            totalWednesdaysInPeriod: metrics.totalWednesdaysInPeriod,
            totalThursdays: metrics.totalThursdays,
            totalThursdaysInPeriod: metrics.totalThursdaysInPeriod,
            totalFridays: metrics.totalFridays,
            totalFridaysInPeriod: metrics.totalFridaysInPeriod,
            totalDaysWorked: metrics.totalDaysWorked,
            totalDaysInPeriod: metrics.totalDaysInPeriod,
            longestStretch: metrics.longestStretch,
            fridayWeekendBlocks: metrics.fridayWeekendBlocks,
            weekdayBlocks: metrics.weekdayBlocks,
            offBlocks2day: metrics.offBlocks2day,
            offBlocks3day: metrics.offBlocks3day,
            offBlocks4day: metrics.offBlocks4day,
            offBlocks5day: metrics.offBlocks5day,
            offBlocks6day: metrics.offBlocks6day,
            offBlocks7dayPlus: metrics.offBlocks7dayPlus,
            longestOffStretch: metrics.longestOffStretch,
            shortestOffStretch: metrics.shortestOffStretch,
          }
        });
        
        updated++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Error updating metrics for bid line ${bidLine.lineNumber}:`, error);
      skipped++;
    }
  }

  console.log(`Metrics update complete: ${updated} updated, ${skipped} skipped`);
  return { updated, skipped };
}