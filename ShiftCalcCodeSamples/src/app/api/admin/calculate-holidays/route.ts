import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { PrismaClient } from '@prisma/client';
import Holidays from 'date-holidays';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Cache instances of the holiday calculator for performance
const holidayInstances: { [key: string]: any } = {};

// Get or create a holiday calculator instance
function getHolidayInstance(province: string | null = null) {
  const key = province || 'federal';
  if (!holidayInstances[key]) {
    const regionCode = province ? `CA-${province}` : 'CA';
    holidayInstances[key] = new Holidays(regionCode);
  }
  return holidayInstances[key];
}

// Get holidays for a year
function getHolidaysForYear(year: number, province: string | null = null) {
  const hd = getHolidayInstance(province);
  const holidays = hd.getHolidays(year);
  
  // Include all holidays (both statutory and observances)
  return holidays.map((holiday: any) => {
    const formattedDate = holiday.date.split(' ')[0];
    return {
      ...holiday,
      date: formattedDate
    };
  });
}

// Generate shifts for a schedule
function generateShiftsForSchedule(schedule: any, startDateStr: string, numCycles: number) {
  console.log("🚀 generateShiftsForSchedule called with:", { startDateStr, numCycles });
  
  if (!schedule) {
    console.log("❌ No schedule provided");
    return [];
  }
  
  const [yearStr, monthStr, dayStr] = startDateStr.split('-');
  console.log("📅 Date parts:", { yearStr, monthStr, dayStr });
  
  const startDate = new Date(
    parseInt(yearStr),
    parseInt(monthStr) - 1,
    parseInt(dayStr)
  );
  console.log("📆 Generated start date:", startDate.toISOString(), "Year:", startDate.getFullYear());
  
  // Find day columns
  const dayColumns = Object.keys(schedule)
    .filter(key => /^DAY_\d{3}$/.test(key))
    .sort((a, b) => {
      const numA = parseInt(a.replace('DAY_', ''));
      const numB = parseInt(b.replace('DAY_', ''));
      return numA - numB;
    });
  
  const daysPerCycle = dayColumns.length;
  if (daysPerCycle === 0) {
    return [];
  }
  
  // Generate shifts for the actual schedule period
  const shifts = [];
  const totalDays = daysPerCycle * numCycles;
  
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dayIndex);
    
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

// Get settings from the database
async function getSettings() {
  console.log("🔍 getSettings() called");
  try {
    // Get settings from database
    const settings = await prisma.$queryRaw`
      SELECT setting_value FROM system_settings WHERE setting_key = 'app_settings'
    ` as any[];
    
    console.log("📊 Raw settings query result:", settings);
    
    if (settings && settings.length > 0 && settings[0].setting_value) {
      const rawValue = settings[0].setting_value;
      console.log("📝 Raw setting_value:", rawValue, "Type:", typeof rawValue);
      
      const settingValue = typeof rawValue === 'string' 
        ? JSON.parse(rawValue) 
        : rawValue;
      console.log("✅ Parsed settingValue:", settingValue);
      
      if (!settingValue.startDate || !settingValue.numCycles) {
        throw new Error('Invalid admin settings: startDate and numCycles are required');
      }
      
      const result = {
        startDate: settingValue.startDate,
        numCycles: settingValue.numCycles,
        province: settingValue.province || null
      };
      console.log("🎯 Final getSettings result:", result);
      return result;
    }
  } catch (error) {
    console.error("❌ Error reading settings from database:", error);
    throw error;
  }
  
  // No fallback - admin must configure settings
  throw new Error('No admin settings found. Please configure start date and number of cycles in Admin Settings before calculating holidays.');
}

// Calculate and store holiday data for a schedule
async function calculateAndStoreHolidayData(scheduleId: number, settings: any) {
  try {
    // Get schedule using raw SQL
    const scheduleResults = await prisma.$queryRaw`
      SELECT * FROM schedules WHERE id = ${scheduleId}
    ` as any[];
    
    if (!scheduleResults || scheduleResults.length === 0) {
      return 0;
    }
    
    const schedule = scheduleResults[0];
    
    // Generate shifts
    console.log(`CRITICAL DEBUG - About to generate shifts for schedule ${scheduleId} with:`, {
      startDate: settings.startDate,
      numCycles: settings.numCycles,
      settingsObject: settings
    });
    const shifts = generateShiftsForSchedule(schedule, settings.startDate, settings.numCycles);
    
    // Get years from shifts
    const years = new Set<number>();
    shifts.forEach(shift => {
      if (shift.date) {
        const year = new Date(shift.date).getFullYear();
        years.add(year);
      }
    });
    
    // Only get holidays for years that actually have shifts
    // The years set is already populated from the actual shift dates
    
    console.log(`DEBUG: Settings used for shift generation:`, settings);
    console.log(`DEBUG: Schedule shifts date range:`, { 
      firstShift: shifts[0]?.date, 
      lastShift: shifts[shifts.length - 1]?.date,
      totalShifts: shifts.length 
    });
    console.log(`Getting holidays for years: ${Array.from(years).sort().join(', ')}`);
    
    // Get holidays for all years
    let allHolidays: any[] = [];
    years.forEach(year => {
      const holidays = getHolidaysForYear(year, settings.province);
      console.log(`Found ${holidays.length} holidays for ${year}`);
      allHolidays = [...allHolidays, ...holidays];
    });
    
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
        holidaysWorked.push({
          date: shift.date,
          name: matchingHoliday.name,
          shiftCode: shift.code
        });
      }
    }
    
    console.log(`Schedule ${scheduleId}: Found ${holidaysWorked.length} holidays worked`);
    if (holidaysWorked.length > 0) {
      console.log(`First holiday: ${holidaysWorked[0].date} - ${holidaysWorked[0].name}`);
      console.log(`Last holiday: ${holidaysWorked[holidaysWorked.length - 1].date} - ${holidaysWorked[holidaysWorked.length - 1].name}`);
    }
    
    // Store in database using raw SQL
    const holidaysData = JSON.stringify(holidaysWorked);
    await prisma.$executeRaw`
      UPDATE schedules 
      SET holidays_on = ${holidaysWorked.length}, 
          holidays_data = ${holidaysData}
      WHERE id = ${scheduleId}
    `;
    
    return holidaysWorked.length;
  } catch (error) {
    console.error(`Error calculating holiday data for schedule ${scheduleId}:`, error);
    return 0;
  }
}

// Process all schedules
async function calculateHolidaysForAllSchedules() {
  try {
    console.log("🏁 calculateHolidaysForAllSchedules started");
    
    // Get settings
    const settings = await getSettings();
    console.log("⚙️ Settings for calculation:", settings);
    
    // Get all schedules using raw SQL
    const schedules = await prisma.$queryRaw`
      SELECT id FROM schedules
    ` as any[];
    console.log(`📋 Found ${schedules.length} schedules to process`);
    
    let processed = 0;
    let successful = 0;
    
    // Process each schedule
    for (const schedule of schedules) {
      processed++;
      
      try {
        const holidaysCount = await calculateAndStoreHolidayData(schedule.id, settings);
        
        if (holidaysCount >= 0) {
          successful++;
        }
      } catch (error) {
        console.error(`Error processing schedule ${schedule.id}:`, error);
      }
    }
    
    return { processed, successful };
  } catch (error) {
    console.error("Error calculating holidays for all schedules:", error);
    return { processed: 0, successful: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  console.log("POST /api/admin/calculate-holidays - Starting request");
  
  try {
    // Set proper headers for JSON response
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      console.log("Unauthorized holiday calculation attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    console.log("Starting holiday calculation for all schedules...");
    
    const result = await calculateHolidaysForAllSchedules();
    
    console.log(`Holiday calculation complete. Processed ${result.processed} schedules, ${result.successful} successful.`);
    
    return NextResponse.json({
      success: true,
      message: `Holiday calculation complete. Processed ${result.processed} schedules, ${result.successful} successful.`,
      result
    }, { headers });
  } catch (error) {
    console.error("Error in holiday calculation:", error);
    return NextResponse.json(
      { 
        error: "Failed to calculate holidays", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500, headers }
    );
  }
}