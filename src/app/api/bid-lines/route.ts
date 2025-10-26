import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const operation = searchParams.get('operation');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';

    const where: any = {};

    if (operation && operation !== 'all') {
      where.operationId = operation;
    }


    if (search) {
      where.OR = [
        { lineNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (favoritesOnly) {
      where.favorites = {
        some: {
          userId: session.user.id,
        },
      };
    }

    const bidLines = await prisma.bidLine.findMany({
      where,
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
            },
            bidPeriod: true
          }
        },
        bidPeriod: true,
        favorites: {
          where: {
            userId: session.user.id,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        // Remove lineNumber sorting here, we'll do natural sort in JS
      ],
    });


    // Natural sort function for line numbers
    const naturalSort = (a: string, b: string): number => {
      return a.localeCompare(b, undefined, { 
        numeric: true, 
        sensitivity: 'base',
        caseFirst: 'upper'
      });
    };

    // Sort bid lines with natural sorting for line numbers
    const sortedBidLines = bidLines.sort((a, b) => {
      // First sort by status (AVAILABLE first)
      if (a.status !== b.status) {
        if (a.status === 'AVAILABLE') return -1;
        if (b.status === 'AVAILABLE') return 1;
        return a.status.localeCompare(b.status);
      }
      // Then natural sort by line number
      return naturalSort(a.lineNumber, b.lineNumber);
    });

    const formattedBidLines = sortedBidLines.map(line => {
      return {
        ...line,
        isFavorited: line.favorites.length > 0,
        favoriteRank: line.favorites.length > 0 ? line.favorites[0].rank : null,
        favoriteId: line.favorites.length > 0 ? line.favorites[0].id : null,
        scheduleMetrics: line.schedule ? calculateShiftCalcMetrics(line.schedule) : null,
      };
    });

    function calculateShiftCalcMetrics(schedule: any) {
      if (!schedule?.scheduleShifts) {
        return null;
      }
      
      const shiftsWithCodes = schedule.scheduleShifts.filter((s: any) => s.shiftCode);
      
      // Get the number of cycles from the bid period (default to 1 if not available)
      const numCycles = schedule.bidPeriod?.numCycles || 1;
      
      const metrics = {
        weekendsOn: 0,
        saturdaysOn: 0,
        sundaysOn: 0,
        blocks5day: 0,
        blocks4day: 0,
        shiftPattern: "Mixed"
      };

      const sortedShifts = schedule.scheduleShifts.sort((a: any, b: any) => a.dayNumber - b.dayNumber);
      const shiftTypes: string[] = [];
      let consecutiveWorkDays = 0;
      const workBlocks: number[] = [];
      
      // Track weekend work per weekend pair
      const weekends: { [weekendKey: string]: { saturday: boolean, sunday: boolean } } = {};
      let workingShifts = 0;
      
      // First pass: identify all weekend work
      for (const shift of sortedShifts) {
        const date = new Date(shift.date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        if (shift.shiftCode) {
          // Working day
          workingShifts++;
          consecutiveWorkDays++;
          shiftTypes.push(shift.shiftCode.code);
          
          // Track weekend work by weekend pair
          if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
            const weekStart = new Date(date);
            if (dayOfWeek === 0) { // If Sunday, go back to previous Saturday
              weekStart.setDate(weekStart.getDate() - 1);
            }
            const weekendKey = weekStart.toISOString().split('T')[0]; // Use Saturday date as key
            
            if (!weekends[weekendKey]) {
              weekends[weekendKey] = { saturday: false, sunday: false };
            }
            
            if (dayOfWeek === 6) {
              weekends[weekendKey].saturday = true;
            }
            if (dayOfWeek === 0) {
              weekends[weekendKey].sunday = true;
            }
          }
        } else {
          // Day off - end of work block
          if (consecutiveWorkDays > 0) {
            workBlocks.push(consecutiveWorkDays);
            consecutiveWorkDays = 0;
          }
        }
      }
      
      // Count weekend types
      for (const weekend of Object.values(weekends)) {
        if (weekend.saturday && weekend.sunday) {
          // Both days worked - counts as weekend working
          metrics.weekendsOn++;
        } else if (weekend.saturday && !weekend.sunday) {
          // Only Saturday worked
          metrics.saturdaysOn++;
        } else if (weekend.sunday && !weekend.saturday) {
          // Only Sunday worked
          metrics.sundaysOn++;
        }
      }
      
      // Add final block if schedule ends on work day
      if (consecutiveWorkDays > 0) {
        workBlocks.push(consecutiveWorkDays);
      }
      
      // Count block types
      metrics.blocks5day = workBlocks.filter(block => block === 5).length;
      metrics.blocks4day = workBlocks.filter(block => block === 4).length;
      
      // Multiply all counts by the number of cycles for the full bid period
      metrics.weekendsOn *= numCycles;
      metrics.saturdaysOn *= numCycles;
      metrics.sundaysOn *= numCycles;
      metrics.blocks5day *= numCycles;
      metrics.blocks4day *= numCycles;
      
      // Determine shift pattern
      const uniqueShifts = [...new Set(shiftTypes)];
      if (uniqueShifts.length === 0) {
        metrics.shiftPattern = "No shifts";
      } else if (uniqueShifts.length === 1) {
        metrics.shiftPattern = uniqueShifts[0];
      } else if (uniqueShifts.length <= 3) {
        metrics.shiftPattern = uniqueShifts.join("/");
      } else {
        metrics.shiftPattern = "Mixed";
      }
      
      return metrics;
    }

    return NextResponse.json(formattedBidLines);
  } catch (error) {
    console.error('Error fetching bid lines:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const bidLine = await prisma.bidLine.create({
      data: {
        operationId: body.operationId,
        lineNumber: body.lineNumber,
        bidPeriodId: body.bidPeriodId || null,
        scheduleId: body.scheduleId || null,
        shiftStart: body.shiftStart ? new Date(body.shiftStart) : null,
        shiftEnd: body.shiftEnd ? new Date(body.shiftEnd) : null,
        daysOfWeek: body.daysOfWeek || [],
        location: body.location,
        description: body.description,
        status: body.status || 'AVAILABLE',
        notes: body.notes,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        bidLineId: bidLine.id,
        action: 'BID_LINE_CREATED',
        details: body,
      },
    });

    return NextResponse.json(bidLine);
  } catch (error) {
    console.error('Error creating bid line:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}