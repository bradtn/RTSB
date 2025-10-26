// src/lib/scheduler/scoring.ts

// Debug toggle - set to true only when debugging
const DEBUG_MODE = false;

// Constants
const DAYS_PER_CYCLE = 56;  // Update to match your Python config
const DAY_OFF_CODE = "----";
const PREF_5DAY_MULTIPLIER = 1.5;  // Penalty multiplier for 5-day blocks
const PREF_WEEKEND_MULTIPLIER = 2.0;  // Penalty multiplier for weekend work
const WEEKENDS_PER_CYCLE = 8;  // From your Python code (used only for penalty denominators)

// Hardcoded settings (working values)
const SCHEDULE_START_DATE = "2025-10-09";
const NUM_CYCLES = 3;

/**
 * Types
 */
type Schedule = {
  id: number;
  LINE: string;
  GROUP: string;
  [key: string]: any; // For dynamic day columns (DAY_001, DAY_002, etc.)
};

type FilterCriteria = {
  selectedGroups: string[];
  dayOffDates: Date[];
  selectedShiftCodes: string[];
  selectedShiftCategories: string[];
  selectedShiftLengths: string[];
  shiftCategoryIntent?: string; // 'any' or 'mix'
  weights: {
    groupWeight: number;
    daysWeight: number;
    shiftWeight: number;
    blocks5dayWeight: number;
    blocks4dayWeight: number;
    weekendWeight: number;
    saturdayWeight: number;
    sundayWeight: number;
  };
};

type ScoringResult = {
  score: number;
  explanation: string;
  weekendsOn: string;
  saturdaysOn: string;
  sundaysOn: string;
  blocks5day: number;
  blocks4day: number;
  shiftMatches?: number;
  shiftCounts?: Record<string, number>; // New field to hold shift code counts
  totalShifts?: number; // New field to hold total shift count
};

type WeekendDataPoint = {
  weekendNumber: number;
  satDate: Date;
  sunDate: Date;
  satColumn: string;
  sunColumn: string;
  satShift: string;
  sunShift: string;
  isSatWorking: boolean;
  isSunWorking: boolean;
  result: 'full' | 'satOnly' | 'sunOnly' | 'off';
};

// Debug function to analyze a specific schedule in detail
function debugSchedule(schedule: Schedule): void {
  if (!DEBUG_MODE) return;
  
  if (schedule.LINE === "1" || schedule.LINE === "TSU1") {
    console.log("========= DEBUG SCHEDULE LINE 1 =========");
    console.log(`Schedule ID: ${schedule.id}, LINE: ${schedule.LINE}, GROUP: ${schedule.GROUP}`);
    
    // Log all day columns
    const dayColumns: Record<string, string> = {};
    for (const key in schedule) {
      if (key.startsWith("DAY_")) {
        dayColumns[key] = schedule[key] === null || schedule[key] === undefined 
          ? DAY_OFF_CODE 
          : String(schedule[key]).trim();
      }
    }
    
    // Sort day columns
    const sortedDays = Object.keys(dayColumns).sort((a, b) => {
      const dayNumA = parseInt(a.replace("DAY_", ""));
      const dayNumB = parseInt(b.replace("DAY_", ""));
      return dayNumA - dayNumB;
    });
    
    // Print organized day columns
    console.log("Day Columns:");
    const chunks = [];
    for (let i = 0; i < sortedDays.length; i += 7) {
      const chunk = sortedDays.slice(i, i + 7);
      const values = chunk.map(day => `${day}=${dayColumns[day]}`);
      chunks.push(values.join(", "));
    }
    chunks.forEach((chunk, i) => console.log(`Week ${i+1}: ${chunk}`));
    
    // Get a detailed weekend analysis
    const weekendData = getDetailedWeekendAnalysis(schedule, dayColumns);
    
    // Print detailed weekend analysis
    console.log("\nDetailed Weekend Analysis:");
    console.log("Weekend# | Saturday    | Sunday      | Sat Shift | Sun Shift | Result");
    console.log("---------|-------------|-------------|-----------|-----------|--------");
    
    weekendData.forEach(w => {
      console.log(
        `${w.weekendNumber.toString().padStart(8)} | ` +
        `${w.satDate.toISOString().split('T')[0]} | ` +
        `${w.sunDate.toISOString().split('T')[0]} | ` +
        `${w.satShift.padEnd(9)} | ` +
        `${w.sunShift.padEnd(9)} | ` +
        `${w.result.padEnd(8)}`
      );
    });
    
    // Summarize weekend counts
    const fullWeekends = weekendData.filter(w => w.result === 'full').length;
    const satOnly = weekendData.filter(w => w.result === 'satOnly').length;
    const sunOnly = weekendData.filter(w => w.result === 'sunOnly').length;
    
    console.log("\nWeekend Summary:");
    console.log(`Full Weekends: ${fullWeekends}`);
    console.log(`Solitary Saturdays: ${satOnly}`);
    console.log(`Solitary Sundays: ${sunOnly}`);
    console.log(`Total Weekends: ${weekendData.length}`);
    
    // Debug working blocks
    const blocks = calculateWorkingBlocks(schedule, dayColumns);
    console.log("\nWorking Blocks Summary:");
    console.log(`5-day blocks: ${blocks.blocks5day}`);
    console.log(`4-day blocks: ${blocks.blocks4day}`);
    
    // Debug shift counts
    const shiftCounts = calculateAllShiftCounts(schedule, dayColumns);
    console.log("\nShift Counts:");
    for (const [code, count] of Object.entries(shiftCounts.shiftCounts)) {
      console.log(`${code}: ${count}`);
    }
    console.log(`Total shifts: ${shiftCounts.totalShifts}`);
    
    console.log("========= END DEBUG SCHEDULE LINE 1 =========");
  }
}

/**
 * Get detailed weekend analysis for debugging
 */
function getDetailedWeekendAnalysis(schedule: Schedule, dayColumns?: Record<string, string>): WeekendDataPoint[] {
  const columns = dayColumns || preprocessDayColumns(schedule);
  const startDateStr = SCHEDULE_START_DATE; // e.g. "2025-04-24"
  
  if (DEBUG_MODE) {
    console.log("=== DATE CALCULATION DEBUG ===");
    console.log(`Raw start date string: ${startDateStr}`);
  }
  
  // Parse the date manually to avoid timezone issues
  const [yearStr, monthStr, dayStr] = startDateStr.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr) - 1; // JS months are 0-indexed (0=Jan, 11=Dec)
  const day = parseInt(dayStr);
  
  // Create date with explicit year/month/day in local timezone
  const startDate = new Date(year, month, day);
  
  if (DEBUG_MODE) {
    console.log(`Carefully parsed start date: ${startDate.toDateString()}`);
    console.log(`Day of week: ${startDate.getDay()} (4 should be Thursday for April 24, 2025)`);
  }
  
  const numCycles = NUM_CYCLES;
  const results: WeekendDataPoint[] = [];
  
  // Find the first Saturday (FIXED VERSION)
  const firstSaturday = new Date(startDate);
  const dayOfWeek = startDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Calculate days until first Saturday
  // If today is Saturday (6), add 0 days
  // Otherwise add (6 - dayOfWeek) days to get to next Saturday
  const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek);
  
  if (DEBUG_MODE) {
    console.log(`Days until Saturday: ${daysUntilSaturday}`);
  }
  
  firstSaturday.setDate(startDate.getDate() + daysUntilSaturday);
  
  if (DEBUG_MODE) {
    console.log(`First Saturday calculated: ${firstSaturday.toDateString()}`);
  }
  
  // Set end date (startDate + DAYS_PER_CYCLE * numCycles)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (DAYS_PER_CYCLE * numCycles));
  
  if (DEBUG_MODE) {
    console.log(`End date calculated: ${endDate.toDateString()}`);
    console.log("=== END DATE CALCULATION DEBUG ===");
  }
  
  // Iterate over each weekend in the scheduling period
  let currentSaturday = new Date(firstSaturday);
  let weekendNumber = 1;
  
  while (currentSaturday < endDate) {
    // Calculate Sunday date (day after Saturday)
    const currentSunday = new Date(currentSaturday);
    currentSunday.setDate(currentSaturday.getDate() + 1);
    
    // Only process weekends where Sunday is within range
    if (currentSunday <= endDate) {
      // Calculate column numbers for Saturday and Sunday
      const satOffset = Math.floor((currentSaturday.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const sunOffset = Math.floor((currentSunday.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Add 1 because DAY columns are 1-indexed (DAY_001 not DAY_000)
      const satDayInCycle = ((satOffset % DAYS_PER_CYCLE) + 1);
      const sunDayInCycle = ((sunOffset % DAYS_PER_CYCLE) + 1);
      
      const satColumn = `DAY_${satDayInCycle.toString().padStart(3, '0')}`;
      const sunColumn = `DAY_${sunDayInCycle.toString().padStart(3, '0')}`;
      
      // Get shifts for Saturday and Sunday
      const satShift = columns[satColumn] || DAY_OFF_CODE;
      const sunShift = columns[sunColumn] || DAY_OFF_CODE;
      
      // Determine if working each day
      const isSatWorking = satShift !== DAY_OFF_CODE;
      const isSunWorking = sunShift !== DAY_OFF_CODE;
      
      // Determine the result for this weekend
      let result: 'full' | 'satOnly' | 'sunOnly' | 'off';
      if (isSatWorking && isSunWorking) {
        result = 'full';
      } else if (isSatWorking && !isSunWorking) {
        result = 'satOnly';
      } else if (!isSatWorking && isSunWorking) {
        result = 'sunOnly';
      } else {
        result = 'off';
      }
      
      // Add weekend data point
      results.push({
        weekendNumber,
        satDate: new Date(currentSaturday),
        sunDate: new Date(currentSunday),
        satColumn,
        sunColumn,
        satShift,
        sunShift,
        isSatWorking,
        isSunWorking,
        result
      });
      
      weekendNumber++;
    }
    
    // Move to next weekend
    currentSaturday.setDate(currentSaturday.getDate() + 7);
  }
  
  return results;
}

/**
 * Get total cycles from settings
 */
function getTotalCycles(): number {
  return NUM_CYCLES;
}

/**
 * Calculate a match score for a schedule based on filtering criteria
 */
export function calculateScheduleScore(schedule: Schedule, criteria: FilterCriteria): ScoringResult {
  // Debug line 1 specifically
  debugSchedule(schedule);
  
  if (DEBUG_MODE) {
    console.log(`[SCORING] Start calculating score for LINE=${schedule.LINE}, GROUP=${schedule.GROUP}`);
  }
  
  // Preprocess day columns
  const dayColumns = preprocessDayColumns(schedule);
  
  // Use weighted scoring system instead of starting with 100
  let totalScore = 0;
  let totalWeight = 0;
  let explanation: string[] = [];
  
  // Group match
  if (criteria.selectedGroups.length > 0) {
    if (!criteria.selectedGroups.includes(schedule.GROUP)) {
      if (DEBUG_MODE) {
        console.log(`[SCORING] Group mismatch: ${schedule.GROUP} not in ${criteria.selectedGroups}`);
      }
      return { 
        score: 0, 
        explanation: "Group mismatch", 
        weekendsOn: "0 of 24",
        saturdaysOn: "0 of 24",
        sundaysOn: "0 of 24",
        blocks5day: 0,
        blocks4day: 0
      };
    }
    explanation.push("Group matches");
  }
  
  // Calculate day matches
  const dayMatches = calculateDayOffMatches(schedule, criteria.dayOffDates);
  if (criteria.dayOffDates.length > 0) {
    const matchRate = dayMatches.matchCount / criteria.dayOffDates.length;
    const dayScore = 100 * matchRate;
    
    // Apply weight to day score - FIXED: use correct property name
    if (criteria.weights.daysWeight > 0) {
      const weight = criteria.weights.daysWeight;
      totalScore += dayScore * weight;
      totalWeight += weight;
    }
    
    explanation.push(`${Math.round(matchRate * 100)}% of requested days off match (${dayMatches.matchCount}/${criteria.dayOffDates.length})`);
    
    // Show matched days (days they'll actually get off)
    if (dayMatches.matchedDays.length > 0) {
      if (dayMatches.matchedDays.length <= 8) {
        explanation.push(`Days off: ${dayMatches.matchedDays.join(", ")}`);
      } else {
        explanation.push(`Days off: ${dayMatches.matchedDays.slice(0, 8).join(", ")} + ${dayMatches.matchedDays.length - 8} more`);
      }
    }
    
    // Show missing days (days they won't get off)
    if (dayMatches.missingDays.length > 0) {
      if (dayMatches.missingDays.length <= 8) {
        explanation.push(`Missing: ${dayMatches.missingDays.join(", ")}`);
      } else {
        explanation.push(`Missing: ${dayMatches.missingDays.slice(0, 8).join(", ")} + ${dayMatches.missingDays.length - 8} more`);
      }
    }
  }
  
  // Count all shifts and build shift breakdown
  const allShiftCounts = calculateAllShiftCounts(schedule, dayColumns);
  
  // Calculate shift code matches
  if (criteria.selectedShiftCodes.length > 0) {
    const shiftMatches = calculateShiftMatches(schedule, criteria.selectedShiftCodes, allShiftCounts);
    const shiftMatchRate = shiftMatches.matchCount / shiftMatches.totalShifts;
    
    // Apply weight to shift match score
    if (criteria.weights.shiftWeight > 0) {
      const shiftScore = 100 * shiftMatchRate;
      const weight = criteria.weights.shiftWeight;
      totalScore += shiftScore * weight;
      totalWeight += weight;
    }
    
    // Basic explanation with percentages
    let shiftExplanation = `${Math.round(shiftMatchRate * 100)}% of shifts match selected codes`;
    
    // Format detailed shift counts for selected codes - FIXED TO REMOVE REDUNDANT COUNTS
    if (criteria.selectedShiftCodes.length > 0 && shiftMatches.totalShifts > 0) {
      // Count matching shifts
      let matchingShiftsCount = 0;
      let selectedCodes = [];
      
      for (const code of criteria.selectedShiftCodes) {
        if (allShiftCounts.shiftCounts[code]) {
          matchingShiftsCount += allShiftCounts.shiftCounts[code];
          selectedCodes.push(code);
        }
      }
      
      // Format explanation with improved breakdown
      if (selectedCodes.length === 1) {
        // Single selected code - don't show redundant count
        shiftExplanation = `${matchingShiftsCount} of ${allShiftCounts.totalShifts} total shifts are ${selectedCodes[0]} (${Math.round(shiftMatchRate * 100)}%)`;
      } else if (selectedCodes.length > 1) {
        // Multiple selected codes - include counts for clarity
        let matchingShiftsDetails = [];
        for (const code of selectedCodes) {
          matchingShiftsDetails.push(`${code}: ${allShiftCounts.shiftCounts[code]}`);
        }
        shiftExplanation = `${matchingShiftsCount} of ${allShiftCounts.totalShifts} total shifts are ${matchingShiftsDetails.join(', ')} (${Math.round(shiftMatchRate * 100)}%)`;
      }
      
      // Add other shifts with improved formatting
      const otherShiftsCount = allShiftCounts.totalShifts - matchingShiftsCount;
      if (otherShiftsCount > 0) {
        const otherCodes = Object.keys(allShiftCounts.shiftCounts)
          .filter(code => !criteria.selectedShiftCodes.includes(code));
          
        if (otherCodes.length === 1) {
          // Single other shift type - don't show redundant count
          shiftExplanation += `; The other ${otherShiftsCount} shifts are: ${otherCodes[0]}`;
        } else {
          // Multiple other shift types - include counts for clarity
          const otherShifts = Object.entries(allShiftCounts.shiftCounts)
            .filter(([code]) => !criteria.selectedShiftCodes.includes(code))
            .map(([code, count]) => `${code}: ${count}`)
            .join(', ');
          
          shiftExplanation += `; The other ${otherShiftsCount} shifts are: ${otherShifts}`;
        }
      }
    }
    
    explanation.push(shiftExplanation);
  }

  // Calculate shift category matches
  if (criteria.selectedShiftCategories.length > 0) {
    const categoryMatches = calculateCategoryMatches(schedule, criteria.selectedShiftCategories, criteria.shiftCategoryIntent || 'any', allShiftCounts);
    
    if (DEBUG_MODE || (schedule.LINE >= 51 && schedule.LINE <= 58)) {
      console.log(`[SCORING] LINE=${schedule.LINE} category analysis:`, {
        selectedCategories: criteria.selectedShiftCategories,
        intent: criteria.shiftCategoryIntent,
        uniqueCategories: categoryMatches.uniqueCategories,
        categoriesFound: categoryMatches.categoriesFound,
        totalShifts: categoryMatches.totalShifts,
        shiftCounts: allShiftCounts
      });
    }
    
    // If user wants MIX and this line only has 1 category, filter it out
    if (criteria.shiftCategoryIntent === 'mix' && criteria.selectedShiftCategories.length > 1) {
      if (categoryMatches.uniqueCategories < 2) {
        return { 
          score: 0, 
          explanation: "Single shift type (looking for variety)", 
          weekendsOn: "0 of 0",
          saturdaysOn: "0 of 0",
          sundaysOn: "0 of 0",
          blocks5day: 0,
          blocks4day: 0
        };
      }
    }
    
    const categoryMatchRate = categoryMatches.matchCount / categoryMatches.totalShifts;
    
    // Apply weight to category match score
    if (criteria.weights.shiftWeight > 0) {
      const categoryScore = 100 * categoryMatchRate;
      const weight = criteria.weights.shiftWeight;
      totalScore += categoryScore * weight;
      totalWeight += weight;
    }
    
    // Add explanation for category matching
    if (criteria.shiftCategoryIntent === 'mix' && criteria.selectedShiftCategories.length > 1) {
      explanation.push(`${categoryMatches.uniqueCategories} different shift types (${categoryMatches.categoriesFound.join(', ')})`);
    } else {
      explanation.push(`${Math.round(categoryMatchRate * 100)}% of shifts match selected categories`);
    }
  }
  
  // Calculate work block metrics
  const blocks = calculateWorkingBlocks(schedule, dayColumns);
  
  // Calculate base score for work blocks (less blocks = higher score)
  if (criteria.weights.blocks5dayWeight > 0) {
    const maxExpectedBlocks = 6; // Adjust based on typical schedule
    const blockScore = Math.max(0, 100 - (blocks.blocks5day / maxExpectedBlocks) * 100);
    const weight = criteria.weights.blocks5dayWeight;
    totalScore += blockScore * weight;
    totalWeight += weight;
    
    if (blocks.blocks5day > 0) {
      explanation.push(`${blocks.blocks5day} five-day work blocks`);
    }
  }
  
  // Calculate base score for 4-day blocks
  if (criteria.weights.blocks4dayWeight > 0) {
    const maxExpectedBlocks = 8; // Adjust based on typical schedule
    const blockScore = Math.max(0, 100 - (blocks.blocks4day / maxExpectedBlocks) * 100);
    const weight = criteria.weights.blocks4dayWeight;
    totalScore += blockScore * weight;
    totalWeight += weight;
    
    if (blocks.blocks4day > 0) {
      explanation.push(`${blocks.blocks4day} four-day work blocks`);
    }
  }
  
  // Calculate weekend metrics with the improved function
  const weekendData = getDetailedWeekendAnalysis(schedule, dayColumns);
  const fullWeekends = weekendData.filter(w => w.result === 'full').length;
  const solitarySaturdays = weekendData.filter(w => w.result === 'satOnly').length;
  const solitarySundays = weekendData.filter(w => w.result === 'sunOnly').length;
  
  const totalWeekends = weekendData.length;
  
  if (DEBUG_MODE) {
    console.log(`[SCORING] Weekend results for LINE=${schedule.LINE}:`);
    console.log(`[SCORING]   Full weekends: ${fullWeekends}`);
    console.log(`[SCORING]   Solitary Saturdays: ${solitarySaturdays}`);
    console.log(`[SCORING]   Solitary Sundays: ${solitarySundays}`);
    console.log(`[SCORING]   Total weekends in period: ${totalWeekends}`);
  }
  
  // Calculate weekend score (fewer weekends working = higher score)
  if (criteria.weights.weekendWeight > 0) {
    const weekendScore = 100 * (1 - fullWeekends / totalWeekends);
    const weight = criteria.weights.weekendWeight;
    totalScore += weekendScore * weight;
    totalWeight += weight;
    
    if (fullWeekends > 0) {
      explanation.push(`${fullWeekends} of ${totalWeekends} full weekends working`);
    }
  }
  
  // Calculate Saturday score
  if (criteria.weights.saturdayWeight > 0) {
    const totalSaturdays = fullWeekends + solitarySaturdays;
    const saturdayScore = 100 * (1 - totalSaturdays / totalWeekends);
    const weight = criteria.weights.saturdayWeight;
    totalScore += saturdayScore * weight;
    totalWeight += weight;
    
    if (solitarySaturdays > 0) {
      explanation.push(`${solitarySaturdays} solitary Saturdays working`);
    }
  }
  
  // Calculate Sunday score
  if (criteria.weights.sundayWeight > 0) {
    const totalSundays = fullWeekends + solitarySundays;
    const sundayScore = 100 * (1 - totalSundays / totalWeekends);
    const weight = criteria.weights.sundayWeight;
    totalScore += sundayScore * weight;
    totalWeight += weight;
    
    if (solitarySundays > 0) {
      explanation.push(`${solitarySundays} solitary Sundays working`);
    }
  }
  
  // Calculate final weighted score
  let finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  // Add bonus for total days off - FIXED to calculate across all cycles
  const numCycles = NUM_CYCLES;
  const totalScheduleDays = DAYS_PER_CYCLE * numCycles;
  const totalDaysOffPerCycle = Object.values(dayColumns).filter(day => day === DAY_OFF_CODE || day === '').length;
  const totalDaysOff = totalDaysOffPerCycle * numCycles;
  const daysOffRatio = totalDaysOff / totalScheduleDays;
  
  // Give a 10% bonus for schedules with more days off
  const daysOffBonus = daysOffRatio * 10;
  finalScore = finalScore + daysOffBonus;
  
  // Ensure score stays in 0-100 range
  const score = Math.max(0, Math.min(100, Math.round(finalScore)));
  
  if (daysOffRatio > 0.4) {
    explanation.push(`${totalDaysOff} total days off`);
  }
  
  // Final debug print before returning result
  if (DEBUG_MODE) {
    console.log(`[SCORING] Final output for ${schedule.LINE}:`);
    console.log(`[SCORING]   weekendsOn: ${fullWeekends} of ${totalWeekends}`);
    console.log(`[SCORING]   saturdaysOn: ${solitarySaturdays} of ${totalWeekends}`); // Only solitary Saturdays
    console.log(`[SCORING]   sundaysOn: ${solitarySundays} of ${totalWeekends}`);     // Only solitary Sundays
  }
  
  return {
    score,
    explanation: explanation.join("; "),
    weekendsOn: `${fullWeekends} of ${totalWeekends}`,
    saturdaysOn: `${solitarySaturdays} of ${totalWeekends}`, // Only solitary Saturdays
    sundaysOn: `${solitarySundays} of ${totalWeekends}`,     // Only solitary Sundays
    blocks5day: blocks.blocks5day,
    blocks4day: blocks.blocks4day,
    shiftCounts: allShiftCounts.shiftCounts,               // New - include all shift counts
    totalShifts: allShiftCounts.totalShifts,               // New - include total shifts count
    dayOffDetails: dayMatches                              // New - include complete day off details
  };
}

/**
 * Preprocess the day columns from a schedule.
 * If a day is null/undefined, treat it as off.
 */
function preprocessDayColumns(schedule: Schedule): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in schedule) {
    if (key.startsWith("DAY_")) {
      const value = schedule[key];
      result[key] = value === null || value === undefined ? DAY_OFF_CODE : String(value).trim();
    }
  }
  
  return result;
}

/**
 * Calculate how many requested days off match the schedule.
 */
function calculateDayOffMatches(schedule: Schedule, requestedDays: Date[]) {
  const dayColumns = preprocessDayColumns(schedule);
  
  let matchCount = 0;
  const missingDays: string[] = [];
  const matchedDays: string[] = [];
  
  // For each requested day off, determine corresponding day column.
  const startDateStr = SCHEDULE_START_DATE;
  
  for (const day of requestedDays) {
    const [yearStr, monthStr, dayStr] = startDateStr.split('-');
    const startDate = new Date(
      parseInt(yearStr),
      parseInt(monthStr) - 1,
      parseInt(dayStr)
    );
    
    // Calculate days since start date
    const daysDiff = Math.floor((day.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // FIXED: Handle negative daysDiff (dates before schedule start) properly
    // Get the corresponding day within the cycle
    let dayInCycle;
    if (daysDiff < 0) {
      // For dates before schedule start, we need to handle negative modulo correctly
      const positiveDiff = Math.abs(daysDiff);
      dayInCycle = DAYS_PER_CYCLE - ((positiveDiff - 1) % DAYS_PER_CYCLE);
    } else {
      dayInCycle = ((daysDiff % DAYS_PER_CYCLE) + 1);
    }
    
    const columnName = `DAY_${dayInCycle.toString().padStart(3, '0')}`;
    
    // Format date as compact "Jan 15" style
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayString = `${monthNames[day.getMonth()]} ${day.getDate()}`;
    
    const shift = dayColumns[columnName];
    if (shift === DAY_OFF_CODE) {
      matchCount++;
      matchedDays.push(dayString);
    } else {
      missingDays.push(dayString);
    }
  }
  
  return { matchCount, missingDays, matchedDays };
}

/**
 * Calculate category matches for shift categories
 */
function calculateCategoryMatches(
  schedule: Schedule, 
  selectedCategories: string[], 
  intent: string,
  allShiftCounts?: { shiftCounts: Record<string, number>; totalShifts: number }
) {
  // We need to categorize each shift code to determine what categories this schedule has
  const shiftCounts = allShiftCounts?.shiftCounts || {};
  
  // Categorize shifts by looking up shift codes (this is simplified - in a real implementation
  // you'd want to import the shift categorization logic)
  const categoryCounts: Record<string, number> = {};
  const categoriesFound: string[] = [];
  
  // We need to import the actual shift categorization logic used by the UI
  // For now, let's use a more comprehensive approach based on start times
  for (const [shiftCode, count] of Object.entries(shiftCounts)) {
    let category = 'Other';
    
    // Extract time from shift code (e.g., "06BO" -> "06", "07AX" -> "07")
    const timeMatch = shiftCode.match(/^(\d{2})/);
    if (timeMatch) {
      const startHour = parseInt(timeMatch[1]);
      
      // Categorize based on start time
      if (startHour >= 6 && startHour <= 9) {
        category = 'Days';
      } else if (startHour >= 10 && startHour <= 13) {
        category = 'Mid Days';
      } else if (startHour >= 14 && startHour <= 17) {
        category = 'Afternoons';
      } else if (startHour >= 18 && startHour <= 21) {
        category = 'Midnights'; // Fixed: 18+ hours should be Midnights, not Late Days
      } else if (startHour >= 22 || startHour <= 5) {
        category = 'Midnights';
      }
    }
    
    if (DEBUG_MODE) {
      console.log(`[CATEGORY] Shift ${shiftCode} -> ${category} (hour: ${timeMatch ? timeMatch[1] : 'unknown'})`);
    }
    
    if (selectedCategories.includes(category)) {
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
        categoriesFound.push(category);
      }
      categoryCounts[category] += count;
    }
  }
  
  const uniqueCategories = Object.keys(categoryCounts).length;
  const matchCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const totalShifts = allShiftCounts?.totalShifts || 0;
  
  return {
    uniqueCategories,
    categoriesFound,
    matchCount,
    totalShifts,
    categoryCounts
  };
}

/**
 * NEW: Calculate all shift counts across the entire schedule period
 */
function calculateAllShiftCounts(schedule: Schedule, dayColumns?: Record<string, string>) {
  const columns = dayColumns || preprocessDayColumns(schedule);
  const numCycles = NUM_CYCLES;
  
  // Create a mapping of all day columns by day number for a single cycle
  const singleCycleColumns: Record<number, string> = {};
  
  // Extract day number from column name and map to shift code
  for (const key in columns) {
    if (key.startsWith("DAY_")) {
      const dayNum = parseInt(key.replace("DAY_", ""));
      singleCycleColumns[dayNum] = columns[key];
    }
  }
  
  // Count shifts for all cycles
  const shiftCounts: Record<string, number> = {};
  let totalShifts = 0;
  
  // Process all days across all cycles
  for (let cycle = 0; cycle < numCycles; cycle++) {
    for (let day = 1; day <= DAYS_PER_CYCLE; day++) {
      const dayNum = day;
      const shiftCode = singleCycleColumns[dayNum] || DAY_OFF_CODE;
      
      if (shiftCode !== DAY_OFF_CODE) {
        totalShifts++;
        
        if (!shiftCounts[shiftCode]) {
          shiftCounts[shiftCode] = 0;
        }
        shiftCounts[shiftCode]++;
      }
    }
  }
  
  const totalScheduleDays = DAYS_PER_CYCLE * numCycles;
  
  if (DEBUG_MODE) {
    console.log(`[SHIFTS] Total days in schedule: ${totalScheduleDays}`);
    console.log(`[SHIFTS] Total working shifts: ${totalShifts}`);
    console.log(`[SHIFTS] Days off: ${totalScheduleDays - totalShifts}`);
  }
  
  return { shiftCounts, totalShifts, totalDays: totalScheduleDays };
}

/**
 * Calculate shift code matches - uses the all shifts count for efficiency
 */
function calculateShiftMatches(
  schedule: Schedule, 
  selectedCodes: string[], 
  allShiftCounts?: { shiftCounts: Record<string, number>; totalShifts: number }
) {
  // If we already have all shift counts, use them
  if (allShiftCounts) {
    let matchCount = 0;
    
    // Count matching shifts
    for (const code of selectedCodes) {
      matchCount += allShiftCounts.shiftCounts[code] || 0;
    }
    
    return { 
      matchCount, 
      totalShifts: allShiftCounts.totalShifts,
      shiftCounts: allShiftCounts.shiftCounts
    };
  }
  
  // Otherwise calculate from scratch (fallback)
  const dayColumns = preprocessDayColumns(schedule);
  
  let matchCount = 0;
  let totalShifts = 0;
  const shiftCounts: Record<string, number> = {};
  
  for (const day in dayColumns) {
    const shiftCode = dayColumns[day];
    if (shiftCode && shiftCode !== DAY_OFF_CODE) {
      totalShifts++;
      
      // Count each shift type
      if (!shiftCounts[shiftCode]) {
        shiftCounts[shiftCode] = 0;
      }
      shiftCounts[shiftCode]++;
      
      if (selectedCodes.includes(shiftCode)) {
        matchCount++;
      }
    }
  }
  
  return { matchCount, totalShifts, shiftCounts };
}

/**
 * Count work blocks for a schedule across all cycles.
 */
function calculateWorkingBlocks(schedule: Schedule, dayColumns?: Record<string, string>) {
  const columns = dayColumns || preprocessDayColumns(schedule);
  const numCycles = NUM_CYCLES;
  
  // Create a full working days array that repeats the cycle data
  const workingDaysPerCycle: number[] = [];
  
  // Get all day columns in order for a single cycle
  const orderedDayColumns = Object.keys(columns)
    .filter(key => key.startsWith("DAY_"))
    .sort((a, b) => {
      const dayNumA = parseInt(a.replace("DAY_", ""));
      const dayNumB = parseInt(b.replace("DAY_", ""));
      return dayNumA - dayNumB;
    });
  
  if (DEBUG_MODE) {
    console.log(`[BLOCKS] Processing working blocks for LINE=${schedule.LINE}, GROUP=${schedule.GROUP}`);
    console.log(`[BLOCKS] Number of cycles: ${numCycles}`);
    console.log(`[BLOCKS] Day columns in database: ${orderedDayColumns.length}`);
  }
  
  // Build the working days pattern for a single cycle
  for (const day of orderedDayColumns) {
    const shiftCode = columns[day];
    workingDaysPerCycle.push(shiftCode !== DAY_OFF_CODE ? 1 : 0);
  }
  
  // Repeat the cycle data for all cycles
  let allWorkingDays: number[] = [];
  for (let i = 0; i < numCycles; i++) {
    allWorkingDays = allWorkingDays.concat(workingDaysPerCycle);
  }
  
  if (DEBUG_MODE) {
    console.log(`[BLOCKS] Working days pattern for first cycle: ${workingDaysPerCycle.join('')}`);
    console.log(`[BLOCKS] Total days across all cycles: ${allWorkingDays.length}`);
  }
  
  // Handle blocks that might span cycle boundaries
  const blocks5day = countConsecutiveBlocksWithCycleWraparound(workingDaysPerCycle, 5, numCycles);
  const blocks4day = countConsecutiveBlocksWithCycleWraparound(workingDaysPerCycle, 4, numCycles);
  
  if (DEBUG_MODE) {
    console.log(`[BLOCKS] Found ${blocks5day} five-day blocks and ${blocks4day} four-day blocks`);
  }
  
  return { blocks5day, blocks4day };
}

/**
 * Count blocks across multiple cycles, including those that wrap across cycle boundaries
 */
function countConsecutiveBlocksWithCycleWraparound(cycleWorkingDays: number[], targetSize: number, numCycles: number): number {
  // First count blocks entirely within a single cycle
  let blocksPerCycle = countConsecutiveBlocks(cycleWorkingDays, targetSize);
  
  if (DEBUG_MODE) {
    console.log(`[BLOCKS] Found ${blocksPerCycle} ${targetSize}-day blocks within each cycle`);
  }
  
  // Multiply by number of cycles
  let blockCount = blocksPerCycle * numCycles;
  
  // Then check for blocks that wrap around cycle boundaries
  // We need to check the end of the cycle connecting to the beginning of the next cycle
  // Let's create a temporary array with two copies of the cycle data
  const wrappedData = [...cycleWorkingDays, ...cycleWorkingDays];
  
  // Check only the wrapping positions
  for (let i = cycleWorkingDays.length - (targetSize - 1); i < cycleWorkingDays.length; i++) {
    // Check if there's a valid sequence starting at position i
    let isValidSequence = true;
    for (let j = 0; j < targetSize; j++) {
      if (wrappedData[i + j] !== 1) {
        isValidSequence = false;
        break;
      }
    }
    
    if (isValidSequence) {
      // Check that this is bounded by off days (or the cycle boundaries)
      const leftOk = i === 0 || wrappedData[i - 1] === 0;
      const rightOk = (i + targetSize) === wrappedData.length || wrappedData[i + targetSize] === 0;
      
      if (leftOk && rightOk) {
        if (DEBUG_MODE) {
          console.log(`[BLOCKS] Found a wrapping ${targetSize}-day block at position ${i}`);
        }
        // This block wraps around cycles, so it appears in (numCycles - 1) places
        blockCount += (numCycles - 1);
      }
    }
  }
  
  return blockCount;
}

/**
 * Count blocks of exactly targetSize consecutive working days.
 */
function countConsecutiveBlocks(workingDays: number[], targetSize: number): number {
  let blockCount = 0;
  let i = 0;
  
  while (i <= workingDays.length - targetSize) {
    let isValidSequence = true;
    for (let j = 0; j < targetSize; j++) {
      if (workingDays[i + j] !== 1) {
        isValidSequence = false;
        break;
      }
    }
    
    if (isValidSequence) {
      const leftOk = i === 0 || workingDays[i - 1] === 0;
      const rightOk = i + targetSize === workingDays.length || workingDays[i + targetSize] === 0;
      
      if (leftOk && rightOk) {
        blockCount++;
        i += targetSize; // Skip past this block.
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  
  return blockCount;
}

export default {
  calculateScheduleScore,
  debugSchedule,
  getDetailedWeekendAnalysis
};