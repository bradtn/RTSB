// src/app/api/schedules/[id]/ical/route.js
import { NextResponse } from 'next/server';
import mysql from "mysql2/promise";

export async function GET(request, { params }) {
  const { id } = await params;
  console.log(`🔍 iCal API called for schedule ID: ${id}`);
  
  let connection;
  
  try {
    // Connect to database using the DATABASE_URL from .env
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // 1. Get the schedule data
    const [scheduleRows] = await connection.execute(
      'SELECT * FROM schedules WHERE id = ?',
      [id]
    );
    
    if (scheduleRows.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Schedule not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const schedule = scheduleRows[0];
    
    // 2. Get all the shift codes data for reference
    const [shiftCodesRows] = await connection.execute('SELECT * FROM shift_codes');
    
    // Create a map for quick lookup of shift codes by CODE
    const shiftCodeMap = {};
    shiftCodesRows.forEach(code => {
      // Directly parse the time strings to get hours and minutes
      let beginHours = 0, beginMinutes = 0;
      let endHours = 0, endMinutes = 0;
      
      if (code.BEGIN) {
        const beginParts = code.BEGIN.toString().split(':');
        if (beginParts.length >= 2) {
          beginHours = parseInt(beginParts[0], 10);
          beginMinutes = parseInt(beginParts[1], 10);
        }
      }
      
      if (code.END) {
        const endParts = code.END.toString().split(':');
        if (endParts.length >= 2) {
          endHours = parseInt(endParts[0], 10);
          endMinutes = parseInt(endParts[1], 10);
        }
      }
      
      shiftCodeMap[code.CODE] = {
        beginHours,
        beginMinutes,
        endHours,
        endMinutes,
        description: code.DESCRIPTION
      };
    });
    
    // 3. Get system settings for schedule start date and cycles
    const [settingsRows] = await connection.execute('SELECT * FROM system_settings');
    
    // Find settings for start date and number of cycles
    let startDateStr = '2025-04-24'; // Default fallback
    let cycleCount = 3; // Default fallback
    
    // Check if settingsRows is an array and has items
    if (Array.isArray(settingsRows) && settingsRows.length > 0) {
      // Look for app_settings which contains the admin-configured values
      const appSettings = settingsRows.find(setting => setting.setting_key === 'app_settings');
      if (appSettings && appSettings.setting_value) {
        try {
          const settings = typeof appSettings.setting_value === 'string' 
            ? JSON.parse(appSettings.setting_value) 
            : appSettings.setting_value;
          
          if (settings.startDate) {
            startDateStr = settings.startDate;
            console.log(`✅ Found start date from app_settings: ${startDateStr}`);
          }
          if (settings.numCycles) {
            cycleCount = settings.numCycles;
            console.log(`✅ Found cycle count from app_settings: ${cycleCount}`);
          }
        } catch (e) {
          console.error("Error parsing app_settings:", e);
        }
      }
      
      // Fallback: Check schedule_holidays if app_settings not found
      const scheduleHolidays = settingsRows.find(setting => setting.setting_key === 'schedule_holidays');
      if (!appSettings && scheduleHolidays && scheduleHolidays.setting_value) {
        try {
          const holidayData = JSON.parse(scheduleHolidays.setting_value);
          if (holidayData.calculated_with) {
            if (holidayData.calculated_with.startDate) {
              startDateStr = holidayData.calculated_with.startDate;
              console.log(`✅ Found start date from schedule_holidays: ${startDateStr}`);
            }
            if (holidayData.calculated_with.numCycles) {
              cycleCount = holidayData.calculated_with.numCycles;
              console.log(`✅ Found cycle count from schedule_holidays: ${cycleCount}`);
            }
          }
        } catch (e) {
          console.error("Error parsing schedule_holidays:", e);
        }
      }
    }
    
    console.log(`Using schedule start date: ${startDateStr}, cycles: ${cycleCount}`);
    
    // Parse start date
    const startDate = new Date(startDateStr);
    
    // 4. Generate iCal content with proper cycle count
    const icalContent = generateICalContent(
      schedule, 
      shiftCodeMap,
      startDate,
      cycleCount
    );
    
    // 5. Return as downloadable file with professional naming convention
    const startDateFormatted = startDateStr.replace(/-/g, ''); // YYYYMMDD format
    const groupName = schedule.GROUP ? schedule.GROUP.replace(/\s+/g, '') : 'NoGroup';
    const fileName = `${groupName}_Line${schedule.LINE}_Schedule_${startDateFormatted}.ics`;
    
    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar;charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("❌ Error generating iCal file:", error);
    return new NextResponse(JSON.stringify({ 
      error: 'Failed to generate iCal file', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error("Error closing database connection:", e);
      }
    }
  }
}

function generateICalContent(schedule, shiftCodeMap, startDate, cycleCount) {
  const now = new Date();
  const timestamp = formatICalDate(now);
  
  // Start building the iCal content
  let icalContent = `BEGIN:VCALENDAR
PRODID:-//ShiftBid//Shift Bid Calc//EN
VERSION:2.0`;

  // Process multiple cycles
  for (let cycle = 0; cycle < cycleCount; cycle++) {
    console.log(`Generating cycle ${cycle + 1} of ${cycleCount}`);
    
    // Process each day field (DAY_001 through DAY_056)
    for (let day = 1; day <= 56; day++) {
      const dayKey = `DAY_${day.toString().padStart(3, '0')}`;
      const shiftCode = schedule[dayKey];
      
      // Skip days off with specific values (O, X, ----) or null/undefined values
      if (shiftCode === 'X' || shiftCode === 'O' || shiftCode === '----' || !shiftCode) {
        continue;
      }
      
      // Calculate the date for this day, accounting for the cycle offset
      // Subtract 1 from day since DAY_001 should be day 0 (the start date itself)
      const currentDay = cycle * 56 + (day - 1);
      const shiftDate = new Date(startDate);
      // Use the correct date calculation 
      shiftDate.setDate(startDate.getDate() + currentDay);
      
      // Get the shift details from the code map
      // For non-standard codes, we'll use the default if not found
      const shiftDetails = shiftCodeMap[shiftCode] || {
        beginHours: 14, beginMinutes: 30, endHours: 1, endMinutes: 0
      };
      
      // Get the year, month, day for the current date
      const year = shiftDate.getFullYear();
      const month = (shiftDate.getMonth() + 1).toString().padStart(2, '0');
      const dayOfMonth = shiftDate.getDate().toString().padStart(2, '0');
      
      // Create start time string directly - YYYYMMDDTHHMMSS
      let startHours = shiftDetails.beginHours.toString().padStart(2, '0');
      let startMinutes = shiftDetails.beginMinutes.toString().padStart(2, '0');
      const startTimeStr = `${year}${month}${dayOfMonth}T${startHours}${startMinutes}00`;
      
      // Create end time string, handling overnight shifts
      let endYear = year;
      let endMonth = month;
      let endDay = dayOfMonth;
      
      // If end time is earlier than start time, it's the next day
      if (shiftDetails.endHours < shiftDetails.beginHours || 
          (shiftDetails.endHours === shiftDetails.beginHours && 
           shiftDetails.endMinutes < shiftDetails.beginMinutes)) {
        const nextDay = new Date(shiftDate);
        nextDay.setDate(shiftDate.getDate() + 1);
        endYear = nextDay.getFullYear();
        endMonth = (nextDay.getMonth() + 1).toString().padStart(2, '0');
        endDay = nextDay.getDate().toString().padStart(2, '0');
      }
      
      let endHoursStr = shiftDetails.endHours.toString().padStart(2, '0');
      let endMinutesStr = shiftDetails.endMinutes.toString().padStart(2, '0');
      const endTimeStr = `${endYear}${endMonth}${endDay}T${endHoursStr}${endMinutesStr}00`;
      
      // For debugging the first and last event of each cycle
      if (day === 1 || day === 56) {
        console.log(`Cycle ${cycle+1}, Day ${day}: ${year}-${month}-${dayOfMonth}, Shift ${shiftCode}, ` +
                    `Time ${startHours}:${startMinutes} to ${endHoursStr}:${endMinutesStr}`);
      }
      
      // Create an event with only the essential information - removed redundant DESCRIPTION
      icalContent += `
BEGIN:VEVENT
DTSTAMP:${timestamp}
UID:${timestamp}CYCLE${cycle}DAY${day}@shiftbid
DTSTART;TZID=America/Detroit:${startTimeStr}
DTEND;TZID=America/Detroit:${endTimeStr}
CATEGORIES:@Work
SUMMARY:${shiftCode}
END:VEVENT`;
    }
  }
  
  // Close the calendar
  icalContent += `
END:VCALENDAR`;

  return icalContent;
}

function formatICalDate(date) {
  // Format without using toISOString to avoid timezone conversion
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}