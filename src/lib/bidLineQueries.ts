import { prisma } from '@/lib/prisma';

export async function getBidLineWithMetrics(bidLineId: string) {
  try {
    const bidLine = await prisma.bidLine.findUnique({
      where: { id: bidLineId },
      include: {
        operation: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameFr: true,
          },
        },
        bidPeriod: {
          select: {
            id: true,
            name: true,
            numCycles: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
        schedule: {
          include: {
            scheduleShifts: {
              include: {
                shiftCode: {
                  select: {
                    code: true,
                    beginTime: true,
                    endTime: true,
                    category: true,
                    hoursLength: true,
                  },
                },
              },
              orderBy: {
                dayNumber: 'asc',
              },
            },
          },
        },
      },
    });

    if (!bidLine) {
      return null;
    }

    // Transform the data to match the expected structure
    const transformedBidLine = {
      ...bidLine,
      scheduleMetrics: {
        weekendsOn: bidLine.weekendsOn,
        saturdaysOn: bidLine.saturdaysOn,
        sundaysOn: bidLine.sundaysOn,
        blocks5day: bidLine.blocks5day,
        blocks4day: bidLine.blocks4day,
        blocks3day: bidLine.blocks3day,
        blocks2day: bidLine.blocks2day,
        blocks6day: bidLine.blocks6day,
        singleDays: bidLine.singleDays,
        holidaysWorking: bidLine.holidaysWorking,
        holidaysOff: bidLine.holidaysOff,
        shiftPattern: bidLine.shiftPattern,
        totalSaturdays: bidLine.totalSaturdays,
        totalSaturdaysInPeriod: bidLine.totalSaturdaysInPeriod,
        totalSundays: bidLine.totalSundays,
        totalSundaysInPeriod: bidLine.totalSundaysInPeriod,
        totalMondays: bidLine.totalMondays,
        totalMondaysInPeriod: bidLine.totalMondaysInPeriod,
        totalTuesdays: bidLine.totalTuesdays,
        totalTuesdaysInPeriod: bidLine.totalTuesdaysInPeriod,
        totalWednesdays: bidLine.totalWednesdays,
        totalWednesdaysInPeriod: bidLine.totalWednesdaysInPeriod,
        totalThursdays: bidLine.totalThursdays,
        totalThursdaysInPeriod: bidLine.totalThursdaysInPeriod,
        totalFridays: bidLine.totalFridays,
        totalFridaysInPeriod: bidLine.totalFridaysInPeriod,
        totalDaysWorked: bidLine.totalDaysWorked,
        totalDaysInPeriod: bidLine.totalDaysInPeriod,
        longestStretch: bidLine.longestStretch,
        fridayWeekendBlocks: bidLine.fridayWeekendBlocks,
        weekdayBlocks: bidLine.weekdayBlocks,
        offBlocks2day: bidLine.offBlocks2day,
        offBlocks3day: bidLine.offBlocks3day,
        offBlocks4day: bidLine.offBlocks4day,
        offBlocks5day: bidLine.offBlocks5day,
        offBlocks6day: bidLine.offBlocks6day,
        offBlocks7dayPlus: bidLine.offBlocks7dayPlus,
        longestOffStretch: bidLine.longestOffStretch,
        shortestOffStretch: bidLine.shortestOffStretch,
      },
      scheduleShifts: bidLine.schedule?.scheduleShifts?.map(shift => ({
        dayNumber: shift.dayNumber,
        shiftCode: shift.shiftCode ? {
          code: shift.shiftCode.code,
          beginTime: shift.shiftCode.beginTime,
          endTime: shift.shiftCode.endTime,
          category: shift.shiftCode.category,
          hoursLength: shift.shiftCode.hoursLength,
        } : undefined,
      })) || [],
    };

    return transformedBidLine;
  } catch (error) {
    console.error('Error fetching bid line with metrics:', error);
    throw error;
  }
}

export async function getAllBidLinesWithMetrics(operationId?: string) {
  try {
    const whereClause = operationId ? { operationId } : {};
    
    const bidLines = await prisma.bidLine.findMany({
      where: whereClause,
      include: {
        operation: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            nameFr: true,
          },
        },
        bidPeriod: {
          select: {
            id: true,
            name: true,
            numCycles: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
        schedule: {
          include: {
            scheduleShifts: {
              include: {
                shiftCode: {
                  select: {
                    code: true,
                    beginTime: true,
                    endTime: true,
                    category: true,
                    hoursLength: true,
                  },
                },
              },
              orderBy: {
                dayNumber: 'asc',
              },
            },
          },
        },
      },
      orderBy: [
        { operation: { name: 'asc' } },
        { lineNumber: 'asc' }
      ],
    });

    // Transform each bid line to match the expected structure
    const transformedBidLines = bidLines.map(bidLine => ({
      ...bidLine,
      scheduleMetrics: {
        weekendsOn: bidLine.weekendsOn,
        saturdaysOn: bidLine.saturdaysOn,
        sundaysOn: bidLine.sundaysOn,
        blocks5day: bidLine.blocks5day,
        blocks4day: bidLine.blocks4day,
        blocks3day: bidLine.blocks3day,
        blocks2day: bidLine.blocks2day,
        blocks6day: bidLine.blocks6day,
        singleDays: bidLine.singleDays,
        holidaysWorking: bidLine.holidaysWorking,
        holidaysOff: bidLine.holidaysOff,
        shiftPattern: bidLine.shiftPattern,
        totalSaturdays: bidLine.totalSaturdays,
        totalSaturdaysInPeriod: bidLine.totalSaturdaysInPeriod,
        totalSundays: bidLine.totalSundays,
        totalSundaysInPeriod: bidLine.totalSundaysInPeriod,
        totalMondays: bidLine.totalMondays,
        totalMondaysInPeriod: bidLine.totalMondaysInPeriod,
        totalTuesdays: bidLine.totalTuesdays,
        totalTuesdaysInPeriod: bidLine.totalTuesdaysInPeriod,
        totalWednesdays: bidLine.totalWednesdays,
        totalWednesdaysInPeriod: bidLine.totalWednesdaysInPeriod,
        totalThursdays: bidLine.totalThursdays,
        totalThursdaysInPeriod: bidLine.totalThursdaysInPeriod,
        totalFridays: bidLine.totalFridays,
        totalFridaysInPeriod: bidLine.totalFridaysInPeriod,
        totalDaysWorked: bidLine.totalDaysWorked,
        totalDaysInPeriod: bidLine.totalDaysInPeriod,
        longestStretch: bidLine.longestStretch,
        fridayWeekendBlocks: bidLine.fridayWeekendBlocks,
        weekdayBlocks: bidLine.weekdayBlocks,
        offBlocks2day: bidLine.offBlocks2day,
        offBlocks3day: bidLine.offBlocks3day,
        offBlocks4day: bidLine.offBlocks4day,
        offBlocks5day: bidLine.offBlocks5day,
        offBlocks6day: bidLine.offBlocks6day,
        offBlocks7dayPlus: bidLine.offBlocks7dayPlus,
        longestOffStretch: bidLine.longestOffStretch,
        shortestOffStretch: bidLine.shortestOffStretch,
      },
      scheduleShifts: bidLine.schedule?.scheduleShifts?.map(shift => ({
        dayNumber: shift.dayNumber,
        shiftCode: shift.shiftCode ? {
          code: shift.shiftCode.code,
          beginTime: shift.shiftCode.beginTime,
          endTime: shift.shiftCode.endTime,
          category: shift.shiftCode.category,
          hoursLength: shift.shiftCode.hoursLength,
        } : undefined,
      })) || [],
    }));

    return transformedBidLines;
  } catch (error) {
    console.error('Error fetching all bid lines with metrics:', error);
    throw error;
  }
}

export async function getOperationsForBulkPDF() {
  try {
    const operations = await prisma.operation.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        nameFr: true,
        _count: {
          select: {
            bidLines: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return operations.filter(op => op._count.bidLines > 0);
  } catch (error) {
    console.error('Error fetching operations for bulk PDF:', error);
    throw error;
  }
}