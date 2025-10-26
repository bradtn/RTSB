// src/lib/scheduler/mirroredLineFinder.ts
import { ShiftCodeInfo } from "@/types/scheduleTypes";
import { addDays, format } from "date-fns";

// Constants
const DAY_OFF_CODE = "----";
const PATTERN_THRESHOLD = 85; // Minimum pattern match percentage to consider a mirror line
export const BASE_DAYS_PER_CYCLE = 56; // Base number of days in a cycle

// Cycle count and date settings are passed from API via getSettingsFromDB()

export type Schedule = {
  id: number;
  LINE: string;
  GROUP: string;
  [key: string]: any; // For dynamic day columns (DAY_001, DAY_002, etc.)
};

export type MirrorComparison = {
  day: number;
  date?: string;  // Adding actual date field
  userShift: string;
  otherShift: string;
  isDifferent: boolean;
  isWorkDayMismatch?: boolean; // Flag to indicate work/off day mismatch
  userTime?: string;
  otherTime?: string;
  // New fields for time difference analysis
  timeDifferenceScore?: number; // 0-100, with 100 being very different
  startTimeDiffMinutes?: number;
  endTimeDiffMinutes?: number;
  isSignificantDifference?: boolean; // True if the difference is significant enough for trading
};

export type MirrorScore = {
  line: Schedule;
  patternScore: number;
  userShiftPatternScore: number; // New score based on user's work days only
  shiftDiffScore: number;
  totalScore: number;
  shiftComparison: MirrorComparison[];
  sameCategoryCount: number;
  differentCategoryCount: number;
  sameTimeCount: number;
  differentTimeCount: number;
  // New metrics
  significantDifferenceCount: number; // Count of shifts with significant time differences
  workDayMismatchCount: number; // Count of days where one person works and the other is off
  averageTimeDifferenceScore: number; // Average time difference score across all shifts
  meaningfulTradeScore: number; // Overall score for meaningful trade potential
  totalUserWorkDays?: number; // Total number of work days for the user
};

/**
 * Find mirrored lines for a given user line
 * @param userLineId - The ID of the user's line
 * @param allSchedules - All available schedules in the system
 * @param shiftCodes - Optional mapping of shift codes to info about them
 * @param cycleCount - Number of cycles from admin settings
 * @param startDate - Optional start date for the schedule, defaults to today
 * @returns A sorted list of mirror scores for other lines
 */
export function findMirroredLines(
  userLineId: number, 
  allSchedules: Schedule[],
  shiftCodes?: ShiftCodeInfo[],
  cycleCount: number = 1,
  startDate: Date = new Date(),
  targetOperations?: string[] // New parameter for target operations
): { mirrorScores: MirrorScore[], userLine: Schedule | null, debugInfo?: any } {
  // Debug: Output parameters for troubleshooting
  console.log(`findMirroredLines called with: userLineId=${userLineId}, allSchedules.length=${allSchedules.length}, shiftCodes.length=${shiftCodes?.length || 0}, cycleCount=${cycleCount}, targetOperations=${targetOperations ? targetOperations.join(',') : 'all'}`);
  
  const debugInfo: any = {
    inputParams: {
      userLineId,
      totalSchedules: allSchedules.length,
      shiftCodesCount: shiftCodes?.length || 0,
      cycleCount,
      targetOperations: targetOperations || []
    },
    processedLines: 0,
    skippedLines: [],
    lowScoreLines: []
  };
  
  // Debug: Check if schedules have necessary properties
  if (allSchedules.length > 0) {
    const firstSchedule = allSchedules[0];
    console.log(`First schedule: id=${firstSchedule.id}, LINE=${firstSchedule.LINE}, GROUP=${firstSchedule.GROUP}`);
    const dayKeys = Object.keys(firstSchedule).filter(k => 
      k.toLowerCase().startsWith('day_')
    );
    console.log(`First schedule has ${dayKeys.length} day keys. Sample: ${dayKeys.length > 0 ? dayKeys.slice(0, 3).join(', ') : 'NONE'}`);
  }
  // Get the user's line schedule
  const userLine = allSchedules.find(schedule => schedule.id === userLineId);
  
  if (!userLine) {
    console.error(`User line with id ${userLineId} not found in the schedule data`);
    return { mirrorScores: [], userLine: null, debugInfo };
  }
  
  console.log(`Found user line: id=${userLine.id}, LINE=${userLine.LINE}, GROUP=${userLine.GROUP}`);
  
  // Create shift code info map if available
  const shiftCodeMap = new Map<string, { category: string, begin: string, end: string }>();
  if (shiftCodes) {
    shiftCodes.forEach(code => {
      shiftCodeMap.set(code.code, {
        category: code.category || "Unknown",
        begin: code.begin || "",
        end: code.end || ""
      });
    });
  }
  
  // Extract the day on/off pattern and shift codes from user's line
  const userPattern = extractDayPattern(userLine, cycleCount);
  const userShiftCodes = extractShiftCodes(userLine, cycleCount);
  
  // Calculate mirror scores for all other lines
  const mirrorScores: MirrorScore[] = [];
  
  for (const otherLine of allSchedules) {
    // Skip the user's own line
    if (otherLine.id === userLineId) {
      continue;
    }
    
    // If target operations are specified, skip lines that are not in the target operations
    if (targetOperations && targetOperations.length > 0) {
      // Only include lines from specified operations
      if (!targetOperations.includes(otherLine.GROUP)) {
        debugInfo.skippedLines.push({
          line: otherLine.LINE,
          group: otherLine.GROUP,
          reason: 'Not in target operations'
        });
        continue;
      }
    }
    
    debugInfo.processedLines++;
    
    // Extract the day pattern and shift codes
    const otherPattern = extractDayPattern(otherLine, cycleCount);
    const otherShiftCodes = extractShiftCodes(otherLine, cycleCount);
    
    // Log debug info before calculating scores
    console.log(`DEBUG findMirroredLines - Comparing patterns for Line ${userLine.LINE} (${userLine.GROUP}) with Line ${otherLine.LINE} (${otherLine.GROUP})`);
    
    // Calculate pattern match score (how well the on/off days match)
    const patternScore = calculatePatternScore(userPattern, otherPattern);
    
    // Calculate pattern score based on user's work days only
    console.log('DEBUG findMirroredLines - About to calculate userShiftPatternScore');
    const userShiftPatternScore = calculateUserShiftPatternScore(userPattern, otherPattern);
    console.log(`DEBUG findMirroredLines - userShiftPatternScore result: ${userShiftPatternScore}`);
    
    // For debugging: Process all lines initially
    // Normal operation: Only consider lines with good pattern matches
    // if (patternScore >= PATTERN_THRESHOLD) {
      // Calculate shift difference score (how different the shifts are)
      const shiftDiffScore = calculateShiftDifferenceScore(userShiftCodes, otherShiftCodes);
      
      // Generate detailed shift comparison
      const shiftComparison = compareShifts(
        userShiftCodes, 
        otherShiftCodes, 
        shiftCodeMap,
        startDate
      );
      
      // Count shifts with same/different categories and times
      // Also get the new metrics for time differences
      const { 
        sameCategoryCount, 
        differentCategoryCount, 
        sameTimeCount, 
        differentTimeCount,
        significantDifferenceCount,
        workDayMismatchCount,
        averageTimeDifferenceScore
      } = countShiftDifferences(shiftComparison);
      
      // Calculate a meaningful trade score
      // This is our new scoring metric that considers actual time differences
      const meaningfulTradeScore = calculateMeaningfulTradeScore(
        patternScore,
        averageTimeDifferenceScore,
        significantDifferenceCount,
        differentCategoryCount + sameCategoryCount // Total work days
      );
      
      // Calculate traditional total mirror score
      const totalScore = combineMirrorScores(patternScore, shiftDiffScore);

      // Add all results with pattern matches above 50%, don't filter too aggressively
      // This ensures we show more potential matches with varying degrees of pattern matching
      if (patternScore >= 50) {
        // Get the total user work days from the calculateUserShiftPatternScore function
        // @ts-ignore - This is a property we added 
        const totalUserWorkDays = calculateUserShiftPatternScore.userOnShiftCount || 0;
        
        mirrorScores.push({
          line: otherLine,
          patternScore,
          userShiftPatternScore,
          shiftDiffScore,
          totalScore,
          shiftComparison,
          sameCategoryCount,
          differentCategoryCount,
          sameTimeCount,
          differentTimeCount,
          significantDifferenceCount,
          workDayMismatchCount,
          averageTimeDifferenceScore,
          meaningfulTradeScore,
          totalUserWorkDays // Add this to each result
        });
      } else {
        debugInfo.lowScoreLines.push({
          line: otherLine.LINE,
          group: otherLine.GROUP,
          patternScore,
          reason: 'Pattern score below 50%'
        });
      }
    // }
  }
  
  // Log how many results we found for debugging
  console.log(`Found ${mirrorScores.length} mirror line results for user line ${userLine.LINE}`);
  
  // Filter out lines with very low trade value or near-identical lines (clones)
  const MIN_TRADE_VALUE = 15.0; // Minimum trade value threshold to include in results
  const originalCount = mirrorScores.length;
  
  // Apply filters to remove low-value trades
  // 1. Lines with value below threshold
  // 2. Identical pattern (>95%) with no significant differences (these are likely just clones)
  const filteredScores = mirrorScores.filter(score => {
    // Keep lines with decent trade value
    if (score.meaningfulTradeScore < MIN_TRADE_VALUE) {
      return false;
    }
    
    // Filter out exact clones (100% pattern match with zero significant differences)
    if (score.patternScore > 99 && score.significantDifferenceCount === 0) {
      console.log(`Filtering out likely clone line: ${score.line.LINE} (${score.line.GROUP})`);
      return false;
    }
    
    return true;
  });
  
  console.log(`Filtered out ${originalCount - filteredScores.length} low-value mirror lines`);
  
  // Sort by significant differences first, then consider pattern scores
  // This prioritizes lines with meaningful time differences over mere pattern matches
  filteredScores.sort((a, b) => {
    // First check if either line has zero significant differences
    if (a.significantDifferenceCount === 0 && b.significantDifferenceCount > 0) {
      // Always rank lines with at least some significant differences higher
      return 1; // b comes first (has significant differences)
    }
    if (b.significantDifferenceCount === 0 && a.significantDifferenceCount > 0) {
      return -1; // a comes first (has significant differences)
    }
    
    // Calculate a composite score that heavily weights significant differences
    // but still considers pattern match for proper mirroring
    const getCompositeScore = (score: MirrorScore) => {
      // Weight significant differences 3x more than pattern score
      return (score.significantDifferenceCount * 3) + 
             (score.userShiftPatternScore || 0);
    };
    
    // Sort by composite score
    const aScore = getCompositeScore(a);
    const bScore = getCompositeScore(b);
    
    return bScore - aScore; // Higher scores first (descending)
  });
  
  console.log(`Sorted results. Top score: ${filteredScores.length > 0 ? filteredScores[0].meaningfulTradeScore : 'none'}`);
  
  debugInfo.finalResultsCount = filteredScores.length;
  debugInfo.filteredOutCount = originalCount - filteredScores.length;
  
  return { mirrorScores: filteredScores, userLine, debugInfo };
}

/**
 * Extract a binary day pattern (work/off) from a schedule
 * @param schedule - The schedule to extract the pattern from
 * @param cycleCount - Number of cycles from admin settings
 */
export function extractDayPattern(schedule: Schedule, cycleCount: number = 1): number[] {
  console.log(`extractDayPattern: schedule id=${schedule.id}, LINE=${schedule.LINE}, GROUP=${schedule.GROUP}, cycleCount=${cycleCount}`);
  
  // Create pattern array with the exact expected size upfront
  // This ensures we won't miss the last day due to array indexing
  const totalDays = BASE_DAYS_PER_CYCLE * cycleCount;
  const pattern: number[] = new Array(totalDays).fill(0); // Initialize with zeros for off days
  
  // DEBUG - For reference, log the first few properties of the schedule
  const scheduleKeys = Object.keys(schedule).slice(0, 10);
  console.log('DEBUG extractDayPattern - First 10 schedule properties:', scheduleKeys);
  
  // Get all day keys in the schedule, including various capitalization formats
  const dayKeys = Object.keys(schedule).filter(k => 
    typeof k === 'string' && k.toLowerCase().startsWith('day_')
  );
  
  if (dayKeys.length === 0) {
    console.error(`Schedule id=${schedule.id} has no day fields (DAY_xxx)`);
    // We already created and initialized the pattern array, just return it
    return pattern;
  } else {
    console.log(`Schedule has ${dayKeys.length} day fields. First few: ${dayKeys.slice(0, 3).join(', ')}`);
  }
  
  // Build a map of day column names for faster lookups
  const dayColumnMap = new Map<string, string>();
  for (const key of dayKeys) {
    dayColumnMap.set(key.toLowerCase(), key);
  }
  
  for (let i = 1; i <= totalDays; i++) {
    // Handle cycle wrapping by using modulo arithmetic
    const dayIndex = ((i - 1) % BASE_DAYS_PER_CYCLE) + 1;
    const dayFieldPattern = `day_${String(dayIndex).padStart(3, '0')}`;
    
    // Try to find the actual column name in the schedule using our map
    let actualDayField = dayColumnMap.get(dayFieldPattern);
    
    // If not found with lowercase, try with uppercase
    if (!actualDayField) {
      actualDayField = dayColumnMap.get(dayFieldPattern.toUpperCase());
    }
    
    // If still not found, try with first letter capitalized
    if (!actualDayField) {
      const firstCapPattern = 'D' + dayFieldPattern.substring(1);
      actualDayField = dayColumnMap.get(firstCapPattern);
    }
    
    // Default to the standard format as a last resort
    if (!actualDayField) {
      actualDayField = `DAY_${String(dayIndex).padStart(3, '0')}`;
    }
    
    // Get the shift code for this day
    let shiftCode = schedule[actualDayField];
    
    // Try a case-insensitive lookup as a fallback if still not found
    if (shiftCode === undefined) {
      // Find any key that matches our day pattern
      const matchingKey = Object.keys(schedule).find(k => 
        k.toLowerCase() === dayFieldPattern ||
        k.toLowerCase() === dayFieldPattern.toUpperCase().toLowerCase()
      );
      
      if (matchingKey) {
        shiftCode = schedule[matchingKey];
      }
    }
    
    // Log for debugging if we're still missing fields
    if (i <= 3 || i >= totalDays - 2) {
      console.log(`Day ${i}: Field ${actualDayField} = ${shiftCode || 'undefined/null'}`);
    }
    
    // 1 for work day, 0 for off day
    pattern[i-1] = (!shiftCode || shiftCode === DAY_OFF_CODE) ? 0 : 1;
  }
  
  // DEBUG - Log pattern summary
  const workDayCount = pattern.filter(day => day === 1).length;
  const offDayCount = pattern.filter(day => day === 0).length;
  console.log(`DEBUG extractDayPattern SUMMARY: Line ${schedule.LINE} - ${workDayCount} work days, ${offDayCount} off days, Total: ${pattern.length} days`);
  console.log(`DEBUG extractDayPattern SAMPLE: First 10 days: ${pattern.slice(0, 10).join('')}, Last 10 days: ${pattern.slice(-10).join('')}`);
  
  return pattern;
}

/**
 * Extract shift codes for each day from a schedule
 * @param schedule - The schedule to extract shift codes from
 * @param cycleCount - Number of cycles from admin settings
 */
export function extractShiftCodes(schedule: Schedule, cycleCount: number = 1): string[] {
  console.log(`extractShiftCodes: schedule id=${schedule.id}, cycleCount=${cycleCount}`);
  
  // Create the array with the correct size upfront, initialized with off days
  // This ensures we have the correct number of days and won't miss the last day
  const totalDays = BASE_DAYS_PER_CYCLE * cycleCount;
  const shiftCodes: string[] = new Array(totalDays).fill(DAY_OFF_CODE);
  
  // Get all day keys in the schedule, including various capitalization formats
  const dayKeys = Object.keys(schedule).filter(k => 
    typeof k === 'string' && k.toLowerCase().startsWith('day_')
  );
  
  if (dayKeys.length === 0) {
    console.error(`Schedule id=${schedule.id} has no day fields (DAY_xxx)`);
    // We already created and initialized the shiftCodes array, just return it
    return shiftCodes;
  }
  
  // Build a map of day column names for faster lookups
  const dayColumnMap = new Map<string, string>();
  for (const key of dayKeys) {
    dayColumnMap.set(key.toLowerCase(), key);
  }
  
  for (let i = 1; i <= totalDays; i++) {
    // Handle cycle wrapping by using modulo arithmetic
    const dayIndex = ((i - 1) % BASE_DAYS_PER_CYCLE) + 1;
    const dayFieldPattern = `day_${String(dayIndex).padStart(3, '0')}`;
    
    // Try to find the actual column name in the schedule using our map
    let actualDayField = dayColumnMap.get(dayFieldPattern);
    
    // If not found with lowercase, try with uppercase
    if (!actualDayField) {
      actualDayField = dayColumnMap.get(dayFieldPattern.toUpperCase());
    }
    
    // If still not found, try with first letter capitalized
    if (!actualDayField) {
      const firstCapPattern = 'D' + dayFieldPattern.substring(1);
      actualDayField = dayColumnMap.get(firstCapPattern);
    }
    
    // Default to the standard format as a last resort
    if (!actualDayField) {
      actualDayField = `DAY_${String(dayIndex).padStart(3, '0')}`;
    }
    
    // Get the shift code for this day
    let shiftCode = schedule[actualDayField];
    
    // Try a case-insensitive lookup as a fallback if still not found
    if (shiftCode === undefined) {
      // Find any key that matches our day pattern
      const matchingKey = Object.keys(schedule).find(k => 
        k.toLowerCase() === dayFieldPattern ||
        k.toLowerCase() === dayFieldPattern.toUpperCase().toLowerCase()
      );
      
      if (matchingKey) {
        shiftCode = schedule[matchingKey];
      }
    }
    
    // Use DAY_OFF_CODE as the default value for off days
    shiftCodes[i-1] = shiftCode || DAY_OFF_CODE;
    
    // Log a sample of the shift codes for debugging
    if (i <= 3 || i >= totalDays - 2) {
      console.log(`Day ${i}: Field ${actualDayField} = ${shiftCode || DAY_OFF_CODE}`);
    }
  }
  
  return shiftCodes;
}

/**
 * Calculate how well the day patterns match between two schedules
 * The pattern match is based on the total number of days
 */
export function calculatePatternScore(userPattern: number[], otherPattern: number[]): number {
  let matchCount = 0;
  let userWorkDayCount = 0;
  let userOffDayCount = 0;
  
  // First, count the user's work days and off days
  for (let i = 0; i < userPattern.length; i++) {
    if (userPattern[i] === 1) {
      userWorkDayCount++;
    } else {
      userOffDayCount++;
    }
    
    // Count days that match between user and other pattern
    if (userPattern[i] === otherPattern[i]) {
      matchCount++;
    }
  }
  
  console.log(`Pattern comparison: ${userWorkDayCount} work days, ${userOffDayCount} off days, ${matchCount} matching days out of ${userPattern.length} total`);
  
  // Calculate the percentage of matching days out of total days
  const patternPercent = (matchCount / userPattern.length) * 100;
  
  // Return the pattern match percentage
  return patternPercent;
}

/**
 * Calculate the pattern score based on the user's total number of shifts
 * This gives a percentage based on how many of the user's ON shifts match with the other pattern
 */
export function calculateUserShiftPatternScore(userPattern: number[], otherPattern: number[]): number {
  // DEBUG - First, log the raw patterns
  console.log('DEBUG userShiftPatternScore - INPUTS:');
  console.log('userPattern:', JSON.stringify(userPattern));
  console.log('otherPattern:', JSON.stringify(otherPattern));
  
  let matchCount = 0;
  let userOnShiftCount = 0;
  
  // Create debug arrays to visualize the matching process
  const debugMatches: string[] = [];
  
  // Count user's total ON shifts and how many are matched
  for (let i = 0; i < userPattern.length; i++) {
    // Only consider ON days (value=1) for the user
    if (userPattern[i] === 1) {
      userOnShiftCount++;
      
      // Track each user ON day
      let matchStatus = "NO_MATCH";
      
      // If patterns match on this day, count it
      if (userPattern[i] === otherPattern[i]) {
        matchCount++;
        matchStatus = "MATCHED";
      }
      
      // Add to debug array
      debugMatches.push(`Day ${i+1}: User=${userPattern[i]}, Other=${otherPattern[i]}, Status=${matchStatus}`);
    }
  }
  
  // If user has no on-shifts, avoid division by zero
  if (userOnShiftCount === 0) {
    console.log('DEBUG: userOnShiftCount is ZERO! Returning 0%');
    return 0;
  }
  
  // Log the detailed matching information
  console.log('DEBUG - MATCHING DETAILS:');
  debugMatches.forEach(match => console.log(match));
  
  console.log(`DEBUG SUMMARY: ${matchCount} matched ON shifts out of ${userOnShiftCount} user ON shifts`);
  
  // Calculate the percentage of matching ON shifts out of user's total ON shifts
  const userShiftPatternPercent = (matchCount / userOnShiftCount) * 100;
  
  console.log(`DEBUG FINAL: Score = (${matchCount} / ${userOnShiftCount}) * 100 = ${userShiftPatternPercent}%`);
  console.log(`DEBUG INSPECTION - matchCount: ${typeof matchCount} ${matchCount}, userOnShiftCount: ${typeof userOnShiftCount} ${userOnShiftCount}`);
  
  // Store the userOnShiftCount for later use
  // This will be accessed from the main function and added to the result
  // @ts-ignore - Extra property for internal usage
  calculateUserShiftPatternScore.userOnShiftCount = userOnShiftCount;
  
  // Return the user shift pattern match percentage
  return userShiftPatternPercent;
}

/**
 * Calculate how different the shift codes are on common work days
 */
export function calculateShiftDifferenceScore(
  shifts1: string[], 
  shifts2: string[]
): number {
  // First, find common work days
  const commonWorkDays: number[] = [];
  
  for (let i = 0; i < shifts1.length; i++) {
    if (shifts1[i] !== DAY_OFF_CODE && shifts2[i] !== DAY_OFF_CODE) {
      commonWorkDays.push(i);
    }
  }
  
  if (commonWorkDays.length === 0) {
    return 0; // No common work days, so no meaningful difference score
  }
  
  // Calculate different shift codes on common work days
  let differentShifts = 0;
  
  for (const day of commonWorkDays) {
    if (shifts1[day] !== shifts2[day]) {
      differentShifts++;
    }
  }
  
  return (differentShifts / commonWorkDays.length) * 100;
}

/**
 * Combine pattern and shift difference scores into a single mirror score
 */
export function combineMirrorScores(patternScore: number, shiftDiffScore: number): number {
  // An ideal mirror has high pattern match and high shift difference
  const patternWeight = 0.7;
  const shiftDiffWeight = 0.3;
  
  // Calculate weighted score
  const combinedScore = (patternScore * patternWeight) + (shiftDiffScore * shiftDiffWeight);
  
  // Round to 2 decimal places
  return Math.round(combinedScore * 100) / 100;
}

/**
 * Calculate a meaningful trade score that considers the actual time differences
 * This is a more sophisticated scoring that focuses on trade value
 */
export function calculateMeaningfulTradeScore(
  patternScore: number,
  averageTimeDifferenceScore: number,
  significantDifferenceCount: number,
  totalWorkDays: number
): number {
  // We need special handling for near-identical lines (like cloned lines 42/42a)
  // If the time difference is very low but pattern match is very high, this is likely
  // a cloned/identical line which has little trade value
  
  // If we have near perfect pattern match (>95%) but very little time difference (<10),
  // this is likely a cloned line with minimal trade value
  if (patternScore > 95 && averageTimeDifferenceScore < 10 && significantDifferenceCount < 2) {
    console.log("Detected likely clone line - reducing trade score");
    // Return a low score for near-identical lines
    return 10.0; // Very low trade value for cloned lines
  }
  
  // Special handling for lines with minimal time differences
  // These are likely minor variations of the same shift pattern (e.g., 14:30-01:00 vs 14:30-00:00)
  if (patternScore > 75 && averageTimeDifferenceScore < 20 && significantDifferenceCount < 5) {
    console.log("Detected minor shift time variations - reducing trade score");
    // Return a moderate-low score for similar shift patterns with minor time differences
    return 25.0 + (significantDifferenceCount * 1.5); // Base score with small bonus for each significant difference
  }
  
  // Pattern match is still important for a good mirror
  const patternWeight = 0.4;
  
  // Time difference is now more important for meaningful trades
  const timeDiffWeight = 0.3;
  
  // The count of significant differences relative to total workdays is also important
  const significantDiffWeight = 0.3;
  
  // Normalize the significant difference ratio to a 0-100 scale
  const significantDiffRatio = totalWorkDays > 0
    ? (significantDifferenceCount / totalWorkDays) * 100
    : 0;
  
  // Calculate weighted score
  const meaningfulScore = 
    (patternScore * patternWeight) + 
    (averageTimeDifferenceScore * timeDiffWeight) +
    (significantDiffRatio * significantDiffWeight);
  
  // Log the calculated score components for debugging
  console.log(`Trade score components: pattern=${patternScore} (${patternWeight}), timeDiff=${averageTimeDifferenceScore} (${timeDiffWeight}), sigDiff=${significantDiffRatio} (${significantDiffWeight})`);
  console.log(`Final score: ${meaningfulScore}`);
  
  // Round to 2 decimal places
  return Math.round(meaningfulScore * 100) / 100;
}

/**
 * Create a detailed comparison of shifts between two lines
 * @param startDate Optional start date for the schedule, defaults to today
 */
export function compareShifts(
  shifts1: string[], 
  shifts2: string[],
  shiftCodeMap?: Map<string, { category: string, begin: string, end: string }>,
  startDate: Date = new Date()
): MirrorComparison[] {
  const comparison: MirrorComparison[] = [];
  
  for (let i = 0; i < shifts1.length; i++) {
    // Calculate the date for this day
    const dayDate = addDays(startDate, i);
    
    // We no longer skip off days, so all dates will be included in the comparison
    // This ensures April 24th always shows in the list regardless of shift patterns
    
    // Check if either shift is a day off
    const userIsOff = shifts1[i] === DAY_OFF_CODE;
    const otherIsOff = shifts2[i] === DAY_OFF_CODE;
    
    // Create the comparison object - don't automatically count off days as differences
    // Only count as different if they're both work days with different shifts
    const isDifferent = shifts1[i] !== shifts2[i] && !(userIsOff || otherIsOff);
    
    const comparisonItem: MirrorComparison = {
      day: i + 1,
      date: format(dayDate, 'yyyy-MM-dd'),
      userShift: shifts1[i],
      otherShift: shifts2[i],
      isDifferent: isDifferent,
      // Add a flag to indicate this is a work/off day mismatch, not a shift difference
      isWorkDayMismatch: (userIsOff && !otherIsOff) || (!userIsOff && otherIsOff)
    };
    
    // Variables to store time information
    let userBegin = "";
    let userEnd = "";
    let otherBegin = "";
    let otherEnd = "";
    
    // Add time info if available
    if (shiftCodeMap) {
      if (shifts1[i] !== DAY_OFF_CODE) {
        const shiftInfo = shiftCodeMap.get(shifts1[i]);
        if (shiftInfo) {
          userBegin = shiftInfo.begin;
          userEnd = shiftInfo.end;
          // Format the time directly without UTC timestamp
          comparisonItem.userTime = formatShiftTime(userBegin, userEnd);
        }
      }
      
      if (shifts2[i] !== DAY_OFF_CODE) {
        const shiftInfo = shiftCodeMap.get(shifts2[i]);
        if (shiftInfo) {
          otherBegin = shiftInfo.begin;
          otherEnd = shiftInfo.end;
          // Format the time directly without UTC timestamp
          comparisonItem.otherTime = formatShiftTime(otherBegin, otherEnd);
        }
      }
      
      // Calculate time differences if both shifts have times
      if (userBegin && otherBegin && userEnd && otherEnd) {
        // Calculate start and end time differences in minutes
        const startDiff = calculateTimeDifferenceMinutes(userBegin, otherBegin);
        const endDiff = calculateTimeDifferenceMinutes(userEnd, otherEnd);
        
        // Store the time difference in minutes
        comparisonItem.startTimeDiffMinutes = startDiff;
        comparisonItem.endTimeDiffMinutes = endDiff;
        
        // Calculate the time difference score (0-100)
        comparisonItem.timeDifferenceScore = calculateTimeDifferenceScore(startDiff, endDiff);
        
        // Determine if this is a significant difference worth trading
        comparisonItem.isSignificantDifference = isSignificantTimeDifference(startDiff, endDiff);
        
        // Update the isDifferent flag based on significant difference
        // Two shifts might be technically "different" in their times, even if they have the same code
        // If the shifts have the same code but different times, we mark them as different only if the time difference is significant
        if (comparisonItem.userShift === comparisonItem.otherShift) {
          // Same shift code but possibly different times - mark as different only if significant time difference
          comparisonItem.isDifferent = comparisonItem.isSignificantDifference;
        } else {
          // Different shift codes - keep as different but track significance separately
          comparisonItem.isDifferent = true;
        }
      }
    }
    
    comparison.push(comparisonItem);
  }
  
  return comparison;
}

/**
 * Helper functions for time calculations
 */

// Parse a time string into hours and minutes
function parseTimeString(timeStr: string): { hours: number, minutes: number } | null {
  if (!timeStr) return null;
  
  // Convert to string and standardize
  const timeString = String(timeStr).trim();
  
  try {
    // Handle HH:MM format (e.g., "14:30")
    const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      return {
        hours: parseInt(timeMatch[1], 10),
        minutes: parseInt(timeMatch[2], 10)
      };
    }
    
    // Handle time range like "14:30-01:00" by taking the first part
    const rangeMatch = timeString.match(/^(\d{1,2}):(\d{2})-/);
    if (rangeMatch) {
      return {
        hours: parseInt(rangeMatch[1], 10),
        minutes: parseInt(rangeMatch[2], 10)
      };
    }
    
    // Handle numeric format (e.g., "1430" for 14:30)
    const numericMatch = timeString.match(/^(\d{2})(\d{2})$/);
    if (numericMatch) {
      return {
        hours: parseInt(numericMatch[1], 10),
        minutes: parseInt(numericMatch[2], 10)
      };
    }
    
    // Handle timestamp format in any date string that contains HH:MM
    // This fixes the issue with parsing "Wed Dec 31 1969 20:00:00 GMT-0500" style timestamps
    const timestampMatch = timeString.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
    if (timestampMatch) {
      return {
        hours: parseInt(timestampMatch[1], 10),
        minutes: parseInt(timestampMatch[2], 10)
      };
    }
    
    // Debug: Log the time string that couldn't be parsed
    console.log(`Could not parse time string: "${timeString}"`);
  } catch (e) {
    console.error("Error parsing time string:", e, timeString);
  }
  
  return null;
}

// Calculate time difference in minutes between two time strings
function calculateTimeDifferenceMinutes(time1: string, time2: string): number {
  const t1 = parseTimeString(time1);
  const t2 = parseTimeString(time2);
  
  if (!t1 || !t2) {
    console.log(`Unable to calculate time difference - parsing failed for one or both times: "${time1}", "${time2}"`);
    return 0;
  }
  
  // Convert both times to minutes since midnight
  const t1Minutes = (t1.hours * 60) + t1.minutes;
  const t2Minutes = (t2.hours * 60) + t2.minutes;
  
  // Calculate the absolute difference
  let diffMinutes = Math.abs(t1Minutes - t2Minutes);
  
  // Handle overnight shifts (e.g., 22:00 vs 02:00)
  // If the difference is more than 12 hours, it might be an overnight situation
  if (diffMinutes > 12 * 60) {
    diffMinutes = 24 * 60 - diffMinutes;
  }
  
  return diffMinutes;
}

// Calculate meaningful difference score based on time difference
function calculateTimeDifferenceScore(startDiffMinutes: number, endDiffMinutes: number): number {
  // Constants for scoring
  const MINOR_THRESHOLD = 30; // 30 minutes
  const MODERATE_THRESHOLD = 120; // 2 hours
  const MAJOR_THRESHOLD = 240; // 4 hours
  
  // Special cases for minor shift differences
  const isSmallTimeDifference = (
    // Both start and end times differ by less than 90 minutes each
    startDiffMinutes < 90 && endDiffMinutes < 90
  );
  
  // Calculate base scores for start and end times
  let startScore = 0;
  let endScore = 0;
  
  // Apply a strong discount to shifts with small time differences
  // These are typical shift variants that shouldn't be highly scored for trading
  if (isSmallTimeDifference) {
    console.log("Detected small shift time difference - significantly reducing score");
    // Apply a scaled penalty based on how small the difference is
    // The smaller the difference, the lower the score
    const smallestDiff = Math.min(startDiffMinutes, endDiffMinutes);
    // Score from 5-15 based on the smallest difference
    return 5 + (smallestDiff / 90) * 10; // Low score to severely reduce trade value
  }
  
  // Score start time difference
  if (startDiffMinutes < MINOR_THRESHOLD) {
    // Minor differences (< 30 mins) get low scores
    startScore = (startDiffMinutes / MINOR_THRESHOLD) * 25; // Max 25 points
  } else if (startDiffMinutes < MODERATE_THRESHOLD) {
    // Moderate differences (30 mins - 2 hours) get medium scores
    startScore = 25 + ((startDiffMinutes - MINOR_THRESHOLD) / 
                     (MODERATE_THRESHOLD - MINOR_THRESHOLD)) * 25; // 25-50 points
  } else if (startDiffMinutes < MAJOR_THRESHOLD) {
    // Major differences (2-4 hours) get high scores
    startScore = 50 + ((startDiffMinutes - MODERATE_THRESHOLD) / 
                     (MAJOR_THRESHOLD - MODERATE_THRESHOLD)) * 25; // 50-75 points
  } else {
    // Extreme differences (> 4 hours) get maximum scores
    startScore = 75 + (Math.min(startDiffMinutes, MAJOR_THRESHOLD * 2) - MAJOR_THRESHOLD) / 
                     MAJOR_THRESHOLD * 25; // 75-100 points, capped
  }
  
  // Score end time difference (similar logic)
  if (endDiffMinutes < MINOR_THRESHOLD) {
    endScore = (endDiffMinutes / MINOR_THRESHOLD) * 25;
  } else if (endDiffMinutes < MODERATE_THRESHOLD) {
    endScore = 25 + ((endDiffMinutes - MINOR_THRESHOLD) / 
                   (MODERATE_THRESHOLD - MINOR_THRESHOLD)) * 25;
  } else if (endDiffMinutes < MAJOR_THRESHOLD) {
    endScore = 50 + ((endDiffMinutes - MODERATE_THRESHOLD) / 
                   (MAJOR_THRESHOLD - MODERATE_THRESHOLD)) * 25;
  } else {
    endScore = 75 + (Math.min(endDiffMinutes, MAJOR_THRESHOLD * 2) - MAJOR_THRESHOLD) / 
                   MAJOR_THRESHOLD * 25;
  }
  
  // Combine scores, weighting start time slightly higher
  return (startScore * 0.6) + (endScore * 0.4);
}

// Determine if a time difference is significant enough for trading
function isSignificantTimeDifference(startDiffMinutes: number, endDiffMinutes: number): boolean {
  // Handle invalid inputs - if either value is NaN or undefined, treat as not significant
  if (isNaN(startDiffMinutes) || isNaN(endDiffMinutes) || 
      startDiffMinutes === undefined || endDiffMinutes === undefined) {
    console.log("Invalid time difference values, marking as not significant");
    return false;
  }
  
  // Constants for significance - further increased thresholds to exclude small differences
  const START_SIGNIFICANCE = 60; // 60 minutes difference in start time is significant (increased from 45)
  const END_SIGNIFICANCE = 75;   // 75 minutes difference in end time is significant (increased from 60)
  const TOTAL_SIGNIFICANCE = 120; // Total difference of 2 hours is significant (increased from 1.5 hours)
  
  // Special case for common differences under 90 minutes that shouldn't be considered significant
  // (e.g. 14:30-01:00 vs 14:30-00:00 or similar small variations)
  const isSmallShiftDiff = (
    // Start times are the same or very close (within 15 minutes)
    startDiffMinutes <= 15 && 
    // End time differs by less than 90 minutes
    endDiffMinutes <= 90
  ) || (
    // OR end times are the same or very close (within 15 minutes)
    endDiffMinutes <= 15 &&
    // Start time differs by less than 90 minutes
    startDiffMinutes <= 90
  );
  
  console.log(`Checking significance: start=${startDiffMinutes}, end=${endDiffMinutes}, total=${startDiffMinutes + endDiffMinutes}, isSmallShiftDiff=${isSmallShiftDiff}`);
  
  // Skip small shift differences that aren't meaningful for trades
  if (isSmallShiftDiff) {
    return false;
  }
  
  // A difference is significant if:
  // 1. Either start time has a major difference, OR
  // 2. End time has a major difference, OR
  // 3. The total shift time difference exceeds the threshold
  return (
    startDiffMinutes >= START_SIGNIFICANCE || 
    endDiffMinutes >= END_SIGNIFICANCE ||
    (startDiffMinutes + endDiffMinutes) >= TOTAL_SIGNIFICANCE
  );
}

/**
 * Format shift time to display nicely
 */
function formatShiftTime(begin: string, end: string): string {
  // Handle the case where begin or end might be null/undefined
  if (!begin || !end) return "";
  
  // Remove any full timestamps and just use the time part if it exists
  const formatTimePart = (time: string) => {
    // Make sure we're working with a string
    const timeStr = String(time);
    
    try {
      // Check if it's already in a simple format like "06:45"
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        return timeStr;
      }
      
      // Handle date strings like "Wed Dec 31 1969 20:00:00 GMT-0500"
      if (timeStr.includes("GMT")) {
        const match = timeStr.match(/\b(\d{1,2}):(\d{2}):\d{2}\b/);
        if (match) {
          const hours = match[1].padStart(2, '0');
          return `${hours}:${match[2]}`;
        }
      }
      
      // If it contains a timestamp with hours/minutes, extract it
      const match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        // Ensure hours are padded with leading zero for military time format
        const hours = match[1].padStart(2, '0');
        return `${hours}:${match[2]}`;
      }
      
      // Try to parse as numeric time (e.g., "0630")
      const numericMatch = timeStr.match(/^(\d{2})(\d{2})$/);
      if (numericMatch) {
        return `${numericMatch[1]}:${numericMatch[2]}`;
      }
    } catch (e) {
      console.error("Error formatting time part:", e, time);
    }
    
    // Otherwise just return as is
    return timeStr;
  };
  
  const formattedBegin = formatTimePart(begin);
  const formattedEnd = formatTimePart(end);
  
  // Return in 24-hour military time format
  return `${formattedBegin}-${formattedEnd}`;
}

/**
 * Count the number of shifts with same/different categories and times
 */
export function countShiftDifferences(comparisons: MirrorComparison[]): {
  sameCategoryCount: number;
  differentCategoryCount: number;
  sameTimeCount: number;
  differentTimeCount: number;
  significantDifferenceCount: number;
  workDayMismatchCount: number;  // New counter for work/off day mismatches
  averageTimeDifferenceScore: number;
} {
  // Initialize counters
  let sameCategoryCount = 0;
  let differentCategoryCount = 0;
  let sameTimeCount = 0;
  let differentTimeCount = 0;
  let significantDifferenceCount = 0;
  let workDayMismatchCount = 0;  // New counter for work/off day mismatches
  let totalTimeDifferenceScore = 0;
  let timeDifferenceCount = 0;
  
  // Count shifts with same/different categories and times
  for (const comparison of comparisons) {
    // Count work day mismatches separately
    if (comparison.isWorkDayMismatch) {
      workDayMismatchCount++;
      continue;  // Skip further processing for work/off day mismatches
    }
    
    // Skip if both are off days (this should be handled before this function is called)
    if (comparison.userShift === DAY_OFF_CODE && comparison.otherShift === DAY_OFF_CODE) {
      continue;
    }
    
    // Count based on difference - now we only count actual shift differences
    if (comparison.isDifferent) {
      differentCategoryCount++;
      
      // Check time difference if available
      if (comparison.userTime && comparison.otherTime) {
        differentTimeCount++;
      }
    } else {
      sameCategoryCount++;
      
      // Check time similarity if available
      if (comparison.userTime && comparison.otherTime) {
        sameTimeCount++;
      }
    }
    
    // Track significant differences
    if (comparison.isSignificantDifference) {
      significantDifferenceCount++;
    }
    
    // Track time difference scores for averaging
    if (comparison.timeDifferenceScore !== undefined) {
      totalTimeDifferenceScore += comparison.timeDifferenceScore;
      timeDifferenceCount++;
    }
  }
  
  // Calculate average time difference score
  const averageTimeDifferenceScore = timeDifferenceCount > 0
    ? totalTimeDifferenceScore / timeDifferenceCount
    : 0;
  
  return {
    sameCategoryCount,
    differentCategoryCount,
    sameTimeCount,
    differentTimeCount,
    significantDifferenceCount,
    workDayMismatchCount,  // Return the new counter
    averageTimeDifferenceScore
  };
}

export default {
  findMirroredLines,
  calculatePatternScore,
  calculateUserShiftPatternScore,
  calculateShiftDifferenceScore,
  extractDayPattern,
  extractShiftCodes,
  compareShifts,
  calculateMeaningfulTradeScore,
  countShiftDifferences
};