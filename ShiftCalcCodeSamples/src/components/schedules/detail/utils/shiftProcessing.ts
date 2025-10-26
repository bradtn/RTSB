// src/components/schedules/detail/utils/shiftProcessing.ts
// Process schedule data into calendar format
import { getStartDate, getNumCycles } from '@/lib/settings';
import { ScheduleType, CalendarData, CalculatedStats, ShiftInfo } from '../types';
import { categorizeShift, getShortCode, extractShiftTimeFromCode, DAY_OFF_CODE } from './shiftUtils';
import { isToday, isPastDay } from './dateUtils';
import { addDays } from 'date-fns';

export function processScheduleData(
  schedule: ScheduleType,
  selectedShiftCodes: string[] = [],
  shiftCodes: ShiftInfo[] = []
): {
  calendarData: CalendarData,
  calculatedStats: CalculatedStats
} {
  // Extract day columns for a single cycle
  const dayColumns = Object.keys(schedule)
    .filter(key => key.startsWith("DAY_"))
    .sort((a, b) => parseInt(a.replace("DAY_", "")) - parseInt(b.replace("DAY_", "")));
  
  // Get start date and cycle configuration from settings
  const startDateStr = getStartDate(); // e.g. "2025-04-24"
  const [yearStr, monthStr, dayStr] = startDateStr.split('-');
  const startDate = new Date(
    parseInt(yearStr),
    parseInt(monthStr) - 1,
    parseInt(dayStr)
  );
  
  const numCycles = getNumCycles() || 1;
  const daysPerCycle = 56; // Should match DAYS_PER_CYCLE in scoring.ts
  
  // Create a pattern object for a single cycle
  const cycleDayPattern: Record<number, string> = {};
  dayColumns.forEach(dayCol => {
    const dayNum = parseInt(dayCol.replace("DAY_", ""));
    const shiftCode = schedule[dayCol] || DAY_OFF_CODE;
    cycleDayPattern[dayNum] = shiftCode;
  });
  
  // Generate calendar data for all days in the schedule period
  const totalDays = daysPerCycle * numCycles;
  const endDate = addDays(startDate, totalDays - 1);
  
  // Generate complete calendar months for the entire period
  // Start from the first day of the first month
  const firstMonthDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  // End with the last day of the last month
  const lastMonthDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
  
  // Organize by month
  const months = [];
  let currentMonth = null;
  let currentYear = null;
  let daysInMonth = [];
  let currentDate = new Date(firstMonthDate);
  
  // Shift counting across all cycles
  const shiftCounts: Record<string, number> = {};
  let totalShifts = 0;
  let totalDaysOff = 0;
  
  // Tracking for weekends and work blocks
  let weekendsOn = 0;
  let totalWeekends = 0;
  let saturdaysOn = 0;
  let sundaysOn = 0;
  let saturdaysOnly = 0; 
  let sundaysOnly = 0;   
  
  // For tracking consecutive work days (blocks)
  let blocks5day = 0;
  let blocks4day = 0;
  let consecutiveWorkDays = 0;
  let previousDayWasWorkDay = false;
  
  // For shift types (proper categorization)
  let daysShifts = 0;
  let afternoonsShifts = 0;
  let midDaysShifts = 0;
  let lateDaysShifts = 0;
  let midnightsShifts = 0;
  
  // Create a full array of days for the entire schedule period
  const allScheduleDays = [];
  let tempDate = new Date(startDate);
  
  // Array to collect all shift codes encountered for debugging
  const allShiftCodes = new Set();
  const categorizedShifts: Record<string, string[]> = {
    Days: [],
    Afternoons: [],
    "Mid Days": [],
    "Late Days": [],
    Midnights: [],
    Other: []
  };
  
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const currentDayDate = new Date(tempDate);
    const dayInCycle = (dayIndex % daysPerCycle) + 1;
    const shiftCode = cycleDayPattern[dayInCycle] || DAY_OFF_CODE;
    
    if (shiftCode !== DAY_OFF_CODE) {
      allShiftCodes.add(shiftCode);
      const category = categorizeShift(shiftCode, shiftCodes, schedule);
      if (categorizedShifts[category]) {
        categorizedShifts[category].push(shiftCode);
      }
    }
    
    allScheduleDays.push({
      date: currentDayDate,
      dayOfWeek: currentDayDate.getDay(), // 0 = Sunday, 6 = Saturday
      shiftCode: shiftCode,
      isDayOff: shiftCode === DAY_OFF_CODE,
      category: categorizeShift(shiftCode, shiftCodes, schedule)
    });
    
    tempDate = addDays(tempDate, 1);
  }
  
  // Organize schedule days into weekends
  const weekends = [];
  let currentWeekend = [];
  
  for (let i = 0; i < allScheduleDays.length; i++) {
    const day = allScheduleDays[i];
    
    // Count shift types based on proper categorization
    if (!day.isDayOff) {
      const category = day.category;
      
      if (category === "Days") {
        daysShifts++;
      } else if (category === "Afternoons") {
        afternoonsShifts++;
      } else if (category === "Mid Days") {
        midDaysShifts++;
      } else if (category === "Late Days") {
        lateDaysShifts++;
      } else if (category === "Midnights") {
        midnightsShifts++;
      }
    }
    
    // Track consecutive work days for blocks
    if (!day.isDayOff) {
      if (previousDayWasWorkDay) {
        consecutiveWorkDays++;
      } else {
        consecutiveWorkDays = 1;
      }
      previousDayWasWorkDay = true;
    } else {
      // Check if we just completed a block
      if (consecutiveWorkDays === 5) {
        blocks5day++;
      } else if (consecutiveWorkDays === 4) {
        blocks4day++;
      }
      consecutiveWorkDays = 0;
      previousDayWasWorkDay = false;
    }
    
    // Weekend tracking (Saturday = 6, Sunday = 0)
    if (day.dayOfWeek === 6 || day.dayOfWeek === 0) { // Saturday or Sunday
      currentWeekend.push(day);
      
      // If this is a Sunday, process the complete weekend
      if (day.dayOfWeek === 0) {
        if (currentWeekend.length > 0) {
          weekends.push([...currentWeekend]);
          currentWeekend = [];
        }
      }
    } else if (currentWeekend.length > 0) {
      // If we have partial weekend data but moved past Sunday, reset
      currentWeekend = [];
    }
  }
  
  // Check one more time for a work block at the end
  if (consecutiveWorkDays === 5) {
    blocks5day++;
  } else if (consecutiveWorkDays === 4) {
    blocks4day++;
  }
  
  // Process all collected weekends
  totalWeekends = weekends.length;
  
  for (const weekend of weekends) {
    const saturday = weekend.find(d => d.dayOfWeek === 6);
    const sunday = weekend.find(d => d.dayOfWeek === 0);
    
    if (saturday && sunday) {
      // Count the full weekend status
      if (!saturday.isDayOff) saturdaysOn++;
      if (!sunday.isDayOff) sundaysOn++;
      
      // More accurately count weekend patterns
      if (!saturday.isDayOff && !sunday.isDayOff) {
        // Both days working = full weekend on
        weekendsOn++;
      } else if (!saturday.isDayOff && sunday.isDayOff) {
        // Only Saturday working
        saturdaysOnly++;
      } else if (saturday.isDayOff && !sunday.isDayOff) {
        // Only Sunday working
        sundaysOnly++;
      }
    }
  }
  
  // Process through all months
  while (currentDate <= lastMonthDate) {
    // Check if we're in a new month
    if (currentMonth === null || currentDate.getMonth() !== currentMonth || currentDate.getFullYear() !== currentYear) {
      if (currentMonth !== null) {
        // Complete and push the previous month
        months.push({
          name: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' }),
          days: daysInMonth
        });
      }
      
      // Start a new month
      currentMonth = currentDate.getMonth();
      currentYear = currentDate.getFullYear();
      daysInMonth = [];
      
      // Create all days for this month
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      // Add padding days for start of month (Mon-Sun where Mon is first day)
      const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      
      for (let i = 0; i < paddingDays; i++) {
        daysInMonth.push({ type: 'padding' });
      }
      
      // Add all days of the month
      for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const dayDate = new Date(currentYear, currentMonth, day);
        const isInSchedulePeriod = dayDate >= startDate && dayDate <= endDate;
        
        // If the day is within our scheduling period, get the shift
        let shiftCode = DAY_OFF_CODE;
        let shiftTime = "";
        
        if (isInSchedulePeriod) {
          // Calculate day in cycle
          const daysFromStart = Math.floor((dayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const dayInCycle = ((daysFromStart % daysPerCycle) + 1);
          shiftCode = cycleDayPattern[dayInCycle] || DAY_OFF_CODE;
          
          // Extract shift time if it's a work day
          if (shiftCode !== DAY_OFF_CODE) {
            shiftTime = extractShiftTimeFromCode(shiftCode, shiftCodes, schedule);
            
            // Count shifts
            totalShifts++;
            shiftCounts[shiftCode] = (shiftCounts[shiftCode] || 0) + 1;
          } else {
            totalDaysOff++;
          }
        }
        
        daysInMonth.push({
          type: 'day',
          date: new Date(dayDate),
          dayOfMonth: day,
          dayOfWeek: dayDate.getDay(),
          isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
          shiftCode: shiftCode,
          shortCode: getShortCode(shiftCode),
          shiftTime: shiftTime,
          isSelected: selectedShiftCodes.includes(shiftCode),
          isDayOff: shiftCode === DAY_OFF_CODE,
          isInSchedule: isInSchedulePeriod,
          category: categorizeShift(shiftCode, shiftCodes, schedule),
          isPast: isPastDay(dayDate),
          isToday: isToday(dayDate)
        });
      }
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  // Add the last month
  if (currentMonth !== null) {
    months.push({
      name: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' }),
      days: daysInMonth
    });
  }
  
  // Store the calculated stats with corrected weekend counts
  const calculatedStats: CalculatedStats = {
    weekendsOn,
    totalWeekends,
    saturdaysOn,
    sundaysOn,
    saturdaysOnly,
    sundaysOnly,
    blocks5day,
    blocks4day,
    daysShifts,
    afternoonsShifts,
    midDaysShifts, 
    lateDaysShifts,
    midnightsShifts
  };
  
  const calendarData: CalendarData = {
    months,
    shiftStats: {
      shiftCounts,
      totalShifts,
      totalDaysOff
    }
  };
  
  return { calendarData, calculatedStats };
}
