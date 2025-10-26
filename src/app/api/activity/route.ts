import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const hours = parseInt(url.searchParams.get('hours') || '24');

    // Get recent activity from the last 24 hours (or specified hours)
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    console.log('Fetching activity since:', cutoffTime);
    const actionTypes = [
      'BID_LINE_CLAIMED', 'BID_LINE_RELEASED', 'BID_LINE_ASSIGNED', 'BID_LINE_BLACKED_OUT',
      'ADMIN_RELEASED_LINE', 'ADMIN_ASSIGNED_LINE', 'ADMIN_BLACKED_OUT_LINE'
    ];
    console.log('Looking for actions:', actionTypes);

    const activities = await prisma.activityLog.findMany({
      where: {
        timestamp: {
          gte: cutoffTime
        },
        action: {
          in: actionTypes
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            badgeNumber: true
          }
        },
        bidLine: {
          select: {
            lineNumber: true,
            operation: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    console.log(`Found ${activities.length} activities`);
    if (activities.length > 0) {
      console.log('Sample activity:', activities[0]);
    }

    // Transform to activity ticker format
    const formattedActivities = activities.map(activity => {
      const details = activity.details as any;
      const userName = activity.user?.firstName && activity.user?.lastName 
        ? `${activity.user.firstName} ${activity.user.lastName}`
        : activity.user?.badgeNumber || 'Unknown User';

      let type: 'claim' | 'assign' | 'release' | 'blackout' = 'claim';
      let status = 'TAKEN';

      switch (activity.action) {
        case 'BID_LINE_CLAIMED':
          type = 'claim';
          status = 'TAKEN';
          break;
        case 'BID_LINE_RELEASED':
        case 'ADMIN_RELEASED_LINE':
          type = 'release';
          status = 'AVAILABLE';
          break;
        case 'BID_LINE_ASSIGNED':
        case 'ADMIN_ASSIGNED_LINE':
          type = 'assign';
          status = 'TAKEN';
          break;
        case 'BID_LINE_BLACKED_OUT':
        case 'ADMIN_BLACKED_OUT_LINE':
          type = 'blackout';
          status = 'BLACKED_OUT';
          break;
      }

      // Extract line number and operation name from bidLine relation or details
      const lineNumber = activity.bidLine?.lineNumber || details?.lineNumber || 'Unknown';
      const operationName = activity.bidLine?.operation?.name || details?.operationName || 'Unknown Operation';

      return {
        id: activity.id,
        timestamp: activity.timestamp,
        type,
        lineNumber,
        operationName,
        status,
        userName,
        action: activity.action
      };
    });

    return NextResponse.json({
      activities: formattedActivities,
      total: activities.length
    });

  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}