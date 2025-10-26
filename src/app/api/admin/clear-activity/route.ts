import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Super Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { type, days } = body;

    let deletedCount = 0;

    switch (type) {
      case 'all':
        // Clear all activity logs
        const deleteResult = await prisma.activityLog.deleteMany({});
        deletedCount = deleteResult.count;
        break;

      case 'older_than_days':
        if (!days || days < 1) {
          return NextResponse.json({ error: 'Days parameter required and must be >= 1' }, { status: 400 });
        }
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const deleteOldResult = await prisma.activityLog.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDate
            }
          }
        });
        deletedCount = deleteOldResult.count;
        break;

      case 'by_bid_period':
        // Clear activity for specific bid period (if bidLineId is associated with a bid period)
        const { bidPeriodId } = body;
        if (!bidPeriodId) {
          return NextResponse.json({ error: 'Bid period ID required' }, { status: 400 });
        }

        const deleteBidPeriodResult = await prisma.activityLog.deleteMany({
          where: {
            bidLine: {
              bidPeriodId: bidPeriodId
            }
          }
        });
        deletedCount = deleteBidPeriodResult.count;
        break;

      default:
        return NextResponse.json({ error: 'Invalid clear type. Use: all, older_than_days, or by_bid_period' }, { status: 400 });
    }

    // Log the admin action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_CLEARED_ACTIVITY_LOG',
        details: {
          type,
          days: days || null,
          deletedCount,
          clearedBy: session.user.email,
          clearedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount,
      message: `Successfully cleared ${deletedCount} activity log entries`
    });

  } catch (error) {
    console.error('Error clearing activity log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}