// src/app/api/whos-working/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db/prisma";
import { format, getDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface ShiftCode {
  CODE: string;
  BEGIN: string;
  END: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const operationsParam = searchParams.get('operations');
    
    if (!operationsParam) {
      return NextResponse.json({ error: "Operations required" }, { status: 400 });
    }
    
    // Parse comma-separated operations
    const operations = operationsParam.split(',').map(op => op.trim()).filter(Boolean);

    // Get current date and time in Eastern timezone
    const timeZone = 'America/Toronto';
    const now = new Date();
    const easternNow = toZonedTime(now, timeZone);
    const currentTime = format(easternNow, 'HH:mm');
    
    // Get system settings for cycle calculation
    const settings = await prisma.$queryRaw`
      SELECT setting_value FROM system_settings WHERE setting_key = 'app_settings'
    ` as any[];
    
    console.log('Raw settings from DB:', settings);
    
    let systemSettings = {
      startDate: '2024-05-27',
      numCycles: 10
    };
    
    if (settings[0]?.setting_value) {
      // Parse the JSON string from the database
      try {
        systemSettings = typeof settings[0].setting_value === 'string' 
          ? JSON.parse(settings[0].setting_value)
          : settings[0].setting_value;
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    
    console.log('Using settings:', systemSettings);

    // Calculate current day in the 56-day cycle using Eastern time
    // IMPORTANT: For shift scheduling, the "day" changes at 6 AM, not midnight
    // This prevents showing people as working on the wrong day during night shifts
    const SHIFT_DAY_CUTOFF_HOUR = 6; // 6 AM
    
    // Adjust the current time - if before 6 AM, consider it the previous day
    let shiftDay = new Date(easternNow);
    const currentHour = easternNow.getHours();
    if (currentHour < SHIFT_DAY_CUTOFF_HOUR) {
      // Before 6 AM, subtract one day
      shiftDay.setDate(shiftDay.getDate() - 1);
    }
    
    // Use the date string directly to avoid timezone conversion issues
    const startDate = new Date(systemSettings.startDate + 'T00:00:00');
    const shiftDayDateOnly = format(shiftDay, 'yyyy-MM-dd');
    const shiftDayEastern = new Date(shiftDayDateOnly + 'T00:00:00');
    
    // Calculate days between dates
    const daysSinceStart = Math.floor((shiftDayEastern.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentDayInCycle = (daysSinceStart % 56) + 1;
    const dayColumn = `DAY_${currentDayInCycle.toString().padStart(3, '0')}`;

    console.log('Debug - timezone calculation:');
    console.log(`  UTC now: ${now.toISOString()}`);
    console.log(`  Eastern now: ${format(easternNow, 'yyyy-MM-dd HH:mm:ss')}`);
    console.log(`  Current hour: ${currentHour}`);
    console.log(`  Shift day (6AM cutoff): ${shiftDayDateOnly}`);
    console.log(`  Start date: ${systemSettings.startDate}`);
    console.log(`  Days since start: ${daysSinceStart}`);
    console.log(`  Current day in cycle: ${currentDayInCycle}, Column: ${dayColumn}`);

    // Get all shift codes to determine current shift
    const shiftCodes = await prisma.$queryRaw`
      SELECT CODE, 
             TIME_FORMAT(BEGIN, '%H:%i') as BEGIN,
             TIME_FORMAT(END, '%H:%i') as END
      FROM shift_codes
      WHERE CODE != '----'
    ` as ShiftCode[];

    // Get schedules for multiple operations with employee names
    // Use $queryRawUnsafe for dynamic column names
    const placeholders = operations.map(() => '?').join(',');
    const schedules = await prisma.$queryRawUnsafe(`
      SELECT 
        \`GROUP\` as operation,
        LINE,
        employee_name,
        ${dayColumn} as current_shift_code
      FROM schedules
      WHERE \`GROUP\` IN (${placeholders})
      AND employee_name IS NOT NULL
      ORDER BY \`GROUP\`, CAST(LINE AS UNSIGNED)
    `, ...operations) as any[];
    
    console.log(`Found ${schedules.length} employees for operations: ${operations.join(', ')}`);
    const langlois = schedules.find(s => s.employee_name?.toLowerCase().includes('langlois'));
    if (langlois) {
      console.log('Found Langlois:', langlois);
    }

    // Separate into currently working, coming next, and just finished
    const currentlyWorking = [];
    const comingNext = [];
    const justFinished = [];
    const onDayOff = [];

    for (const schedule of schedules) {
      const shiftCode = schedule.current_shift_code;
      
      if (!shiftCode || shiftCode === '----') {
        onDayOff.push({
          operation: schedule.operation,
          line: schedule.LINE,
          name: schedule.employee_name,
          shift: 'Day Off'
        });
        continue;
      }

      const shift = shiftCodes.find(s => s.CODE === shiftCode);
      if (!shift) continue;

      const beginTime = shift.BEGIN;
      const endTime = shift.END;
      
      // Handle overnight shifts
      const isOvernightShift = endTime < beginTime;
      
      // Categorize the worker based on their shift times
      let isCurrentlyWorking = false;
      let isComingNext = false;
      let isJustFinished = false;

      // Check if currently working
      if (isOvernightShift) {
        // For overnight shifts, working if current time is after begin OR before end
        if (currentTime >= beginTime || currentTime < endTime) {
          isCurrentlyWorking = true;
        }
      } else {
        // For regular shifts, working if current time is between begin and end
        if (currentTime >= beginTime && currentTime < endTime) {
          isCurrentlyWorking = true;
        }
      }

      // If currently working, add to that list and skip other checks
      if (isCurrentlyWorking) {
        currentlyWorking.push({
          operation: schedule.operation,
          line: schedule.LINE,
          name: schedule.employee_name,
          shift: shiftCode,
          times: `${beginTime} - ${endTime}`,
          startTime: beginTime,
          endTime: endTime
        });
      } else {
        // Not currently working, check if coming next or just finished
        
        // Check if coming next (starting within next 2 hours)
        const twoHoursFromNow = new Date(easternNow.getTime() + 2 * 60 * 60 * 1000);
        const twoHoursTime = format(twoHoursFromNow, 'HH:mm');
        
        if (currentTime < beginTime && beginTime <= twoHoursTime) {
          isComingNext = true;
          comingNext.push({
            operation: schedule.operation,
            line: schedule.LINE,
            name: schedule.employee_name,
            shift: shiftCode,
            times: `${beginTime} - ${endTime}`,
            startTime: beginTime,
            endTime: endTime
          });
        }
        
        // Check if just finished (ended within last hour and not currently working)
        if (!isComingNext) {
          const oneHourAgo = new Date(easternNow.getTime() - 60 * 60 * 1000);
          const oneHourAgoTime = format(oneHourAgo, 'HH:mm');
          
          // For overnight shifts
          if (isOvernightShift) {
            // If we're past midnight and the shift ended
            if (currentTime < beginTime && currentTime >= endTime && oneHourAgoTime < endTime) {
              isJustFinished = true;
            }
          } else {
            // For regular shifts - ended between one hour ago and now
            if (endTime <= currentTime && endTime > oneHourAgoTime) {
              isJustFinished = true;
            }
          }
          
          if (isJustFinished) {
            justFinished.push({
              operation: schedule.operation,
              line: schedule.LINE,
              name: schedule.employee_name,
              shift: shiftCode,
              times: `${beginTime} - ${endTime}`,
              startTime: beginTime,
              endTime: endTime
            });
          }
        }
      }
    }

    // Sort currently working by operation then end time (ending soonest first)
    currentlyWorking.sort((a, b) => {
      const opCompare = a.operation.localeCompare(b.operation);
      if (opCompare !== 0) return opCompare;
      // Handle overnight shifts
      const aEnd = a.endTime < a.startTime ? `2${a.endTime}` : a.endTime;
      const bEnd = b.endTime < b.startTime ? `2${b.endTime}` : b.endTime;
      return aEnd.localeCompare(bEnd);
    });

    // Sort coming next by operation then start time (starting soonest first)
    comingNext.sort((a, b) => {
      const opCompare = a.operation.localeCompare(b.operation);
      if (opCompare !== 0) return opCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    // Sort just finished by operation then end time (most recent first)
    justFinished.sort((a, b) => {
      const opCompare = a.operation.localeCompare(b.operation);
      if (opCompare !== 0) return opCompare;
      return b.endTime.localeCompare(a.endTime);
    });

    // Sort day off by operation then line number
    onDayOff.sort((a, b) => {
      const opCompare = a.operation.localeCompare(b.operation);
      if (opCompare !== 0) return opCompare;
      return parseInt(a.line) - parseInt(b.line);
    });

    return NextResponse.json({
      operations,
      currentTime,
      dayInCycle: currentDayInCycle,
      currentlyWorking,
      comingNext,
      justFinished,
      onDayOff,
      totalEmployees: schedules.length
    });

  } catch (error) {
    console.error('Error fetching who\'s working:', error);
    return NextResponse.json({ 
      error: "Failed to fetch current workers",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}