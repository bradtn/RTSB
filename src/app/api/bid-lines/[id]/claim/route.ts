import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClientIP, getUserAgent } from '@/lib/request-utils';
import { emitBidLineUpdateFromServer } from '@/lib/socket-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bidLineId = id;
    const userId = session.user.id;

    // Check if bid line exists and is available
    const bidLine = await prisma.bidLine.findUnique({
      where: { id: bidLineId },
      include: { operation: true }
    });

    if (!bidLine) {
      return NextResponse.json({ error: 'Bid line not found' }, { status: 404 });
    }

    if (bidLine.status !== 'AVAILABLE') {
      return NextResponse.json({ 
        error: 'Bid line is not available', 
        currentStatus: bidLine.status 
      }, { status: 400 });
    }

    // Update bid line as taken
    const updatedBidLine = await prisma.bidLine.update({
      where: { id: bidLineId },
      data: {
        status: 'TAKEN',
        takenBy: `${session.user.name}`,
        takenAt: new Date(),
      },
      include: { operation: true }
    });

    // Record in bid history
    await prisma.bidHistory.create({
      data: {
        userId,
        bidLineId,
        action: 'CLAIMED',
        details: {
          lineNumber: bidLine.lineNumber,
          operationName: bidLine.operation.name,
          takenAt: new Date(),
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        bidLineId,
        action: 'BID_LINE_CLAIMED',
        details: {
          lineNumber: bidLine.lineNumber,
          operationId: bidLine.operationId,
          operationName: bidLine.operation.name,
        },
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
      },
    });

    // Emit real-time WebSocket update after successful claim
    await emitBidLineUpdateFromServer({
      bidLineId: updatedBidLine.id,
      lineNumber: updatedBidLine.lineNumber,
      status: 'TAKEN',
      takenBy: updatedBidLine.takenBy || session.user.name || undefined,
      takenAt: updatedBidLine.takenAt?.toISOString() || undefined,
      claimedBy: session.user.id,
      operationName: updatedBidLine.operation?.name,
    });

    return NextResponse.json(updatedBidLine);
  } catch (error) {
    console.error('Error claiming bid line:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}