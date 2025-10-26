import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSupervisor } from '@/lib/api/withAuth';

async function getNotificationHistory(request: NextRequest & { user: any }, params?: any) {
  try {
    const { searchParams } = new URL(request.url);
    const recentMinutes = searchParams.get('recent');

    // Define where clause type properly
    let whereClause: { sentAt?: { gte: Date } } = {};
    
    // If recent parameter is provided, filter for notifications within that time
    if (recentMinutes) {
      const minutesAgo = new Date();
      minutesAgo.setMinutes(minutesAgo.getMinutes() - parseInt(recentMinutes));
      whereClause = {
        sentAt: {
          gte: minutesAgo
        }
      };
    }

    const notifications = await prisma.notificationHistory.findMany({
      where: whereClause,
      orderBy: {
        sentAt: 'desc'
      },
      take: 100, // Limit to prevent large responses
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json({ error: 'Failed to fetch notification history' }, { status: 500 });
  }
}

export const GET = withSupervisor(getNotificationHistory);
