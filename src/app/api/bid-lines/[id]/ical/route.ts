// src/app/api/bid-lines/[id]/ical/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  console.log(`🔍 iCal API called for bid line ID: ${id}`);

  try {
    // Get the bid line with all related data
    const bidLine = await prisma.bidLine.findUnique({
      where: { id },
      include: {
        operation: true,
        schedule: {
          include: {
            scheduleShifts: {
              include: {
                shiftCode: true
              },
              orderBy: {
                dayNumber: 'asc'
              }
            }
          }
        },
        bidPeriod: true
      }
    });

    if (!bidLine) {
      return new NextResponse(JSON.stringify({ error: 'Bid line not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!bidLine.schedule || !bidLine.bidPeriod) {
      return new NextResponse(JSON.stringify({ error: 'No schedule or bid period data available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate iCal content
    const icalContent = generateICalContent(bidLine);
    
    // Generate filename
    const operationName = bidLine.operation?.name?.replace(/\s+/g, '') || 'Unknown';
    const startDateStr = bidLine.bidPeriod.startDate.toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `${operationName}_Line${bidLine.lineNumber}_Schedule_${startDateStr}.ics`;
    
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
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function generateICalContent(bidLine: any): string {
  const now = new Date();
  const timestamp = formatICalDate(now);
  
  // Start building the iCal content
  let icalContent = `BEGIN:VCALENDAR
PRODID:-//ShiftBid//Shift Bidding System//EN
VERSION:2.0`;

  const startDate = bidLine.bidPeriod.startDate;
  const numCycles = bidLine.bidPeriod.numCycles || 1;

  // Process multiple cycles
  for (let cycle = 0; cycle < numCycles; cycle++) {
    // Process each schedule shift
    bidLine.schedule.scheduleShifts.forEach((shift: any) => {
      // Skip days off (no shift code)
      if (!shift.shiftCode) {
        return;
      }

      // Calculate the actual date for this shift
      const currentDay = cycle * 56 + (shift.dayNumber - 1);
      const shiftDate = new Date(startDate);
      shiftDate.setDate(startDate.getDate() + currentDay);

      // Create start and end times
      const startDateTime = createDateTime(shiftDate, shift.shiftCode.beginTime);
      const endDateTime = createDateTime(shiftDate, shift.shiftCode.endTime);
      
      // Handle overnight shifts
      if (isOvernightShift(shift.shiftCode.beginTime, shift.shiftCode.endTime)) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      // Generate unique event ID
      const eventId = `${timestamp}CYCLE${cycle}DAY${shift.dayNumber}@shiftbid`;

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
    });
  }

  // Close the calendar
  icalContent += `
END:VCALENDAR`;

  return icalContent;
}

function createDateTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime;
}

function isOvernightShift(startTime: string, endTime: string): boolean {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return endTotalMinutes < startTotalMinutes;
}

function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}