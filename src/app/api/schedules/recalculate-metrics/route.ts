import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { updateAllBidLineMetricsForPeriod, updateBidLineMetrics } from '@/lib/schedule-metrics';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bidPeriodId, bidLineId } = body;

    if (bidLineId) {
      // Recalculate metrics for a specific bid line
      console.log(`Recalculating metrics for bid line ${bidLineId}`);
      await updateBidLineMetrics(bidLineId);
      
      return NextResponse.json({
        success: true,
        message: 'Metrics recalculated for bid line',
        updated: 1
      });
    } else if (bidPeriodId) {
      // Recalculate metrics for all bid lines in a bid period
      console.log(`Recalculating metrics for all bid lines in bid period ${bidPeriodId}`);
      const result = await updateAllBidLineMetricsForPeriod(bidPeriodId);
      
      return NextResponse.json({
        success: true,
        message: `Metrics recalculated for ${result.updated} bid lines`,
        ...result
      });
    } else {
      return NextResponse.json({
        error: 'Must provide either bidPeriodId or bidLineId'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error recalculating metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to recalculate metrics',
        details: error.message || String(error)
      }, 
      { status: 500 }
    );
  }
}