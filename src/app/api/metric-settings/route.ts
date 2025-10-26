import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');
    
    console.log('Fetching metric settings for operationId:', operationId);

    // Get settings for specific operation
    let settings = await prisma.metricSettings.findFirst({
      where: {
        operationId: operationId || null
      }
    });
    
    console.log('Found operation-specific settings:', settings?.id, 'for operation:', settings?.operationId);

    // If no operation-specific settings exist and we're looking for an operation, 
    // fall back to global settings
    if (!settings && operationId) {
      console.log('No operation-specific settings found, falling back to global');
      settings = await prisma.metricSettings.findFirst({
        where: {
          operationId: null
        }
      });
      console.log('Found global settings:', settings?.id);
    }

    // If still no settings exist, return defaults
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