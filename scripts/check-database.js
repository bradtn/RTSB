const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking database status...\n');

    const bidLineCount = await prisma.bidLine.count();
    console.log(`Total BidLines: ${bidLineCount}`);

    const bidLinesWithSchedules = await prisma.bidLine.count({
      where: {
        scheduleId: { not: null }
      }
    });
    console.log(`BidLines with schedules: ${bidLinesWithSchedules}`);

    const scheduleCount = await prisma.schedule.count();
    console.log(`Total Schedules: ${scheduleCount}`);

    const scheduleShiftCount = await prisma.scheduleShift.count();
    console.log(`Total ScheduleShifts: ${scheduleShiftCount}`);

    const bidPeriodCount = await prisma.bidPeriod.count();
    console.log(`Total BidPeriods: ${bidPeriodCount}`);

    // Show some sample bid lines
    const sampleBidLines = await prisma.bidLine.findMany({
      take: 5,
      select: {
        id: true,
        lineNumber: true,
        operationId: true,
        scheduleId: true,
        totalMondays: true,
        totalTuesdays: true,
        totalWednesdays: true,
        totalThursdays: true,
        totalFridays: true
      }
    });

    console.log('\nSample BidLines:');
    console.table(sampleBidLines);

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();