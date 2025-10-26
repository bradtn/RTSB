import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSchedules() {
  try {
    console.log('Clearing schedule data...');
    
    // Delete in order due to foreign key constraints
    await prisma.scheduleShift.deleteMany();
    console.log('Deleted all schedule shifts');
    
    await prisma.schedule.deleteMany();
    console.log('Deleted all schedules');
    
    // Clear schedule references and metrics from bid lines
    await prisma.bidLine.updateMany({
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
    
    console.log('✅ All schedule data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing schedules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSchedules();