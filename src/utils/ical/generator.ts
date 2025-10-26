// src/utils/ical/generator.ts
"use client";

interface ShiftEvent {
  date: Date;
  shiftCode: string;
  startTime: string;
  endTime: string;
  isHoliday?: boolean;
  holidayName?: string;
}

interface ScheduleData {
  scheduleShifts: Array<{
    dayNumber: number;
    shiftCode?: {
      code: string;
      beginTime: string;
      endTime: string;
      category: string;
      hoursLength: number;
    } | null;
  }>;
}

interface BidPeriod {
  startDate: Date;
  endDate: Date;
  numCycles?: number;
}

interface BidLine {
  id: string;
  lineNumber: string;
  operation?: {
    name: string;
  };
}

/**
 * Generate an iCal file from schedule data
 */
export function generateICalFile(
  schedule: ScheduleData,
  bidPeriod: BidPeriod,
  bidLine: BidLine
): string {
  const now = new Date();
  const timestamp = formatICalDate(now);
  
  // Start building the iCal content
  let icalContent = `BEGIN:VCALENDAR
PRODID:-//ShiftBid//Shift Bidding System//EN
VERSION:2.0`;

  // Create a map of day numbers to shifts
  const shiftMap = new Map<number, any>();
  schedule.scheduleShifts.forEach(shift => {
    shiftMap.set(shift.dayNumber, shift);
  });

  const startDate = bidPeriod.startDate instanceof Date 
    ? bidPeriod.startDate 
    : new Date(bidPeriod.startDate);
    
  const numCycles = bidPeriod.numCycles || 1;
  const totalDays = 56 * numCycles;

  // Process multiple cycles
  for (let cycle = 0; cycle < numCycles; cycle++) {
    // Process each day in the 56-day cycle
    for (let day = 1; day <= 56; day++) {
      const shift = shiftMap.get(day);
      
      // Skip days off (no shift code)
      if (!shift?.shiftCode) {
        continue;
      }

      // Calculate the actual date for this day
      const currentDay = cycle * 56 + (day - 1);
      const shiftDate = new Date(startDate);
      shiftDate.setDate(startDate.getDate() + currentDay);

      // Create start and end times
      const startDateTime = createDateTime(shiftDate, shift.shiftCode.beginTime);
      const endDateTime = createDateTime(shiftDate, shift.shiftCode.endTime);
      
      // Handle overnight shifts (end time next day)
      if (isOvernightShift(shift.shiftCode.beginTime, shift.shiftCode.endTime)) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      // Generate unique event ID
      const eventId = `${timestamp}CYCLE${cycle}DAY${day}@shiftbid`;

      icalContent += `
BEGIN:VEVENT
DTSTAMP:${timestamp}
UID:${eventId}
DTSTART;TZID=America/Detroit:${formatICalDate(startDateTime)}
DTEND;TZID=America/Detroit:${formatICalDate(endDateTime)}
CATEGORIES:@Work
SUMMARY:${shift.shiftCode.code}
DESCRIPTION:${shift.shiftCode.category} - ${shift.shiftCode.beginTime} to ${shift.shiftCode.endTime} (${shift.shiftCode.hoursLength}h)
LOCATION:${bidLine.operation?.name || 'Unknown Operation'}
END:VEVENT`;
    }
  }

  // Close the calendar
  icalContent += `
END:VCALENDAR`;

  return icalContent;
}

/**
 * Create a DateTime object from date and time string
 */
function createDateTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime;
}

/**
 * Check if this is an overnight shift
 */
function isOvernightShift(startTime: string, endTime: string): boolean {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes < startTotalMinutes;
}

/**
 * Format date for iCal (YYYYMMDDTHHMMSS)
 */
function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Download iCal file
 */
export function downloadICalFile(
  schedule: ScheduleData,
  bidPeriod: BidPeriod,
  bidLine: BidLine
): void {
  const icalContent = generateICalFile(schedule, bidPeriod, bidLine);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Generate a descriptive filename
  const operationName = bidLine.operation?.name?.replace(/\s+/g, '') || 'Unknown';
  const startDateStr = bidPeriod.startDate instanceof Date 
    ? bidPeriod.startDate.toISOString().split('T')[0].replace(/-/g, '')
    : new Date(bidPeriod.startDate).toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `${operationName}_Line${bidLine.lineNumber}_Schedule_${startDateStr}.ics`;
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape special characters in iCal text fields
 */
export function escapeICalText(text: string): string {
  if (!text) return "";
  
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}