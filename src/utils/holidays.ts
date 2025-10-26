/**
 * Holiday utilities using Nager.Date API for accurate Canadian holidays
 */

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

interface Holiday {
  date: Date;
  name: string;
  global: boolean;
  counties: string[] | null;
  types: string[];
}

interface HolidayFilter {
  onlyGlobal?: boolean;          // Only nationwide holidays
  excludeProvinces?: string[];   // Exclude specific provinces (e.g., ['CA-QC'])
  includeProvinces?: string[];   // Only include specific provinces
  excludeTypes?: string[];       // Exclude holiday types (e.g., ['Observance', 'Optional'])
  includeTypes?: string[];       // Only include specific types (e.g., ['Public'])
  excludeHolidays?: string[];    // Exclude specific holidays by name
  includeHolidays?: string[];    // Only include specific holidays by name
}

// Cache to avoid repeated API calls
const holidayCache = new Map<string, Holiday[]>();

/**
 * Apply filters to holiday array
 */
function applyHolidayFilter(holidays: Holiday[], filter: HolidayFilter): Holiday[] {
  return holidays.filter(holiday => {
    // Filter by global/nationwide status
    if (filter.onlyGlobal && !holiday.global) {
      return false;
    }

    // Filter by provinces/territories
    if (filter.excludeProvinces?.length) {
      if (holiday.counties?.some(county => filter.excludeProvinces!.includes(county))) {
        return false;
      }
    }

    if (filter.includeProvinces?.length) {
      if (!holiday.counties?.some(county => filter.includeProvinces!.includes(county)) && !holiday.global) {
        return false;
      }
    }

    // Filter by holiday types
    if (filter.excludeTypes?.length) {
      if (holiday.types.some(type => filter.excludeTypes!.includes(type))) {
        return false;
      }
    }

    if (filter.includeTypes?.length) {
      if (!holiday.types.some(type => filter.includeTypes!.includes(type))) {
        return false;
      }
    }

    // Filter by specific holiday names
    if (filter.excludeHolidays?.length) {
      if (filter.excludeHolidays.includes(holiday.name)) {
        return false;
      }
    }

    if (filter.includeHolidays?.length) {
      if (!filter.includeHolidays.includes(holiday.name)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Fetches Canadian holidays for a given year from Nager.Date API with optional filtering
 */
async function fetchHolidaysForYear(year: number, filter?: HolidayFilter): Promise<Holiday[]> {
  const cacheKey = `CA-${year}-${filter ? JSON.stringify(filter) : 'nofilter'}`;
  
  // Check cache first
  if (holidayCache.has(cacheKey)) {
    return holidayCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CA`, {
      signal: AbortSignal.timeout(2000)
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const nagerHolidays: NagerHoliday[] = await response.json();
    
    // Convert to our format and apply filtering
    let holidays: Holiday[] = nagerHolidays.map(holiday => {
      // Parse date correctly to avoid timezone issues
      // API returns YYYY-MM-DD, so we parse as local date
      const [year, month, day] = holiday.date.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day); // month - 1 because Date constructor expects 0-indexed months
      
      
      return {
        date: parsedDate,
        name: holiday.localName || holiday.name,
        global: holiday.global,
        counties: holiday.counties,
        types: holiday.types
      };
    });

    // Apply filters
    if (filter) {
      holidays = applyHolidayFilter(holidays, filter);
    }

    // Add common non-official holidays that organizations often observe
    const additionalHolidays: Holiday[] = [
      { date: new Date(year, 11, 24), name: "Christmas Eve", global: false, counties: null, types: ["Optional"] },
      { date: new Date(year, 11, 31), name: "New Year's Eve", global: false, counties: null, types: ["Optional"] },
      { date: new Date(year, 9, 31), name: "Halloween", global: false, counties: null, types: ["Observance"] },
      { date: new Date(year, 1, 2), name: "Groundhog Day", global: false, counties: null, types: ["Observance"] },
      { date: new Date(year, 1, 14), name: "Valentine's Day", global: false, counties: null, types: ["Observance"] },
      { date: new Date(year, 2, 17), name: "St. Patrick's Day", global: false, counties: null, types: ["Observance"] }
    ];

    // Remove duplicates between API holidays and our additional holidays
    // Check both names and dates to catch holidays with different names but same dates
    const existingNames = new Set(holidays.map(h => h.name.toLowerCase()));
    const existingDates = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));
    const nonDuplicateAdditional = additionalHolidays.filter(h => {
      const holidayDateString = h.date.toISOString().split('T')[0];
      const isDuplicateName = existingNames.has(h.name.toLowerCase());
      const isDuplicateDate = existingDates.has(holidayDateString);
      
      
      return !isDuplicateName && !isDuplicateDate;
    });

    // Apply filters to additional holidays too
    const filteredAdditionalHolidays = filter ? applyHolidayFilter(nonDuplicateAdditional, filter) : nonDuplicateAdditional;
    const allHolidays = [...holidays, ...filteredAdditionalHolidays];
    
    // Sort by date
    allHolidays.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Cache the result
    holidayCache.set(cacheKey, allHolidays);
    
    return allHolidays;
  } catch (error) {
    console.warn(`Failed to fetch holidays for ${year}:`, error);
    
    // Fallback to manual calculation
    return getFallbackHolidays(year);
  }
}

/**
 * Fallback holiday calculation if API is unavailable
 */
function getFallbackHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];
  
  // Basic federal holidays with fixed dates
  holidays.push(
    { date: new Date(year, 0, 1), name: "New Year's Day", global: true, counties: null, types: ['Public'] },
    { date: new Date(year, 6, 1), name: "Canada Day", global: true, counties: null, types: ['Public'] },
    { date: new Date(year, 10, 11), name: "Remembrance Day", global: true, counties: null, types: ['Public'] },
    { date: new Date(year, 11, 25), name: "Christmas Day", global: true, counties: null, types: ['Public'] },
    { date: new Date(year, 11, 26), name: "Boxing Day", global: true, counties: null, types: ['Public'] }
  );

  // Calculated holidays (simplified)
  const getMonthlyHoliday = (month: number, weekday: number, occurrence: number) => {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = (7 + weekday - firstDay.getDay()) % 7;
    return new Date(year, month, firstDay.getDate() + firstWeekday + (occurrence - 1) * 7);
  };

  holidays.push(
    { date: getMonthlyHoliday(1, 1, 3), name: "Family Day", global: false, counties: ['CA-AB', 'CA-BC', 'CA-ON'], types: ['Public'] }, // 3rd Monday in February
    { date: getMonthlyHoliday(8, 1, 1), name: "Labour Day", global: true, counties: null, types: ['Public'] }, // 1st Monday in September
    { date: getMonthlyHoliday(9, 1, 2), name: "Thanksgiving", global: true, counties: null, types: ['Public'] } // 2nd Monday in October
  );

  // Common additional holidays
  holidays.push(
    { date: new Date(year, 11, 24), name: "Christmas Eve", global: false, counties: null, types: ['Observance'] },
    { date: new Date(year, 11, 31), name: "New Year's Eve", global: false, counties: null, types: ['Observance'] },
    { date: new Date(year, 9, 31), name: "Halloween", global: false, counties: null, types: ['Observance'] },
    { date: new Date(year, 1, 14), name: "Valentine's Day", global: false, counties: null, types: ['Observance'] },
    { date: new Date(year, 2, 17), name: "St. Patrick's Day", global: false, counties: null, types: ['Observance'] }
  );

  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Gets holidays for a date range (can span multiple years) with optional filtering
 */
export async function getHolidaysForPeriod(startDate: Date, endDate: Date, filter?: HolidayFilter): Promise<Holiday[]> {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const allHolidays: Holiday[] = [];

  // Fetch holidays for all years in the range
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = await fetchHolidaysForYear(year, filter);
    allHolidays.push(...yearHolidays);
  }

  // Filter to only holidays within the date range
  return allHolidays.filter(holiday => 
    holiday.date >= startDate && holiday.date <= endDate
  );
}

/**
 * Clears the holiday cache (useful for testing or if you want fresh data)
 */
export function clearHolidayCache(): void {
  holidayCache.clear();
}

// Export the filter interface for external use
export type { HolidayFilter, Holiday };

/**
 * Common holiday filter presets
 */
export const HolidayFilters = {
  // Only major holidays everyone knows
  COMMON_ONLY: {
    includeHolidays: [
      // Major holidays everyone recognizes
      'New Year\'s Day', 'Good Friday', 'Easter Monday', 'Victoria Day', 
      'Canada Day', 'Civic Holiday', 'Labour Day', 'Thanksgiving', 
      'Christmas Day', 'Boxing Day',
      // Optional but commonly observed
      'Christmas Eve', 'New Year\'s Eve'
    ]
  } as HolidayFilter,

  // Exclude weird/obscure holidays
  NO_OBSCURE: {
    excludeHolidays: [
      // Regional days most people don't know
      'Islander Day', 'Heritage Day', 'Louis Riel Day',
      // Obscure observances
      'Discovery Day', 'Orangemen\'s Day', 'St. George\'s Day', 'Memorial Day',
      // Confusing Saint Patrick's Day (March 16th) - keep the regular St. Patrick's Day
      'Saint Patrick\'s Day',
      // Quebec-specific
      'St-Jean-Baptiste Day',
      // Duplicate of Remembrance Day
      'Armistice Day'
    ]
  } as HolidayFilter,

  // Only federal statutory holidays (what most workplaces actually observe)
  WORKPLACE_STANDARD: {
    onlyGlobal: true,
    includeTypes: ['Public'],
    excludeHolidays: [
      // Remove the cultural/optional ones even if they're "public"
      'Halloween', 'Valentine\'s Day', 'St. Patrick\'s Day', 'Groundhog Day'
    ]
  } as HolidayFilter,

  // Absolutely minimal - just the big ones
  ESSENTIAL_ONLY: {
    includeHolidays: [
      'New Year\'s Day', 'Good Friday', 'Victoria Day', 'Canada Day', 
      'Labour Day', 'Thanksgiving', 'Christmas Day', 'Boxing Day'
    ]
  } as HolidayFilter
};