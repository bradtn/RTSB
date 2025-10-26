// src/utils/ical/generator.js
"use client";

// Generate an iCal file from schedule data
export function generateICalFile(schedule) {
  // Start building the iCal content
  let icalContent = `BEGIN:VCALENDAR
PRODID:-//ShiftCalc//Shift Bid System//EN
VERSION:2.0`;

  // Get the current date/time for DTSTAMP
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Get the shifts from the schedule object
  // First try to directly access the schedule data, then try various possible property names
  const shifts = schedule.shifts || 
                schedule.scheduleData || 
                schedule.calendarData ||
                [];
                
  if (Array.isArray(shifts) && shifts.length > 0) {
    // Process normal shifts
    shifts.forEach((shift, index) => {
      const startDate = formatICalDate(shift.startTime);
      const endDate = formatICalDate(shift.endTime);
      
      icalContent += `
BEGIN:VEVENT
DTSTAMP:${timestamp}
UID:${timestamp}ROW${index}@shiftcalc
DTSTART;TZID=America/Detroit:${startDate}
DTEND;TZID=America/Detroit:${endDate}
CATEGORIES:@Work
SUMMARY:${shift.code || "SHIFT"}
END:VEVENT`;
    });
  } else {
    console.log("No shift data found for schedule:", schedule);
  }
  
  // Close the calendar
  icalContent += `
END:VCALENDAR`;

  return icalContent;
}

// Helper function to format dates for iCal
function formatICalDate(dateTime) {
  let date;
  if (typeof dateTime === 'string') {
    date = new Date(dateTime);
  } else if (dateTime instanceof Date) {
    date = dateTime;
  } else {
    date = new Date();
  }
  
  // Format to yyyyMMddTHHmmss
  return date.toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0];
}

// Function to trigger download
export function downloadICalFile(schedule) {
  const icalContent = generateICalFile(schedule);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Generate a descriptive filename
  const fileName = `${schedule.line || schedule.id || 'schedule'}-schedule.ics`;
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Function to fetch and download a schedule
export async function fetchAndDownloadSchedule(scheduleId) {
  try {
    console.log("Fetching schedule data for:", scheduleId);
    
    // Fetch the schedule data
    const response = await fetch(`/api/schedules/${scheduleId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch schedule: ${response.statusText}`);
    }
    
    const schedule = await response.json();
    console.log("Schedule data received:", schedule);
    
    downloadICalFile(schedule);
    
    return true;
  } catch (error) {
    console.error("Error downloading schedule:", error);
    return false;
  }
}