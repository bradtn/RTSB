import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSupervisor } from '@/lib/api/withAuth';

async function resetQueue(request: NextRequest & { user: any }, params?: any) {
  try {
    const body = await request.json();
    const { testEmail } = body;

    // Reset all bidding statuses
    await prisma.seniorityList.updateMany({
      data: {
        currentBiddingStatus: 'waiting',
        hasBid: false,
        bidAt: null,
      },
    });

    // Set first person as up_next, second as next_in_line
    const officers = await prisma.seniorityList.findMany({
      orderBy: { seniorityRank: 'asc' },
      take: 2,
    });

    if (officers.length > 0) {
      await prisma.seniorityList.update({
        where: { id: officers[0].id },
        data: { currentBiddingStatus: 'up_next' },
      });
    }

    if (officers.length > 1) {
      await prisma.seniorityList.update({
        where: { id: officers[1].id },
        data: { currentBiddingStatus: 'next_in_line' },
      });
    }

    // If testEmail is provided, update all personal/work emails to that email
    if (testEmail) {
      await prisma.seniorityList.updateMany({
        data: {
          personalEmail: testEmail,
          workEmail: testEmail,
        },
      });
    }

    // Log the reset
    await prisma.activityLog.create({
      data: {
        userId: request.user.id,
        action: 'NOTIFICATION_QUEUE_RESET',
        details: {
          resetBy: request.user.email,
          testEmail: testEmail || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    const count = await prisma.seniorityList.count();

    return NextResponse.json({
      success: true,
      message: `Queue reset successfully. ${count} officers reset.`,
      testEmail: testEmail || null,
    });

  } catch (error) {
    console.error('Error resetting queue:', error);
    return NextResponse.json({ error: 'Failed to reset queue' }, { status: 500 });
  }
}

export const POST = withSupervisor(resetQueue);