// src/utils/scheduleProcessor.js
import prisma from "@/lib/db/prisma";
import { getHolidaysForYear } from './holidayCalculator';
import { getSettingsFromDB } from '@/lib/settings';
import { addDays } from 'date-fns';

// Generate shifts for a schedule (similar to your API endpoint)
export async function generateShiftsForSchedule(schedule) {
  // Get start date and cycle configuration from database
  let startDateStr;
  let numCycles;
  
  try {
    const settings = await getSettingsFromDB();
    startDateStr = settings.startDate;
    numCycles = settings.numCycles || 1;
  } catch (error) {
    console.error("Error getting settings from database:", error);
    throw new Error("Failed to load admin settings. Please configure start date and cycles in Admin Settings before generating schedules.");
  }
  
  const [yearStr, monthStr, dayStr] = startDateStr.split('-');
  const startDate = new Date(
    parseInt(yearStr),
    parseInt(monthStr) - 1,
    parseInt(dayStr)
  );
  
  // Find day columns
  const dayColumns = Object.keys(schedule)
    .filter(key => /^DAY_\d{3}$/i.test(key))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/^DAY_/i, ''));
      const numB = parseInt(b.replace(/^DAY_/i, ''));
      return numA - numB;
    });
  
  const daysPerCycle = dayColumns.length;
  
  // Generate shifts
  const shifts = [];
  const totalDays = daysPerCycle * numCycles;
  
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const currentDate = addDays(startDate, dayIndex);
    
    const dayInCycle = (dayIndex % daysPerCycle) + 1;
    const formattedDayNum = String(dayInCycle).padStart(3, '0');
    const dayKey = `DAY_${formattedDayNum}`;
    
    const shiftCode = schedule[dayKey] || "----";
    
    shifts.push({
      date: currentDate.toISOString().split('T')[0],
      code: shiftCode,
      cycleDay: dayInCycle
    });
  }
  
  return shifts;
}

// Calculate and store holiday data for a schedule
export async function calculateAndStoreHolidayData(scheduleId, province = null) {
  try {
    // Get schedule
    const scheduleResult = await prisma.$queryRaw`
      SELECT * FROM schedules WHERE id = ${parseInt(scheduleId)}
    `;
    
    if (!scheduleResult || scheduleResult.length === 0) {
      console.error(`Schedule ${scheduleId} not found`);
      return 0;
    }
    
    const schedule = scheduleResult[0];
    console.log(`Processing holiday data for schedule ${scheduleId} (Line ${schedule.LINE})`);
    
    // Generate shifts
    const shifts = generateShiftsForSchedule(schedule);
    console.log(`Generated ${shifts.length} shifts for schedule ${scheduleId}`);
    
    // Get years from shifts
    const years = new Set();
    shifts.forEach(shift => {
      if (shift.date) {
        const year = new Date(shift.date).getFullYear();
        years.add(year);
      }
    });
    
    // Get holidays for all years
    let allHolidays = [];
    years.forEach(year => {
      const holidays = getHolidaysForYear(year, province);
      allHolidays = [...allHolidays, ...holidays];
    });
    
    console.log(`Found ${allHolidays.length} holidays for years: ${Array.from(years).join(', ')}`);
    
    // Find holidays with shifts
    const holidaysWorked = [];
    for (const shift of shifts) {
      // Skip days off
      if (shift.code === "----") continue;
      
      // Check if shift date matches a holiday
      const matchingHoliday = allHolidays.find(holiday => 
        holiday.date === shift.date
      );
      
      if (matchingHoliday) {
        console.log(`Found holiday on ${shift.date}: ${matchingHoliday.name} (Shift: ${shift.code})`);
        
        holidaysWorked.push({
          date: shift.date,
          name: matchingHoliday.name,
          shiftCode: shift.code
        });
      }
    }
    
    console.log(`Schedule ${scheduleId} has ${holidaysWorked.length} holidays worked`);
    
    // Store in database - using JSON.stringify for the holidays_data
    await prisma.$executeRaw`
      UPDATE schedules 
      SET 
        holidays_on = ${holidaysWorked.length},
        holidays_data = ${JSON.stringify(holidaysWorked)},
        updated_at = NOW()
      WHERE id = ${scheduleId}
    `;
    
    return holidaysWorked.length;
  } catch (error) {
    console.error(`Error calculating holiday data for schedule ${scheduleId}:`, error);
    return 0;
  }
}

// Process all schedules
export async function calculateHolidaysForAllSchedules(province = null) {
  try {
    // Get all schedule IDs
    const schedules = await prisma.$queryRaw`SELECT id FROM schedules`;
    console.log(`Found ${schedules.length} schedules to process`);
    
    let processed = 0;
    let successful = 0;
    
    // Process each schedule
    for (const schedule of schedules) {
      processed++;
      console.log(`Processing schedule ${processed}/${schedules.length} (ID: ${schedule.id})`);
      
      try {
        const holidaysCount = await calculateAndStoreHolidayData(schedule.id, province);
        
        if (holidaysCount >= 0) {
          successful++;
        }
      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
      }
    }
    
    console.log(`Completed holiday calculation for ${successful}/${processed} schedules`);
    return { processed, successful };
  } catch (error) {
    console.error("Error calculating holidays for all schedules:", error);
    return { processed: 0, successful: 0 };
  }
}