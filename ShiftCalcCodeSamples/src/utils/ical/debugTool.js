// src/utils/ical/debugTool.js
import { generateICalContent, downloadICalFile } from './generator';

/**
 * Generate a test schedule for debugging
 * @param {number} days - Number of days to include
 * @returns {Object} - Test schedule
 */
export function generateTestSchedule(days = 14) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  const shifts = [];
  
  // Generate some test shifts
  for (let i = 0; i < days; i++) {
    // Skip some days to simulate days off
    if (i % 7 === 0 || i % 7 === 6) { // Skip "weekends"
      continue;
    }
    
    const shiftDate = new Date(startDate);
    shiftDate.setDate(startDate.getDate() + i);
    
    // Create morning shift (8am-4:30pm)
    const startTime = new Date(shiftDate);
    startTime.setHours(8, 0, 0, 0);
    
    const endTime = new Date(shiftDate);
    endTime.setHours(16, 30, 0, 0);
    
    shifts.push({
      day: i + 1,
      code: '08AM',
      startTime,
      endTime
    });
  }
  
  return {
    id: 999,
    line: 'TEST',
    group: 'DEBUG',
    shifts
  };
}

/**
 * Test the iCal generation functionality
 * @param {boolean} download - Whether to download the file
 * @returns {string} - iCal content if download is false
 */
export function testICalGeneration(download = false) {
  console.log("Testing iCal generation...");
  
  // Generate a test schedule
  const testSchedule = generateTestSchedule();
  console.log("Generated test schedule with", testSchedule.shifts.length, "shifts");
  
  if (download) {
    // Download as file
    downloadICalFile(testSchedule, { 
      filename: 'test-schedule.ics',
      debug: true 
    });
    return "Download initiated";
  } else {
    // Just return the content
    const content = generateICalContent(testSchedule, { debug: true });
    console.log("Generated iCal content:", content.substring(0, 500) + "...");
    return content;
  }
}

// Add this line to expose the test function to the browser console
if (typeof window !== 'undefined') {
  window.testICalGeneration = testICalGeneration;
}
