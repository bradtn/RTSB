import { ShiftCode, Schedule, ScheduleShift, BidPeriod } from "@prisma/client";

// Prisma return type with includes
export type PrismaScheduleWithShifts = Schedule & {
  scheduleShifts: (ScheduleShift & {
    shiftCode?: ShiftCode | null;
  })[];
};

export interface ScheduleWithShifts extends Schedule {
  scheduleShifts: (ScheduleShift & {
    shiftCode?: ShiftCode | null;
  })[];
}

export interface ScheduleMetrics {
  totalShifts: number;
  totalHours: number;
  daysOff: number;
  weekendsWorked: number;
  saturdaysWorked: number;
  sundaysWorked: number;
  consecutiveDaysWorked: number[];
  shiftBreakdown: Record<string, number>;
}

// ShiftCalc-style metrics interface
export interface ShiftCalcMetrics {
  weekendsOn: number;
  saturdaysOn: number;
  sundaysOn: number;
  blocks5day: number;
  blocks4day: number;
  shiftPattern: string;
}

export function calculateScheduleMetrics(schedule: ScheduleWithShifts): ScheduleMetrics {
  const metrics: ScheduleMetrics = {
    totalShifts: 0,
    totalHours: 0,
    daysOff: 0,
    weekendsWorked: 0,
    saturdaysWorked: 0,
    sundaysWorked: 0,
    consecutiveDaysWorked: [],
    shiftBreakdown: {}
  };

  let consecutiveCount = 0;
  const consecutiveRuns: number[] = [];

  for (const shift of schedule.scheduleShifts.sort((a, b) => a.dayNumber - b.dayNumber)) {
    const dayOfWeek = new Date(shift.date).getDay(); // 0 = Sunday, 6 = Saturday

    if (shift.shiftCode) {
      // Working day
      metrics.totalShifts++;
      metrics.totalHours += shift.shiftCode.hoursLength;
      consecutiveCount++;

      // Track shift types
      const shiftType = shift.shiftCode.category;
      metrics.shiftBreakdown[shiftType] = (metrics.shiftBreakdown[shiftType] || 0) + 1;

      // Weekend work tracking
      if (dayOfWeek === 0) metrics.sundaysWorked++;
      if (dayOfWeek === 6) metrics.saturdaysWorked++;
      if (dayOfWeek === 0 || dayOfWeek === 6) metrics.weekendsWorked++;
    } else {
      // Day off
      metrics.daysOff++;
      
      if (consecutiveCount > 0) {
        consecutiveRuns.push(consecutiveCount);
        consecutiveCount = 0;
      }
    }
  }

  // Add final consecutive run if exists
  if (consecutiveCount > 0) {
    consecutiveRuns.push(consecutiveCount);
  }

  metrics.consecutiveDaysWorked = consecutiveRuns;
  return metrics;
}

export function calculateShiftCalcMetrics(
  schedule: ScheduleWithShifts, 
  numCycles: number = 1
): ShiftCalcMetrics {
  const metrics: ShiftCalcMetrics = {
    weekendsOn: 0,
    saturdaysOn: 0,
    sundaysOn: 0,
    blocks5day: 0,
    blocks4day: 0,
    shiftPattern: "Mixed"
  };

  const sortedShifts = schedule.scheduleShifts.sort((a, b) => a.dayNumber - b.dayNumber);
  const shiftTypes: string[] = [];
  let consecutiveWorkDays = 0;
  const workBlocks: number[] = [];
  
  // Track weekend work per weekend pair
  const weekends: { [weekendKey: string]: { saturday: boolean, sunday: boolean } } = {};
  
  // First pass: identify all weekend work
  for (const shift of sortedShifts) {
    const date = new Date(shift.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (shift.shiftCode) {
      // Working day
      consecutiveWorkDays++;
      shiftTypes.push(shift.shiftCode.code);
      
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
        
        if (dayOfWeek === 6) weekends[weekendKey].saturday = true;
        if (dayOfWeek === 0) weekends[weekendKey].sunday = true;
      }
    } else {
      // Day off - end of work block
      if (consecutiveWorkDays > 0) {
        workBlocks.push(consecutiveWorkDays);
        consecutiveWorkDays = 0;
      }
    }
  }
  
  // Count weekend types
  for (const weekend of Object.values(weekends)) {
    if (weekend.saturday && weekend.sunday) {
      // Both days worked - counts as weekend working
      metrics.weekendsOn++;
    } else if (weekend.saturday && !weekend.sunday) {
      // Only Saturday worked
      metrics.saturdaysOn++;
    } else if (weekend.sunday && !weekend.saturday) {
      // Only Sunday worked
      metrics.sundaysOn++;
    }
  }
  
  // Add final block if schedule ends on work day
  if (consecutiveWorkDays > 0) {
    workBlocks.push(consecutiveWorkDays);
  }
  
  // Count block types
  metrics.blocks5day = workBlocks.filter(block => block === 5).length;
  metrics.blocks4day = workBlocks.filter(block => block === 4).length;
  
  // Multiply all counts by the number of cycles for the full bid period
  metrics.weekendsOn *= numCycles;
  metrics.saturdaysOn *= numCycles;
  metrics.sundaysOn *= numCycles;
  metrics.blocks5day *= numCycles;
  metrics.blocks4day *= numCycles;
  
  // Determine shift pattern
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

export function getCycleDay(date: Date, cycleStartDate: Date): number {
  const diffTime = date.getTime() - cycleStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return (diffDays % 56) + 1;
}

export function getDateForCycleDay(cycleStartDate: Date, dayNumber: number): Date {
  const date = new Date(cycleStartDate);
  date.setDate(date.getDate() + (dayNumber - 1));
  return date;
}

export function isDateInCycle(date: Date, bidPeriod: BidPeriod): boolean {
  return date >= bidPeriod.startDate && date <= bidPeriod.endDate;
}

export function getCurrentCycle(date: Date, bidPeriod: BidPeriod): number {
  if (!isDateInCycle(date, bidPeriod)) return -1;
  
  const diffTime = date.getTime() - bidPeriod.startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 56) + 1;
}

export function formatShiftTime(beginTime: string, endTime: string): string {
  return `${beginTime} - ${endTime}`;
}

export function getShiftDuration(beginTime: string, endTime: string): number {
  const [beginHour, beginMin] = beginTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const beginMinutes = beginHour * 60 + beginMin;
  let endMinutes = endHour * 60 + endMin;
  
  // Handle overnight shifts
  if (endMinutes <= beginMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }
  
  return (endMinutes - beginMinutes) / 60; // Return hours
}

export interface ScheduleFilter {
  groupNames?: string[];
  shiftCategories?: string[];
  minHoursPerWeek?: number;
  maxHoursPerWeek?: number;
  maxConsecutiveDays?: number;
  weekendsOff?: boolean;
}

export function filterSchedules(
  schedules: ScheduleWithShifts[],
  filter: ScheduleFilter
): ScheduleWithShifts[] {
  return schedules.filter(schedule => {
    const metrics = calculateScheduleMetrics(schedule);
    const weeklyHours = metrics.totalHours / 8; // Approximate weekly hours

    // Group filter
    if (filter.groupNames?.length && !filter.groupNames.includes(schedule.groupName || '')) {
      return false;
    }

    // Shift category filter
    if (filter.shiftCategories?.length) {
      const scheduleCategories = Object.keys(metrics.shiftBreakdown);
      const hasMatchingCategory = filter.shiftCategories.some(cat => 
        scheduleCategories.includes(cat)
      );
      if (!hasMatchingCategory) return false;
    }

    // Hours per week filter
    if (filter.minHoursPerWeek && weeklyHours < filter.minHoursPerWeek) {
      return false;
    }
    if (filter.maxHoursPerWeek && weeklyHours > filter.maxHoursPerWeek) {
      return false;
    }

    // Consecutive days filter
    if (filter.maxConsecutiveDays) {
      const maxConsecutive = Math.max(...metrics.consecutiveDaysWorked, 0);
      if (maxConsecutive > filter.maxConsecutiveDays) {
        return false;
      }
    }

    // Weekends off filter
    if (filter.weekendsOff && metrics.weekendsWorked > 0) {
      return false;
    }

    return true;
  });
}