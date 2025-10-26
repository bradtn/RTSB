/**
 * Script to populate schedule metrics for all bid lines
 * This calculates and stores the metrics once for performance
 */

const { PrismaClient } = require('@prisma/client');

// Copy the calculateShiftCalcMetrics function logic
async function calculateScheduleMetrics(schedule) {
  if (!schedule?.scheduleShifts) {
    return null;
  }
  
  const shiftsWithCodes = schedule.scheduleShifts.filter((s) => s.shiftCode);
  
  // Get the number of cycles from the bid period (default to 1 if not available)
  const numCycles = schedule.bidPeriod?.numCycles || 1;
  
  const metrics = {
    weekendsOn: 0,
    saturdaysOn: 0,
    sundaysOn: 0,
    blocks5day: 0,
    blocks4day: 0,
    holidaysWorking: 0,
    holidaysOff: 0,
    shiftPattern: "Mixed"
  };

  if (shiftsWithCodes.length === 0) {
    metrics.shiftPattern = "No shifts";
    return metrics;
  }

  const sortedShifts = schedule.scheduleShifts.sort((a, b) => a.dayNumber - b.dayNumber);
  const shiftTypes = [];
  let consecutiveWorkDays = 0;
  const workBlocks = [];
  
  // Track weekend work per weekend pair
  const weekends = {};
  let workingShifts = 0;
  
  // Simple holiday calculation - for now we'll skip complex holiday API calls
  // and just do basic weekend/pattern analysis
  const holidays = []; // We can populate this later if needed
  const holidayDates = new Set(holidays.map(d => d.toISOString().split('T')[0]));
  
  // First pass: identify all weekend work and holidays
  for (const shift of sortedShifts) {
    const date = new Date(shift.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dateString = date.toISOString().split('T')[0];
    const isHolidayDate = holidayDates.has(dateString);
    
    if (shift.shiftCode) {
      // Working day
      workingShifts++;
      consecutiveWorkDays++;
      shiftTypes.push(shift.shiftCode.code);
      
      // Track holiday work
      if (isHolidayDate) {
        metrics.holidaysWorking++;
      }
      
      // Track weekend work by weekend pair
      if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
        const weekStart = new Date(date);
        if (dayOfWeek === 0) { // If Sunday, go back to previous Saturday
          weekStart.setDate(weekStart.getDate() - 1);
        }
        const weekendKey = weekStart.toISOString().split('T')[0]; // Use Saturday date as key
        
        if (!weekends[weekendKey]) {
          weekends[weekendKey] = { saturday: false, sunday: false };
        }
        
        if (dayOfWeek === 6) {
          weekends[weekendKey].saturday = true;
        }
        if (dayOfWeek === 0) {
          weekends[weekendKey].sunday = true;
        }
      }
      
    } else {
      // Day off
      if (consecutiveWorkDays > 0) {
        workBlocks.push(consecutiveWorkDays);
        consecutiveWorkDays = 0;
      }
      
      // Track holiday days off
      if (isHolidayDate) {
        metrics.holidaysOff++;
      }
    }
  }
  
  // Don't forget the last work block if the schedule ends on working days
  if (consecutiveWorkDays > 0) {
    workBlocks.push(consecutiveWorkDays);
  }
  
  // Count weekend work patterns
  for (const weekend of Object.values(weekends)) {
    if (weekend.saturday && weekend.sunday) {
      metrics.weekendsOn++;
    } else if (weekend.saturday) {
      metrics.saturdaysOn++;
    } else if (weekend.sunday) {
      metrics.sundaysOn++;
    }
  }
  
  // Count 4-day and 5-day work blocks
  for (const blockLength of workBlocks) {
    if (blockLength === 4) {
      metrics.blocks4day++;
    } else if (blockLength === 5) {
      metrics.blocks5day++;
    }
  }
  
  // Multiply all counts by the number of cycles for the full bid period
  metrics.weekendsOn *= numCycles;
  metrics.saturdaysOn *= numCycles;
  metrics.sundaysOn *= numCycles;
  metrics.blocks5day *= numCycles;
  metrics.blocks4day *= numCycles;
  metrics.holidaysWorking *= numCycles;
  metrics.holidaysOff *= numCycles;
  
  // Determine shift pattern for display
  const uniqueShifts = [...new Set(shiftTypes)];
  if (uniqueShifts.length === 0) {
    metrics.shiftPattern = "No shifts";
  } else if (uniqueShifts.length === 1) {
    metrics.shiftPattern = uniqueShifts[0];
  } else if (uniqueShifts.length <= 3) {
    metrics.shiftPattern = uniqueShifts.join("/");
  } else {
    metrics.shiftPattern = "Mixed";
  }
  
  return metrics;
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting schedule metrics population...');

    // Get all bid lines that have schedules
    const bidLines = await prisma.bidLine.findMany({
      where: {
        scheduleId: { not: null }
      },
      include: {
        schedule: {
          include: {
            bidPeriod: true,
            scheduleShifts: {
              include: {
                shiftCode: true
              },
              orderBy: {
                dayNumber: 'asc'
              }
            }
          }
        }
      }
    });

    console.log(`Found ${bidLines.length} bid lines with schedules`);

    let updated = 0;
    let skipped = 0;

    for (const bidLine of bidLines) {
      try {
        // Calculate metrics for this bid line
        const metrics = await calculateScheduleMetrics(bidLine.schedule);
        
        if (metrics) {
          // Update the bid line with calculated metrics
          await prisma.bidLine.update({
            where: { id: bidLine.id },
            data: {
              weekendsOn: metrics.weekendsOn,
              saturdaysOn: metrics.saturdaysOn,
              sundaysOn: metrics.sundaysOn,
              blocks5day: metrics.blocks5day,
              blocks4day: metrics.blocks4day,
              holidaysWorking: metrics.holidaysWorking,
              holidaysOff: metrics.holidaysOff,
              shiftPattern: metrics.shiftPattern,
            }
          });
          
          updated++;
          console.log(`Updated Line ${bidLine.lineNumber}: ${metrics.shiftPattern}, weekends: ${metrics.weekendsOn}, 5-day blocks: ${metrics.blocks5day}`);
        } else {
          skipped++;
          console.log(`Skipped Line ${bidLine.lineNumber}: no schedule data`);
        }
      } catch (error) {
        console.error(`Error processing Line ${bidLine.lineNumber}:`, error);
        skipped++;
      }
    }

    console.log(`\nCompleted! Updated ${updated} bid lines, skipped ${skipped}`);

  } catch (error) {
    console.error('Error during population:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();