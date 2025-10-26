import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateAllBidLineMetricsForPeriod } from '@/lib/schedule-metrics';

export async function POST(
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
      where: { id }
    });

    if (!bidPeriod) {
      return NextResponse.json({ error: 'Bid period not found' }, { status: 404 });
    }

    // If already active, return success
    if (bidPeriod.isActive) {
      return NextResponse.json({ 
        success: true,
        message: 'Bid period is already active'
      });
    }

    // Deactivate all other bid periods
    await prisma.bidPeriod.updateMany({
      where: {
        isActive: true,
        id: { not: id }
      },
      data: {
        isActive: false
      }
    });

    // Activate the selected bid period
    const updated = await prisma.bidPeriod.update({
      where: { id },
      data: {
        isActive: true
      }
    });

    // Recalculate schedule metrics for all bid lines in this period
    let metricsResult = { updated: 0, skipped: 0 };
    try {
      console.log(`Recalculating schedule metrics for bid period ${id}`);
      metricsResult = await updateAllBidLineMetricsForPeriod(id);
      console.log(`Metrics recalculation completed: ${metricsResult.updated} updated, ${metricsResult.skipped} skipped`);
    } catch (error) {
      console.warn('Failed to recalculate schedule metrics:', error);
    }

    // Log the activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'ACTIVATED_BID_PERIOD',
          details: {
            bidPeriodName: bidPeriod.name,
            bidPeriodId: id,
            metricsUpdated: metricsResult.updated,
            metricsSkipped: metricsResult.skipped
          }
        }
      });
    } catch (logError) {
      console.warn('Failed to log activity:', logError);
    }

    return NextResponse.json({ 
      success: true,
      message: `"${updated.name}" is now the active bid period. Updated metrics for ${metricsResult.updated} bid lines.`,
      bidPeriod: updated,
      metricsUpdated: metricsResult.updated
    });

  } catch (error: any) {
    console.error('Error activating bid period:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate bid period' },
      { status: 500 }
    );
  }
}