import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bidPeriodId = searchParams.get('bidPeriodId');
    const operationId = searchParams.get('operationId');

    if (!bidPeriodId) {
      return NextResponse.json({ error: 'Bid period ID is required' }, { status: 400 });
    }

    // Build the where clause for filtering
    const whereClause: any = {
      bidPeriodId,
    };

    if (operationId) {
      whereClause.operationId = operationId;
    }

    // Fetch schedules with their assignments and officer information
    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        operation: true,
        bidPeriod: true,
        scheduleShifts: {
          include: {
            shiftCode: true,
          },
          orderBy: {
            dayNumber: 'asc',
          },
        },
        bidLines: true,
      },
      orderBy: [
        { operation: { name: 'asc' } },
        { lineNumber: 'asc' },
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

    // Transform and sort data for export
    const exportData = schedules.map(schedule => {
      // Get the primary bid line assignment (there should usually be only one taken bid line per schedule)
      const takenBidLine = schedule.bidLines?.find(bidLine => bidLine.status === 'TAKEN');
      
      return {
        schedule: {
          id: schedule.id,
          lineNumber: schedule.lineNumber,
          operation: schedule.operation,
          scheduleShifts: schedule.scheduleShifts,
        },
        assignedOfficer: takenBidLine?.takenBy || null,
        officerBadge: null, // Badge info not available in takenBy string
        status: takenBidLine?.status || 'AVAILABLE',
        assignedDate: takenBidLine?.takenAt || null,
        bidLineId: takenBidLine?.id || null,
      };
    }).sort((a, b) => {
      // First sort by operation name
      if (a.schedule.operation?.name !== b.schedule.operation?.name) {
        return (a.schedule.operation?.name || '').localeCompare(b.schedule.operation?.name || '');
      }
      // Then natural sort by line number
      return naturalSort(a.schedule.lineNumber, b.schedule.lineNumber);
    });

    return NextResponse.json(exportData);

  } catch (error: any) {
    console.error('Export assignments error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}