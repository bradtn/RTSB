import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !["SUPER_ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bidLineId, scheduleId } = body;

    if (!bidLineId || !scheduleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify both bid line and schedule exist
    const [bidLine, schedule] = await Promise.all([
      prisma.bidLine.findUnique({ where: { id: bidLineId } }),
      prisma.schedule.findUnique({ where: { id: scheduleId } })
    ]);

    if (!bidLine) {
      return NextResponse.json({ error: 'Bid line not found' }, { status: 404 });
    }

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Link the bid line to the schedule
    const updatedBidLine = await prisma.bidLine.update({
      where: { id: bidLineId },
      data: { 
        scheduleId,
        bidPeriodId: schedule.bidPeriodId
      },
      include: {
        schedule: {
          include: {
            scheduleShifts: {
              include: { shiftCode: true },
              orderBy: { dayNumber: 'asc' }
            },
            bidPeriod: true
          }
        }
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        bidLineId: bidLine.id,
        action: 'SCHEDULE_LINKED',
        details: { scheduleId, scheduleLine: schedule.lineNumber },
      },
    });

    return NextResponse.json(updatedBidLine);
  } catch (error) {
    console.error('Error linking schedule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !["SUPER_ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const bidLineId = searchParams.get('bidLineId');

    if (!bidLineId) {
      return NextResponse.json({ error: 'Missing bid line ID' }, { status: 400 });
    }

    const bidLine = await prisma.bidLine.findUnique({ 
      where: { id: bidLineId },
      include: { schedule: true }
    });

    if (!bidLine) {
      return NextResponse.json({ error: 'Bid line not found' }, { status: 404 });
    }

    // Unlink the schedule
    const updatedBidLine = await prisma.bidLine.update({
      where: { id: bidLineId },
      data: { scheduleId: null }
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        bidLineId: bidLine.id,
        action: 'SCHEDULE_UNLINKED',
        details: { previousScheduleId: bidLine.scheduleId },
      },
    });

    return NextResponse.json(updatedBidLine);
  } catch (error) {
    console.error('Error unlinking schedule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}