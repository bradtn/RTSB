/**
 * Script to populate the new weekday metrics for all bid lines
 * Uses the updated calculateScheduleMetrics function with Monday-Friday support
 */

const { PrismaClient } = require('@prisma/client');

// Import the updated schedule metrics calculation (simplified for script use)
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
    blocks3day: 0,
    blocks2day: 0,
    blocks6day: 0,
    singleDays: 0,
    holidaysWorking: 0,
    holidaysOff: 0,
    shiftPattern: "Mixed",
    totalSaturdays: 0,
    totalSaturdaysInPeriod: 0,
    totalSundays: 0,
    totalSundaysInPeriod: 0,
    totalDaysWorked: 0,
    totalDaysInPeriod: 0,
    totalMondays: 0,
    totalMondaysInPeriod: 0,
    totalTuesdays: 0,
    totalTuesdaysInPeriod: 0,
    totalWednesdays: 0,
    totalWednesdaysInPeriod: 0,
    totalThursdays: 0,
    totalThursdaysInPeriod: 0,
    totalFridays: 0,
    totalFridaysInPeriod: 0,
    longestStretch: 0,
    fridayWeekendBlocks: 0,
    weekdayBlocks: 0,
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
  
  // Count total weekdays in the period
  let totalSaturdaysInPeriod = 0;
  let totalSundaysInPeriod = 0;
  let totalMondaysInPeriod = 0;
  let totalTuesdaysInPeriod = 0;
  let totalWednesdaysInPeriod = 0;
  let totalThursdaysInPeriod = 0;
  let totalFridaysInPeriod = 0;
  
  // Count all weekdays in the period
  for (const shift of sortedShifts) {
    const date = new Date(shift.date);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    
    switch (dayOfWeek) {
      case 0: // Sunday
        totalSundaysInPeriod++;
        break;
      case 1: // Monday
        totalMondaysInPeriod++;
        break;
      case 2: // Tuesday
        totalTuesdaysInPeriod++;
        break;
      case 3: // Wednesday
        totalWednesdaysInPeriod++;
        break;
      case 4: // Thursday
        totalThursdaysInPeriod++;
        break;
      case 5: // Friday
        totalFridaysInPeriod++;
        break;
      case 6: // Saturday
        totalSaturdaysInPeriod++;
        break;
    }
  }
  
  // First pass: identify all weekend work
  for (const shift of sortedShifts) {
    const date = new Date(shift.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (shift.shiftCode) {
      // Working day
      workingShifts++;
      consecutiveWorkDays++;
      shiftTypes.push(shift.shiftCode.code);
      
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
      // End of work block
      if (consecutiveWorkDays > 0) {
        workBlocks.push(consecutiveWorkDays);
        consecutiveWorkDays = 0;
      }
    }
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
  
  // Count worked Saturdays and Sundays
  for (const weekend of Object.values(weekends)) {
    if (weekend.saturday) {
      metrics.totalSaturdays++;
    }
    if (weekend.sunday) {
      metrics.totalSundays++;
    }
  }
  
  // Count worked weekdays (Monday-Friday)
  for (const shift of sortedShifts) {
    if (shift.shiftCode) { // Only count working days
      const date = new Date(shift.date);
      const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      
      switch (dayOfWeek) {
        case 1: // Monday
          metrics.totalMondays++;
          break;
        case 2: // Tuesday
          metrics.totalTuesdays++;
          break;
        case 3: // Wednesday
          metrics.totalWednesdays++;
          break;
        case 4: // Thursday
          metrics.totalThursdays++;
          break;
        case 5: // Friday
          metrics.totalFridays++;
          break;
      }
    }
  }
  
  // Don't forget the last work block if the schedule ends on working days
  if (consecutiveWorkDays > 0) {
    workBlocks.push(consecutiveWorkDays);
  }
  
  // Count all work blocks
  for (const blockLength of workBlocks) {
    if (blockLength === 1) {
      metrics.singleDays++;
    } else if (blockLength === 2) {
      metrics.blocks2day++;
    } else if (blockLength === 3) {
      metrics.blocks3day++;
    } else if (blockLength === 4) {
      metrics.blocks4day++;
    } else if (blockLength === 5) {
      metrics.blocks5day++;
    } else if (blockLength === 6) {
      metrics.blocks6day++;
    }
  }
  
  // Calculate longest consecutive work stretch
  metrics.longestStretch = workBlocks.length > 0 ? Math.max(...workBlocks) : 0;
  
  // Calculate total days worked and period length
  metrics.totalDaysWorked = workingShifts;
  metrics.totalDaysInPeriod = sortedShifts.length;
  
  // Set period totals
  metrics.totalSaturdaysInPeriod = totalSaturdaysInPeriod;
  metrics.totalSundaysInPeriod = totalSundaysInPeriod;
  metrics.totalMondaysInPeriod = totalMondaysInPeriod;
  metrics.totalTuesdaysInPeriod = totalTuesdaysInPeriod;
  metrics.totalWednesdaysInPeriod = totalWednesdaysInPeriod;
  metrics.totalThursdaysInPeriod = totalThursdaysInPeriod;
  metrics.totalFridaysInPeriod = totalFridaysInPeriod;
  
  // Simple heuristics for Friday-weekend and weekday blocks
  let fridayWeekendBlockCount = 0;
  let weekdayBlockCount = 0;
  
  for (let i = 0; i < workBlocks.length; i++) {
    const blockLength = workBlocks[i];
    if (blockLength >= 3) {
      if (blockLength === 3) {
        // Could be Fri-Sat-Sun
        const hasWeekendWork = metrics.weekendsOn > 0 || metrics.saturdaysOn > 0 || metrics.sundaysOn > 0;
        if (hasWeekendWork) {
          fridayWeekendBlockCount++;
        }
      } else if (blockLength === 5) {
        // Could be Mon-Fri weekday block
        weekdayBlockCount++;
      }
    }
  }
  
  metrics.fridayWeekendBlocks = fridayWeekendBlockCount;
  metrics.weekdayBlocks = weekdayBlockCount;
  
  // Multiply all counts by the number of cycles for the full bid period
  metrics.weekendsOn *= numCycles;
  metrics.saturdaysOn *= numCycles;
  metrics.sundaysOn *= numCycles;
  metrics.blocks5day *= numCycles;
  metrics.blocks4day *= numCycles;
  metrics.blocks3day *= numCycles;
  metrics.blocks2day *= numCycles;
  metrics.blocks6day *= numCycles;
  metrics.singleDays *= numCycles;
  metrics.holidaysWorking *= numCycles;
  metrics.holidaysOff *= numCycles;
  metrics.totalSaturdays *= numCycles;
  metrics.totalSaturdaysInPeriod *= numCycles;
  metrics.totalSundays *= numCycles;
  metrics.totalSundaysInPeriod *= numCycles;
  metrics.totalMondays *= numCycles;
  metrics.totalMondaysInPeriod *= numCycles;
  metrics.totalTuesdays *= numCycles;
  metrics.totalTuesdaysInPeriod *= numCycles;
  metrics.totalWednesdays *= numCycles;
  metrics.totalWednesdaysInPeriod *= numCycles;
  metrics.totalThursdays *= numCycles;
  metrics.totalThursdaysInPeriod *= numCycles;
  metrics.totalFridays *= numCycles;
  metrics.totalFridaysInPeriod *= numCycles;
  metrics.totalDaysWorked *= numCycles;
  metrics.totalDaysInPeriod *= numCycles;
  metrics.fridayWeekendBlocks *= numCycles;
  metrics.weekdayBlocks *= numCycles;
  // Note: longestStretch is not multiplied as it represents the single longest stretch
  
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
    console.log('Starting weekday metrics population...');

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
          // Update the bid line with ALL calculated metrics (including new weekday ones)
          await prisma.bidLine.update({
            where: { id: bidLine.id },
            data: {
              weekendsOn: metrics.weekendsOn,
              saturdaysOn: metrics.saturdaysOn,
              sundaysOn: metrics.sundaysOn,
              blocks5day: metrics.blocks5day,
              blocks4day: metrics.blocks4day,
              blocks3day: metrics.blocks3day,
              blocks2day: metrics.blocks2day,
              blocks6day: metrics.blocks6day,
              singleDays: metrics.singleDays,
              holidaysWorking: metrics.holidaysWorking,
              holidaysOff: metrics.holidaysOff,
              shiftPattern: metrics.shiftPattern,
              totalSaturdays: metrics.totalSaturdays,
              totalSaturdaysInPeriod: metrics.totalSaturdaysInPeriod,
              totalSundays: metrics.totalSundays,
              totalSundaysInPeriod: metrics.totalSundaysInPeriod,
              totalMondays: metrics.totalMondays,
              totalMondaysInPeriod: metrics.totalMondaysInPeriod,
              totalTuesdays: metrics.totalTuesdays,
              totalTuesdaysInPeriod: metrics.totalTuesdaysInPeriod,
              totalWednesdays: metrics.totalWednesdays,
              totalWednesdaysInPeriod: metrics.totalWednesdaysInPeriod,
              totalThursdays: metrics.totalThursdays,
              totalThursdaysInPeriod: metrics.totalThursdaysInPeriod,
              totalFridays: metrics.totalFridays,
              totalFridaysInPeriod: metrics.totalFridaysInPeriod,
              totalDaysWorked: metrics.totalDaysWorked,
              totalDaysInPeriod: metrics.totalDaysInPeriod,
              longestStretch: metrics.longestStretch,
              fridayWeekendBlocks: metrics.fridayWeekendBlocks,
              weekdayBlocks: metrics.weekdayBlocks,
            }
          });
          
          updated++;
          console.log(`Updated Line ${bidLine.lineNumber}: Mon(${metrics.totalMondays}/${metrics.totalMondaysInPeriod}) Tue(${metrics.totalTuesdays}/${metrics.totalTuesdaysInPeriod}) Wed(${metrics.totalWednesdays}/${metrics.totalWednesdaysInPeriod}) Thu(${metrics.totalThursdays}/${metrics.totalThursdaysInPeriod}) Fri(${metrics.totalFridays}/${metrics.totalFridaysInPeriod})`);
        } else {
          skipped++;
          console.log(`Skipped Line ${bidLine.lineNumber}: no schedule data`);
        }
      } catch (error) {
        console.error(`Error processing Line ${bidLine.lineNumber}:`, error);
        skipped++;
      }
    }

    console.log(`\nCompleted! Updated ${updated} bid lines with weekday metrics, skipped ${skipped}`);

  } catch (error) {
    console.error('Error during population:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();