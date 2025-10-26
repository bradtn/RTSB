// src/app/api/schedules/[id]/ical/route.js
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres'; // Replace with your DB connection method

export async function GET(request, { params }) {
  const { id } = params;
  
  try {
    // 1. Get the schedule data
    const scheduleResult = await sql`
      SELECT * FROM schedules WHERE id = ${id}
    `;
    
    // 2. Get system settings for schedule start date and cycles
    const settingsResult = await sql`
      SELECT * FROM system_settings WHERE name IN ('schedule_start_date', 'schedule_cycles')
    `;
    
    if (!scheduleResult.rows || scheduleResult.rows.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Schedule not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const schedule = scheduleResult.rows[0];
    
    // Parse settings
    let startDateStr = '2025-04-24'; // Default
    let cycles = 1; // Default to 1 cycle
    
    settingsResult.rows.forEach(setting => {
      if (setting.name === 'schedule_start_date') {
        startDateStr = setting.value;
      }
      if (setting.name === 'schedule_cycles') {
        cycles = parseInt(setting.value, 10) || 1;
      }
    });
    
    // Parse the start date
    const startDate = new Date(startDateStr);
    
    // 3. Get all shift codes for reference
    const shiftCodesResult = await sql`
      SELECT * FROM shift_codes
    `;
    
    const shiftCodes = shiftCodesResult.rows;
    
    // Create a map for quick lookup of shift code details
    const shiftCodeMap = {};
    shiftCodes.forEach(code => {
      shiftCodeMap[code.CODE] = {
        begin: code.BEGIN,
        end: code.END,
        description: code.DESCRIPTION
      };
    });
    
    // 4. Generate the iCal content
    const icsContent = generateICSContent(schedule, shiftCodeMap, startDate, cycles);
    
    // 5. Return as downloadable file
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar;charset=utf-8',
        'Content-Disposition': `attachment; filename="schedule-${schedule.LINE}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating iCal file:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate iCal file', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function generateICSContent(schedule, shiftCodeMap, startDate, cycles) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Start building the iCal content
  let icalContent = `BEGIN:VCALENDAR
PRODID:-//ShiftCalc//Shift Bid System//EN
VERSION:2.0`;

  // For each cycle
  for (let cycle = 0; cycle < cycles; cycle++) {
    // For each day in the 56-day period
    for (let day = 1; day <= 56; day++) {
      const dayKey = `DAY_${day.toString().padStart(3, '0')}`;
      const shiftCode = schedule[dayKey];
      
      // Skip if no shift code for this day or if it's a day off
      if (!shiftCode || shiftCode === '' || shiftCode === 'X' || shiftCode === 'O') {
        continue;
      }
      
      // Calculate the date for this day
      // Current cycle offset + day index - 1 (since we start at day 1)
      const dayOffset = (cycle * 56) + (day - 1);
      const shiftDate = new Date(startDate);
      shiftDate.setDate(startDate.getDate() + dayOffset);
      
      // Get shift details from the map
      const shiftDetails = shiftCodeMap[shiftCode];
      
      // Skip if shift code not found
      if (!shiftDetails) {
        console.warn(`Shift code ${shiftCode} not found in reference data`);
        continue;
      }
      
      // Format start and end times
      const startTime = new Date(shiftDate);
      const [startHour, startMinute] = shiftDetails.begin.split(':');
      startTime.setHours(parseInt(startHour, 10), parseInt(startMinute, 10), 0);
      
      const endTime = new Date(shiftDate);
      const [endHour, endMinute] = shiftDetails.end.split(':');
      endTime.setHours(parseInt(endHour, 10), parseInt(endMinute, 10), 0);
      
      // Handle overnight shifts
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }
      
      const formattedStartTime = formatDate(startTime);
      const formattedEndTime = formatDate(endTime);
      
      icalContent += `
BEGIN:VEVENT
DTSTAMP:${timestamp}
UID:${timestamp}CYCLE${cycle}DAY${day}@shiftcalc
DTSTART;TZID=America/Detroit:${formattedStartTime}
DTEND;TZID=America/Detroit:${formattedEndTime}
CATEGORIES:@Work
SUMMARY:Line ${schedule.LINE} - ${shiftCode}
DESCRIPTION:${shiftDetails.description || ''}
END:VEVENT`;
    }
  }
  
  // Close the calendar
  icalContent += `
END:VCALENDAR`;

  return icalContent;
}

function formatDate(date) {
  return date.toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0];
}