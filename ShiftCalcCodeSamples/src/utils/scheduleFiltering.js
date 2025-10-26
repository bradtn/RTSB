// src/utils/scheduleFiltering.js
// Utilities for filtering and scoring schedules based on user criteria

import { calculateScheduleScore } from "@/lib/scheduler/scoring";

/**
 * Expand shift categories and lengths to specific shift codes
 * @param {Array} shiftCodes - All available shift codes
 * @param {Object} criteria - Filter criteria containing categories and lengths
 * @returns {Array} - Expanded list of specific shift codes
 */
export function expandShiftCategoriesAndLengths(shiftCodes, criteria) {
  if (!criteria || !criteria.selectedShiftCategories || !criteria.selectedShiftLengths) {
    console.warn("No criteria for expanding categories and lengths");
    return [];
  }
  
  if (!criteria.selectedShiftCategories.length && !criteria.selectedShiftLengths.length) {
    console.log("No categories or lengths selected to expand");
    return [];
  }
  
  console.log("Expanding categories:", criteria.selectedShiftCategories);
  console.log("Expanding lengths:", criteria.selectedShiftLengths);
  
  return shiftCodes
    .filter(code => 
      (criteria.selectedShiftCategories.length === 0 || 
       criteria.selectedShiftCategories.includes(code.category)) &&
      (criteria.selectedShiftLengths.length === 0 || 
       criteria.selectedShiftLengths.includes(code.length))
    )
    .map(code => code.code);
}

/**
 * Validate and normalize criteria to ensure all required fields have proper values
 * @param {Object} criteria - The criteria to validate
 * @returns {Object} - Validated criteria with proper defaults
 */
export function validateCriteria(criteria) {
  return {
    selectedGroups: criteria.selectedGroups || [],
    dayOffDates: criteria.dayOffDates || [],
    selectedShiftCodes: criteria.selectedShiftCodes || [],
    selectedShiftCategories: criteria.selectedShiftCategories || [],
    selectedShiftLengths: criteria.selectedShiftLengths || [],
    shiftCategoryIntent: criteria.shiftCategoryIntent || 'any', // 'any' or 'mix'
    weights: {
      groupWeight: Number(criteria.weights?.groupWeight ?? 1),
      daysWeight: Number(criteria.weights?.daysWeight ?? 1),
      shiftWeight: Number(criteria.weights?.shiftWeight ?? 1),
      blocks5dayWeight: Number(criteria.weights?.blocks5dayWeight ?? 0),
      blocks4dayWeight: Number(criteria.weights?.blocks4dayWeight ?? 0),
      weekendWeight: Number(criteria.weights?.weekendWeight ?? 1),
      saturdayWeight: Number(criteria.weights?.saturdayWeight ?? 1),
      sundayWeight: Number(criteria.weights?.sundayWeight ?? 1)
    }
  };
}

/**
 * Filter and score schedules based on user criteria
 * @param {Array} schedules - The schedules to filter
 * @param {Object} criteria - The filtering criteria
 * @param {Array} shiftCodes - All available shift codes for expansion
 * @returns {Object} - Results with filtered schedules and error info
 */
export async function filterSchedules(schedules, criteria, shiftCodes) {
  // Create a result object
  const result = {
    filteredSchedules: [],
    errorCount: 0,
    hasError: false,
    errorMessage: null,
    totalProcessed: 0
  };
  
  try {
    // Skip if no schedules are loaded or no criteria is available
    if (schedules.length === 0) {
      result.hasError = true;
      result.errorMessage = "No schedules available";
      return result;
    }
    
    if (!criteria) {
      result.hasError = true;
      result.errorMessage = "No criteria available";
      return result;
    }
    
    // Validate the criteria
    const validatedCriteria = validateCriteria(criteria);
    
    // Expand categories and lengths into specific shift codes
    const expandedCodes = expandShiftCategoriesAndLengths(shiftCodes, validatedCriteria);
    console.log("Expanded codes from categories:", expandedCodes.length);
    
    // Create processed criteria with expanded codes
    const processedCriteria = {
      ...validatedCriteria,
      selectedShiftCodes: [
        ...(validatedCriteria.selectedShiftCodes || []), 
        ...expandedCodes
      ]
    };
    
    // Apply filters to schedules with error handling for each schedule
    const processed = [];
    
    for (const schedule of schedules) {
      result.totalProcessed++;
      
      try {
        // Check for required properties on the schedule
        if (!schedule || !schedule.id) {
          console.warn("Invalid schedule found, skipping:", schedule);
          continue;
        }
        
        // Try to get a score, with fallback to 0 on error
        let scoreResult;
        try {
          scoreResult = await calculateScheduleScore(schedule, processedCriteria);
        } catch (scoreError) {
          console.error("Error calculating score for schedule:", schedule.id, scoreError);
          result.errorCount++;
          continue;
        }
        
        // Ensure we have a valid score (defensive coding)
        if (!scoreResult || typeof scoreResult.score !== 'number') {
          console.warn("Invalid score result for schedule:", schedule.id, scoreResult);
          result.errorCount++;
          continue;
        }
        
        // Add to processed results
        processed.push({
          id: schedule.id,
          line: String(schedule.LINE || 'Unknown'),
          group: schedule.GROUP || "Unknown",
          matchScore: scoreResult.score,
          weekendsOn: scoreResult.weekendsOn || 0,
          saturdaysOn: scoreResult.saturdaysOn || 0,
          sundaysOn: scoreResult.sundaysOn || 0,
          blocks5day: scoreResult.blocks5day || 0,
          blocks4day: scoreResult.blocks4day || 0,
          explanation: scoreResult.explanation || ''
        });
      } catch (scheduleError) {
        console.error("Error processing schedule:", schedule.id, scheduleError);
        result.errorCount++;
        continue;
      }
    }
    
    // Filter out any invalid scores
    const validScores = processed.filter(schedule => {
      const validScore = !isNaN(schedule.matchScore) && schedule.matchScore > 0;
      if (!validScore) {
        console.log(`Filtered out schedule ${schedule.line}: score=${schedule.matchScore}`);
        result.errorCount++;
      }
      return validScore;
    });
    
    console.log(`Schedules after filtering: ${validScores.length} of ${schedules.length}`);
    
    // Sort by score (descending)
    const sortedSchedules = [...validScores].sort((a, b) => b.matchScore - a.matchScore);
    
    // Return the filtered schedules
    result.filteredSchedules = sortedSchedules;
    
  } catch (error) {
    console.error("Error filtering schedules:", error);
    result.hasError = true;
    result.errorMessage = error.message || "Unknown error filtering schedules";
  }
  
  return result;
}