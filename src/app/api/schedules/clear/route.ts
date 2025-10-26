import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.log('Clearing all schedule data...');
    
    // Delete in order due to foreign key constraints
    await prisma.scheduleShift.deleteMany();
    console.log('Deleted all schedule shifts');
    
    await prisma.schedule.deleteMany();
    console.log('Deleted all schedules');
    
    // Clear schedule references and metrics from bid lines
    const updatedBidLines = await prisma.bidLine.updateMany({
      data: {
        scheduleId: null,
        // Reset all metrics to null
        weekendsOn: null,
        saturdaysOn: null,
        sundaysOn: null,
        blocks5day: null,
        blocks4day: null,
        blocks3day: null,
        blocks2day: null,
        blocks6day: null,
        singleDays: null,
        holidaysWorking: null,
        holidaysOff: null,
        shiftPattern: null,
        totalSaturdays: null,
        totalSaturdaysInPeriod: null,
        totalSundays: null,
        totalSundaysInPeriod: null,
        totalDaysWorked: null,
        totalDaysInPeriod: null,
        longestStretch: null,
        fridayWeekendBlocks: null,
        weekdayBlocks: null,
      }
    });
    console.log('Updated bid lines to clear schedule references and metrics');

    return NextResponse.json({ 
      success: true, 
      message: `Successfully cleared all schedule data and reset ${updatedBidLines.count} bid lines`
    });
  } catch (error) {
    console.error('Error clearing schedules:', error);
    return NextResponse.json({ 
      error: 'Failed to clear schedules', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}