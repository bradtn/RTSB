// src/utils/holidayCalculator.js
// Handles Canadian holiday calculations and schedule integration

import Holidays from 'date-holidays'; // You'll need to install this package with npm/yarn

// Configuration - you might want to make these configurable in your admin settings
const DEFAULT_COUNTRY = 'CA'; // Canada 
const DEFAULT_PROVINCE = null; // No province-specific holidays by default

// Cache instances of the holiday calculator for performance
const holidayInstances = {};

/**
* Gets or creates a holiday calculator instance for the specified province
* @param {string|null} province - The province code (e.g., 'ON' for Ontario) or null for federal only
* @returns {Holidays} The holiday calculator instance
*/
function getHolidayInstance(province = null) {
 const key = province || 'federal';
 if (!holidayInstances[key]) {
   // If province is provided, use CA-{PROVINCE} format, otherwise just CA
   const regionCode = province ? `${DEFAULT_COUNTRY}-${province}` : DEFAULT_COUNTRY;
   holidayInstances[key] = new Holidays(regionCode);
 }
 return holidayInstances[key];
}

/**
* Gets all holidays for a specific year and province
* @param {number} year - The year to get holidays for
* @param {string|null} province - The province code or null for federal only
* @returns {Array} List of holidays with name, date, etc.
*/
export function getHolidaysForYear(year, province = null) {
 const hd = getHolidayInstance(province);
 const holidays = hd.getHolidays(year);
 
 // Include all holidays (both statutory and observances)
 console.log(`Found ${holidays.length} total holidays for year ${year}`);
 
 // The library returns dates as ISO strings with time, we need to REMOVE the time
 return holidays.map(holiday => {
   // Split by space and take just the date part, removing the time completely
   const formattedDate = holiday.date.split(' ')[0];
   return {
     ...holiday,
     // Keep ONLY the YYYY-MM-DD part for comparison
     date: formattedDate
   };
 });
}

/**
* Checks if a given date falls on a holiday
* @param {Date|string} date - The date to check
* @param {Array} holidays - List of holiday objects with date properties
* @returns {boolean} True if the date is a holiday
*/
function isHolidayDate(date, holidays) {
 // Convert date to ISO string and extract YYYY-MM-DD portion for comparison
 const dateString = date instanceof Date 
   ? date.toISOString().split('T')[0] 
   : new Date(date).toISOString().split('T')[0];
 
 // Debug holiday detection
 if (holidays.length > 0) {
   // Show sample holiday dates to compare with format
   const sampleHolidays = holidays.slice(0, 3).map(h => `${h.name}:${h.date}`);
   console.log(`Checking if ${dateString} matches any of these holidays: ${sampleHolidays.join(', ')}`);
 }
 
 const isHoliday = holidays.some(holiday => {
   const matches = holiday.date === dateString;
   if (matches) {
     console.log(`Holiday found on shift date: ${dateString} - ${holiday.name}`);
   }
   return matches;
 });
 
 return isHoliday;
}

/**
* Counts how many holidays a schedule has shifts on
* @param {Object} schedule - The schedule object containing shifts
* @param {string|null} province - Optional province code for provincial holidays
* @returns {number} The count of holidays with shifts
*/
export function countHolidaysInSchedule(schedule, province = null) {
 // Handle invalid input gracefully
 if (!schedule || !schedule.shifts || !Array.isArray(schedule.shifts)) {
   console.log('No shifts found in schedule:', schedule?.id || 'unknown');
   return 0;
 }
 
 console.log(`Schedule ${schedule.id || schedule.line} has ${schedule.shifts.length} shifts to check`);
 
 // Early debugging of shift data
 if (schedule.shifts.length > 0) {
   const firstShift = schedule.shifts[0];
   const lastShift = schedule.shifts[schedule.shifts.length - 1];
   console.log(`First shift: date=${firstShift.date}, code=${firstShift.code}`);
   console.log(`Last shift: date=${lastShift.date}, code=${lastShift.code}`);
 } else {
   console.log('WARNING: Schedule has empty shifts array!');
   return 0;
 }
 
 // Determine which years we need holiday data for
 const years = new Set();
 schedule.shifts.forEach(shift => {
   if (shift.date) {
     try {
       const date = new Date(shift.date);
       if (!isNaN(date.getTime())) {
         years.add(date.getFullYear());
       } else {
         console.log(`Invalid date format: ${shift.date}`);
       }
     } catch (e) {
       // Skip invalid dates
       console.error('Error parsing date:', shift.date, e);
     }
   }
 });
 
 // If no valid years found, return early
 if (years.size === 0) {
   console.log('No valid years found in shift dates');
   return 0;
 }
 
 console.log('Years found in schedule:', Array.from(years));
 
 // Get holidays for all years in the schedule
 let allHolidays = [];
 years.forEach(year => {
   const yearHolidays = getHolidaysForYear(year, province);
   console.log(`Found ${yearHolidays.length} holidays for year ${year}`);
   allHolidays = [...allHolidays, ...yearHolidays];
 });
 
 // Log all holidays for verification
 if (allHolidays.length > 0) {
   console.log(`All ${allHolidays.length} holidays for comparison:`);
   allHolidays.forEach(h => {
     console.log(`- ${h.name}: ${h.date}`);
   });
 }
 
 // Count shifts that fall on holidays
 let count = 0;
 let checked = 0;
 for (const shift of schedule.shifts) {
   if (!shift.date) {
     console.log('Shift missing date property');
     continue;
   }
   
   // Skip days off (where code is "----")
   if (shift.code === "----") {
     continue;
   }
   
   checked++;
   if (checked <= 5 || checked % 50 === 0) {
     console.log(`Checking shift #${checked}: ${shift.date}, code: ${shift.code}`);
   }
   
   try {
     const shiftDate = new Date(shift.date);
     if (isNaN(shiftDate.getTime())) {
       console.log(`Invalid shift date: ${shift.date}`);
       continue; // Skip invalid dates
     }
     
     if (isHolidayDate(shiftDate, allHolidays)) {
       count++;
     }
   } catch (e) {
     // Skip this shift if date processing fails
     console.error('Error processing shift date:', e);
     continue;
   }
 }
 
 console.log(`Schedule ${schedule.id || schedule.line} has ${count} holidays on shifts`);
 return count;
}

/**
* Gets detailed information about which holidays are worked in a schedule
* @param {Object} schedule - The schedule object containing shifts
* @param {string|null} province - Optional province code for provincial holidays
* @returns {Array} List of holiday objects that have shifts scheduled
*/
export function getHolidaysWorked(schedule, province = null) {
 // Handle invalid input gracefully
 if (!schedule || !schedule.shifts || !Array.isArray(schedule.shifts)) {
   return [];
 }
 
 // Determine which years we need holiday data for
 const years = new Set();
 schedule.shifts.forEach(shift => {
   if (shift.date) {
     try {
       const date = new Date(shift.date);
       if (!isNaN(date.getTime())) {
         years.add(date.getFullYear());
       }
     } catch (e) {
       // Skip invalid dates
     }
   }
 });
 
 // If no valid years found, return early
 if (years.size === 0) {
   return [];
 }
 
 // Get holidays for all years in the schedule
 let allHolidays = [];
 years.forEach(year => {
   allHolidays = [...allHolidays, ...getHolidaysForYear(year, province)];
 });
 
 // Find which holidays have shifts
 const holidaysWorked = [];
 for (const shift of schedule.shifts) {
   if (!shift.date) continue;
   
   // Skip days off (where code is "----")
   if (shift.code === "----") {
     continue;
   }
   
   try {
     const shiftDate = new Date(shift.date);
     if (isNaN(shiftDate.getTime())) continue; // Skip invalid dates
     
     // Format the date for comparison
     const formattedShiftDate = shiftDate.toISOString().split('T')[0];
     
     // Find any holiday matching this shift date
     const matchingHoliday = allHolidays.find(holiday => 
       holiday.date === formattedShiftDate
     );
     
     if (matchingHoliday) {
       console.log(`Found matching holiday: ${matchingHoliday.name} on ${formattedShiftDate} with shift code ${shift.code}`);
       
       // Add shift information to the holiday object
       holidaysWorked.push({
         ...matchingHoliday,
         shiftCode: shift.code,
         shiftId: shift.id,
         // Format the date for display (avoid timezone issues completely)
         formattedDate: (() => {
           const [year, month, day] = matchingHoliday.date.split('-');
           const monthNames = [
             'January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December'
           ];
           return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
         })()
       });
     }
   } catch (e) {
     // Skip this shift if date processing fails
     console.error('Error processing holiday shift:', e);
     continue;
   }
 }
 
 console.log(`Found ${holidaysWorked.length} holidays worked in schedule ${schedule.id || schedule.line}`);
 return holidaysWorked;
}

/**
* Adds holiday information to schedule objects for display in results
* @param {Array} schedules - Array of schedule objects
* @param {string|null} province - Optional province code
* @returns {Array} Enhanced schedule objects with holiday counts
*/
export function enhanceSchedulesWithHolidays(schedules, province = null) {
 if (!Array.isArray(schedules)) return schedules;
 
 console.log('Enhancing schedules with holidays, count:', schedules.length);
 if (schedules.length > 0) {
   console.log('First schedule ID:', schedules[0]?.id || 'unknown');
   console.log('Has shifts?', Array.isArray(schedules[0]?.shifts), 
     schedules[0]?.shifts?.length || 0);
 }
 
 return schedules.map(schedule => {
   try {
     // Check if we actually have shift data
     if (!schedule.shifts || !Array.isArray(schedule.shifts) || schedule.shifts.length === 0) {
       console.log(`Schedule ${schedule.id || schedule.line} has no shifts data`);
       return {
         ...schedule,
         holidaysOn: 0
       };
     }
     
     // Count holidays
     const holidaysOn = countHolidaysInSchedule(schedule, province);
     
     return {
       ...schedule,
       holidaysOn
     };
   } catch (error) {
     console.error("Error enhancing schedule with holidays:", error);
     return {
       ...schedule,
       holidaysOn: 0
     };
   }
 });
}

/**
 * Gets the total number of holidays within the scheduling period
 * @param {string|null} province - Optional province code for provincial holidays
 * @param {Object} options - Options for calculating holidays
 * @param {string} [options.startDate] - Start date in YYYY-MM-DD format (required from admin settings)
 * @param {number} [options.numCycles=3] - Number of cycles in the scheduling period
 * @param {number} [options.daysPerCycle=56] - Days per cycle
 * @returns {Array} List of all holidays in the period
 */
export function getAllHolidaysInPeriod(province = null, options = {}) {
  // All options must be provided from admin settings
  if (!options.startDate) {
    throw new Error('startDate is required from admin settings');
  }
  
  const startDateStr = options.startDate;
  const numCycles = options.numCycles || 3;
  const daysPerCycle = options.daysPerCycle || 56;
  
  // Parse the start date
  const [yearStr, monthStr, dayStr] = startDateStr.split('-');
  const startDate = new Date(
    parseInt(yearStr),
    parseInt(monthStr) - 1,
    parseInt(dayStr)
  );
  
  // Calculate end date
  const totalDays = daysPerCycle * numCycles;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + totalDays - 1);
  
  console.log(`Calculating holidays from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
  // Determine which years we need to check
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const years = [];
  
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  
  // Get all holidays for these years
  let allHolidays = [];
  years.forEach(year => {
    const yearHolidays = getHolidaysForYear(year, province);
    allHolidays = [...allHolidays, ...yearHolidays];
  });
  
  // Filter to only holidays within our date range
  const holidaysInRange = allHolidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= startDate && holidayDate <= endDate;
  });
  
  console.log(`Found ${holidaysInRange.length} holidays in scheduling period`);
  return holidaysInRange;
}

/**
 * Gets the count of total holidays in the scheduling period
 * @param {string|null} province - Optional province code for provincial holidays
 * @param {Object} options - Options for calculating holidays
 * @returns {number} Total number of holidays in the period
 */
export function getTotalHolidaysCount(province = null, options = {}) {
  const holidays = getAllHolidaysInPeriod(province, options);
  return holidays.length;
}

/**
* Gets a list of all Canadian provinces with their codes
* Useful for UI selection components
* @returns {Array} List of province objects with code and name
*/
export function getCanadianProvinces() {
 return [
   { code: 'AB', name: 'Alberta' },
   { code: 'BC', name: 'British Columbia' },
   { code: 'MB', name: 'Manitoba' },
   { code: 'NB', name: 'New Brunswick' },
   { code: 'NL', name: 'Newfoundland and Labrador' },
   { code: 'NS', name: 'Nova Scotia' },
   { code: 'NT', name: 'Northwest Territories' },
   { code: 'NU', name: 'Nunavut' },
   { code: 'ON', name: 'Ontario' },
   { code: 'PE', name: 'Prince Edward Island' },
   { code: 'QC', name: 'Quebec' },
   { code: 'SK', name: 'Saskatchewan' },
   { code: 'YT', name: 'Yukon' }
 ];
}

// Quick self-test to verify the library works
(function testHolidayCalculator() {
 try {
   const testHd = new Holidays('CA');
   const holidays = testHd.getHolidays(2025);
   console.log('Holiday calculator test:');
   console.log('- Library loaded successfully');
   console.log('- Found', holidays.length, 'Canadian holidays for 2025');
   console.log('- First holiday:', holidays[0]?.name, 'on', holidays[0]?.date);
 } catch (e) {
   console.error('Holiday calculator test failed:', e.message);
 }
})();