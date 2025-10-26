import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSupervisor } from '@/lib/api/withAuth';

async function getAdminStats(request: NextRequest & { user: any }, params?: any) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeBidLines,
      totalOperations,
      todayActivity,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.bidLine.count({ where: { status: 'AVAILABLE' } }),
      prisma.operation.count({ where: { isActive: true } }),
      prisma.activityLog.count({
        where: {
          timestamp: {
            gte: today
          }
        }
      }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    const formattedActivity = recentActivity.map(activity => ({
      id: activity.id,
      action: activity.action,
      user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System',
      timestamp: new Date(activity.timestamp).toLocaleString()
    }));

    return NextResponse.json({
      totalUsers,
      activeBidLines,
      totalOperations,
      todayActivity,
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withSupervisor(getAdminStats);