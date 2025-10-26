// src/utils/ical/formatters.js
/**
 * Formats a date to iCal format (YYYYMMDDTHHMMSS)
 * @param {Date|string} date - The date to format
 * @returns {string} - Date in iCal format
 */
export function formatICalDate(date) {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date provided to formatICalDate:", date);
      throw new Error("Invalid date provided");
    }
    
    // Format: YYYYMMDDTHHMMSS
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  } catch (error) {
    console.error("Error formatting date for iCal:", error);
    // Return a default value for graceful failure
    return "19700101T000000";
  }
}

/**
 * Creates a current timestamp in iCal format for the DTSTAMP field
 * @returns {string} - Current timestamp in iCal format
 */
export function getCurrentTimestamp() {
  return formatICalDate(new Date());
}

/**
 * Generate a unique ID for an iCal event
 * @param {string} prefix - Prefix for the ID
 * @param {number} index - Index or counter for uniqueness
 * @returns {string} - Unique ID for the event
 */
export function generateEventId(prefix, index) {
  const timestamp = Date.now();
  return `${timestamp}-${prefix}-${index}@shiftcalc.app`;
}

/**
 * Escapes special characters in iCal text fields
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeICalText(text) {
  if (!text) return "";
  
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}
