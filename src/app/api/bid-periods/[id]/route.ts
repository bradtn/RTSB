import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const session = await getServerSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if bid period exists
    const bidPeriod = await prisma.bidPeriod.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            schedules: true,
          }
        }
      }
    });

    if (!bidPeriod) {
      return NextResponse.json({ error: 'Bid period not found' }, { status: 404 });
    }

    // Don't allow deleting active bid period if there are others
    if (bidPeriod.isActive) {
      const otherPeriods = await prisma.bidPeriod.count({
        where: {
          id: { not: id }
        }
      });
      
      if (otherPeriods > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete active bid period. Set another period as active first.' 
        }, { status: 400 });
      }
    }

    // Delete the bid period (cascading deletes will handle schedules and bid lines)
    await prisma.bidPeriod.delete({
      where: { id }
    });

    // Log the activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'DELETED_BID_PERIOD',
          details: {
            bidPeriodName: bidPeriod.name,
            schedulesDeleted: bidPeriod._count.schedules
          }
        }
      });
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      success: true,
      message: `Deleted bid period "${bidPeriod.name}" and ${bidPeriod._count.schedules} associated schedules`
    });

  } catch (error: any) {
    console.error('Error deleting bid period:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete bid period' },
      { status: 500 }
    );
  }
}