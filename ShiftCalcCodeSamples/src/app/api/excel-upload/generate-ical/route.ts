import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { format, parse, addDays } from 'date-fns';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

interface ShiftData {
  date: string;
  dayOfWeek: string;
  shiftCode: string;
  shiftTime: string;
  workCenter: string;
}

interface ExcelData {
  name: string;
  period: string;
  shifts: ShiftData[];
}

function parseShiftTime(timeString: string): { begin: string; end: string } | null {
  if (!timeString) return null;
  
  const match = timeString.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
  if (!match) return null;
  
  const [, startHour, startMin, endHour, endMin] = match;
  return {
    begin: `${startHour}:${startMin}`,
    end: `${endHour}:${endMin}`,
  };
}

function formatDateForICal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function createICalEvent(shift: ShiftData, shiftTimes: { begin: string; end: string }): string {
  const date = parse(shift.date, 'yyyy-MM-dd', new Date());
  
  const [beginHour, beginMinute] = shiftTimes.begin.split(':').map(Number);
  const [endHour, endMinute] = shiftTimes.end.split(':').map(Number);
  
  const startDate = new Date(date);
  startDate.setHours(beginHour, beginMinute, 0, 0);
  
  let endDate = new Date(date);
  endDate.setHours(endHour, endMinute, 0, 0);
  
  if (endHour < beginHour || (endHour === beginHour && endMinute < beginMinute)) {
    endDate = addDays(endDate, 1);
  }
  
  const uid = `${shift.date}-${shift.shiftCode}-${Date.now()}@shiftcalc`;
  const dtstamp = formatDateForICal(new Date());
  const dtstart = formatDateForICal(startDate);
  const dtend = formatDateForICal(endDate);
  
  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;TZID=America/Detroit:${dtstart}
DTEND;TZID=America/Detroit:${dtend}
SUMMARY:${shift.shiftCode}
CATEGORIES:@Work
END:VEVENT`;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication using JWT token (same as middleware)
    const token = await getToken({ req: request });
    console.log('Excel generate iCal - token:', token ? 'EXISTS' : 'NULL');
    console.log('Excel generate iCal - user:', token?.username);
    
    if (!token) {
      console.log('Excel generate iCal - No token, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data: ExcelData = await request.json();
    
    const workShifts = data.shifts.filter(
      shift => shift.shiftCode && 
               shift.shiftCode !== 'OFF' && 
               shift.shiftCode !== '*' &&
               shift.shiftCode !== ''
    );
    
    const shiftCodesMap = new Map<string, { begin: string; end: string }>();
    
    // Collect all unique shift codes from the Excel data
    const uniqueShiftCodes = [...new Set(workShifts.map(shift => shift.shiftCode))];
    
    // Check if all shift codes exist in the database
    const existingShiftCodes = await prisma.$queryRaw<Array<{ CODE: string; BEGIN: string; END: string }>>`
      SELECT CODE, BEGIN, END FROM shift_codes WHERE CODE IN (${Prisma.join(uniqueShiftCodes)})
    `;
    
    // Build the shift codes map using Excel times for ALL codes (Excel is king!)
    for (const code of uniqueShiftCodes) {
      // Find a shift with this code to get the time info from Excel
      const sampleShift = workShifts.find(shift => shift.shiftCode === code);
      if (sampleShift && sampleShift.shiftTime) {
        const parsedTime = parseShiftTime(sampleShift.shiftTime);
        if (parsedTime) {
          shiftCodesMap.set(code, parsedTime);
        }
      }
    }
    
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ShiftCalc//Schedule Export//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Work Schedule - ${data.name}
X-WR-CALDESC:Work schedule for ${data.name} (${data.period})
X-WR-TIMEZONE:America/Detroit
BEGIN:VTIMEZONE
TZID:America/Detroit
TZURL:http://tzurl.org/zoneinfo-outlook/America/Detroit
X-LIC-LOCATION:America/Detroit
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
`;

    for (const shift of workShifts) {
      const shiftTimes = shiftCodesMap.get(shift.shiftCode);
      if (shiftTimes) {
        icalContent += createICalEvent(shift, shiftTimes) + '\n';
      }
    }
    
    icalContent += 'END:VCALENDAR';
    
    const headers = new Headers();
    headers.set('Content-Type', 'text/calendar; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="schedule_${data.name.replace(/\s+/g, '_')}.ics"`);
    
    return new NextResponse(icalContent, { headers });
  } catch (error) {
    console.error('Error generating iCal file:', error);
    return NextResponse.json(
      { error: 'Failed to generate iCal file' },
      { status: 500 }
    );
  }
}