import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDays, isWithinInterval, parseISO, format } from 'date-fns';

interface ShiftPattern {
  dayNumber: number;
  shiftCode?: {
    code: string;
  } | null;
}

// Calculate which days would be working days for a bid line
function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  scheduleShifts: ShiftPattern[],
  numCycles: number
) {
  const workingDays: Date[] = [];
  const cycleLength = scheduleShifts.length;
  
  let currentDate = new Date(startDate);
  let dayIndex = 0;

  while (currentDate <= endDate) {
    const currentDayInCycle = dayIndex % cycleLength;
    const shift = scheduleShifts.find(s => s.dayNumber === currentDayInCycle + 1);
    
    // If there's a shift code for this day, it's a working day
    if (shift?.shiftCode) {
      workingDays.push(new Date(currentDate));
    }
    
    currentDate = addDays(currentDate, 1);
    dayIndex++;
  }

  return workingDays;
}

// Calculate how many requested days off match with working days
function calculateDayOffMatches(
  requestedDaysOff: Date[],
  workingDays: Date[],
  scheduleShifts: ShiftPattern[],
  startDate: Date
): {
  matchingDays: Date[];
  conflictDays: Array<{
    date: Date;
    shiftInfo: {
      code: string;
      beginTime?: string;
      endTime?: string;
    } | null;
  }>;
  matchPercentage: number;
} {
  const matchingDays: Date[] = [];
  const conflictDays: Array<{
    date: Date;
    shiftInfo: {
      code: string;
      beginTime?: string;
      endTime?: string;
    } | null;
  }> = [];
  
  // Find days that are both requested off AND working days (conflicts)
  for (const requestedDay of requestedDaysOff) {
    const isWorkingDay = workingDays.some(
      workDay => format(workDay, 'yyyy-MM-dd') === format(requestedDay, 'yyyy-MM-dd')
    );
    
    if (isWorkingDay) {
      // Calculate which shift this corresponds to
      const daysSinceStart = Math.floor((requestedDay.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const cycleLength = scheduleShifts.length;
      const dayInCycle = (daysSinceStart % cycleLength) + 1;
      
      const shift = scheduleShifts.find(s => s.dayNumber === dayInCycle);
      const shiftInfo = shift?.shiftCode ? {
        code: shift.shiftCode.code,
        // Note: beginTime and endTime are not included in the ShiftPattern interface
        // but are available in the actual data from the database
        ...(shift.shiftCode as any) // Cast to access additional properties
      } : null;
      
      conflictDays.push({
        date: requestedDay,
        shiftInfo
      });
    } else {
      matchingDays.push(requestedDay);
    }
  }
  
  // Calculate percentage of requested days off that DON'T conflict with work
  const matchPercentage = requestedDaysOff.length > 0
    ? Math.round((matchingDays.length / requestedDaysOff.length) * 100)
    : 100;

  return {
    matchingDays,
    conflictDays,
    matchPercentage,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requestBody;
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
      }
      requestBody = JSON.parse(text);
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError, 'Request text:', await request.text());
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { bidLineId } = requestBody;

    // Get user's day-off requests first - return early if none
    const dayOffRequest = await prisma.dayOffRequest.findUnique({
      where: { userId: session.user.id },
    });

    if (!dayOffRequest || dayOffRequest.dates.length === 0) {
      return NextResponse.json({
        matchPercentage: 100,
        hasRequests: false,
        message: 'No day-off requests found',
      });
    }

    // Get bid line with schedule information
    const bidLine = await prisma.bidLine.findUnique({
      where: { id: bidLineId },
      include: {
        schedule: {
          include: {
            scheduleShifts: {
              include: {
                shiftCode: true,
              },
            },
            bidPeriod: true,
          },
        },
        bidPeriod: true,
      },
    });

    if (!bidLine) {
      return NextResponse.json({ error: 'Bid line not found' }, { status: 404 });
    }

    // Get the bid period dates
    const bidPeriod = bidLine.schedule?.bidPeriod || bidLine.bidPeriod;
    if (!bidPeriod) {
      return NextResponse.json({ error: 'No bid period found' }, { status: 400 });
    }

    // Calculate working days for this bid line
    const workingDays = calculateWorkingDays(
      bidPeriod.startDate,
      bidPeriod.endDate,
      bidLine.schedule?.scheduleShifts || [],
      bidPeriod.numCycles
    );

    // Calculate matches
    const matches = calculateDayOffMatches(
      dayOffRequest.dates,
      workingDays,
      bidLine.schedule?.scheduleShifts || [],
      bidPeriod.startDate
    );

    return NextResponse.json({
      hasRequests: true,
      matchPercentage: matches.matchPercentage,
      totalRequestedDaysOff: dayOffRequest.dates.length,
      conflictingDays: matches.conflictDays.length,
      matchingDays: matches.matchingDays.length,
      details: {
        conflictDays: matches.conflictDays.map(conflict => ({
          date: format(conflict.date, 'yyyy-MM-dd'),
          shiftInfo: conflict.shiftInfo
        })),
        matchingDays: matches.matchingDays.map(d => format(d, 'yyyy-MM-dd')),
      },
    });
  } catch (error) {
    console.error('Error calculating day-off matches:', error);
    return NextResponse.json(
      { error: 'Failed to calculate day-off matches' },
      { status: 500 }
    );
  }
}