import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSupervisor } from '@/lib/api/withAuth';

async function getMetricSettings(request: NextRequest & { user: any }, params?: any) {
  try {

    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    // Get settings for specific operation or global default
    let settings = await prisma.metricSettings.findFirst({
      where: {
        operationId: operationId || null
      }
    });

    // If no settings exist, return defaults
    if (!settings) {
      settings = {
        id: '',
        operationId: operationId || null,
        showWeekends: true,
        showSaturdays: true,
        showSundays: true,
        show5DayBlocks: true,
        show4DayBlocks: true,
        show3DayBlocks: false,
        show2DayBlocks: false,
        show6DayBlocks: false,
        showSingleDays: false,
        showHolidays: true,
        showTotalSaturdays: false,
        showTotalSundays: false,
        showTotalDays: false,
        showTotalMondays: false,
        showTotalTuesdays: false,
        showTotalWednesdays: false,
        showTotalThursdays: false,
        showTotalFridays: false,
        showLongestStretch: false,
        showFridayWeekendBlocks: false,
        showWeekdayBlocks: false,
        showOffBlocks2day: false,
        showOffBlocks3day: false,
        showOffBlocks4day: false,
        showOffBlocks5day: false,
        showOffBlocks6day: false,
        showOffBlocks7dayPlus: false,
        showLongestOffStretch: false,
        showShortestOffStretch: false,
        metricOrder: ['weekends', 'saturdays', 'sundays', '5dayBlocks', '4dayBlocks', 'holidays'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching metric settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metric settings' },
      { status: 500 }
    );
  }
}

async function updateMetricSettings(request: NextRequest & { user: any }, params?: any) {
  try {

    const data = await request.json();
    const {
      operationId,
      showWeekends,
      showSaturdays,
      showSundays,
      show5DayBlocks,
      show4DayBlocks,
      show3DayBlocks,
      show2DayBlocks,
      show6DayBlocks,
      showSingleDays,
      showHolidays,
      showTotalSaturdays,
      showTotalSundays,
      showTotalDays,
      showTotalMondays,
      showTotalTuesdays,
      showTotalWednesdays,
      showTotalThursdays,
      showTotalFridays,
      showLongestStretch,
      showFridayWeekendBlocks,
      showWeekdayBlocks,
      showOffBlocks2day,
      showOffBlocks3day,
      showOffBlocks4day,
      showOffBlocks5day,
      showOffBlocks6day,
      showOffBlocks7dayPlus,
      showLongestOffStretch,
      showShortestOffStretch,
      metricOrder
    } = data;

    // Handle null operationId differently since Prisma upsert doesn't handle null well
    const finalOperationId = operationId || null;
    
    // First try to find existing settings
    const existingSettings = await prisma.metricSettings.findFirst({
      where: {
        operationId: finalOperationId
      }
    });

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.metricSettings.update({
        where: {
          id: existingSettings.id
        },
        data: {
          showWeekends,
          showSaturdays,
          showSundays,
          show5DayBlocks,
          show4DayBlocks,
          show3DayBlocks,
          show2DayBlocks,
          show6DayBlocks,
          showSingleDays,
          showHolidays,
          showTotalSaturdays,
          showTotalSundays,
          showTotalDays,
          showTotalMondays,
          showTotalTuesdays,
          showTotalWednesdays,
          showTotalThursdays,
          showTotalFridays,
          showLongestStretch,
          showFridayWeekendBlocks,
          showWeekdayBlocks,
          showOffBlocks2day,
          showOffBlocks3day,
          showOffBlocks4day,
          showOffBlocks5day,
          showOffBlocks6day,
          showOffBlocks7dayPlus,
          showLongestOffStretch,
          showShortestOffStretch,
          metricOrder,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new settings
      settings = await prisma.metricSettings.create({
        data: {
          operationId: finalOperationId,
          showWeekends,
          showSaturdays,
          showSundays,
          show5DayBlocks,
          show4DayBlocks,
          show3DayBlocks,
          show2DayBlocks,
          show6DayBlocks,
          showSingleDays,
          showHolidays,
          showTotalSaturdays,
          showTotalSundays,
          showTotalDays,
          showTotalMondays,
          showTotalTuesdays,
          showTotalWednesdays,
          showTotalThursdays,
          showTotalFridays,
          showLongestStretch,
          showFridayWeekendBlocks,
          showWeekdayBlocks,
          showOffBlocks2day,
          showOffBlocks3day,
          showOffBlocks4day,
          showOffBlocks5day,
          showOffBlocks6day,
          showOffBlocks7dayPlus,
          showLongestOffStretch,
          showShortestOffStretch,
          metricOrder,
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating metric settings:', error);
    return NextResponse.json(
      { error: 'Failed to update metric settings' },
      { status: 500 }
    );
  }
}

export const GET = withSupervisor(getMetricSettings);
export const PUT = withSupervisor(updateMetricSettings);