import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getHolidaysForPeriod, HolidayFilters } from '@/utils/holidays';

// Simple in-memory cache (replace with Redis in production)
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const operation = searchParams.get('operation') || 'all';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const categories = searchParams.get('categories') || '';
    const categoryMode = searchParams.get('categoryMode') || 'OR';

    // Create cache key
    const cacheKey = `dashboard:${operation}:${search}:${status}:${categories}:${categoryMode}:${session.user.id}`;
    
    // Check for cache-busting header (used after mutations)
    const shouldBustCache = request.headers.get('x-cache-bust') === 'true';
    
    // Clear cache for this user if cache-busting
    if (shouldBustCache) {
      // Clear all cache entries for this user
      for (const key of cache.keys()) {
        if (key.includes(session.user.id)) {
          cache.delete(key);
        }
      }
    }
    
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL && !shouldBustCache) {
      console.log('Returning cached dashboard data');
      return NextResponse.json(cached.data);
    }
    
    console.log('Fetching fresh dashboard data');

    // Build optimized queries with proper indexes
    const where = buildOptimizedWhere(operation, search, status, categories, categoryMode);
    
    // Extract exact match categories if present
    const exactMatchCategories = where._exactMatchCategories;
    if (exactMatchCategories) {
      delete where._exactMatchCategories; // Remove from query object
    }

    // Execute optimized queries in parallel
    const [operations, bidLinesResult, favoritesResult, statusCounts] = await Promise.all([
      // Get operations with counts - optimized query
      prisma.operation.findMany({
        select: {
          id: true,
          name: true,
          nameEn: true,
          nameFr: true,
          isActive: true,
          _count: {
            select: {
              users: true,
              bidLines: true,
            },
          },
        },
        orderBy: { name: 'asc' }
      }),
      
      // Get paginated bid lines - MUCH more efficient
      prisma.bidLine.findMany({
        where,
        select: {
          id: true,
          operationId: true,
          lineNumber: true,
          shiftStart: true,
          shiftEnd: true,
          daysOfWeek: true,
          location: true,
          description: true,
          status: true,
          takenBy: true,
          takenAt: true,
          notes: true,
          scheduleId: true,
          // Pre-calculated schedule metrics
          weekendsOn: true,
          saturdaysOn: true,
          sundaysOn: true,
          blocks5day: true,
          blocks4day: true,
          blocks3day: true,
          blocks2day: true,
          blocks6day: true,
          singleDays: true,
          holidaysWorking: true,
          holidaysOff: true,
          shiftPattern: true,
          totalSaturdays: true,
          totalSaturdaysInPeriod: true,
          totalSundays: true,
          totalSundaysInPeriod: true,
          totalMondays: true,
          totalMondaysInPeriod: true,
          totalTuesdays: true,
          totalTuesdaysInPeriod: true,
          totalWednesdays: true,
          totalWednesdaysInPeriod: true,
          totalThursdays: true,
          totalThursdaysInPeriod: true,
          totalFridays: true,
          totalFridaysInPeriod: true,
          totalDaysWorked: true,
          totalDaysInPeriod: true,
          longestStretch: true,
          fridayWeekendBlocks: true,
          weekdayBlocks: true,
          offBlocks2day: true,
          offBlocks3day: true,
          offBlocks4day: true,
          offBlocks5day: true,
          offBlocks6day: true,
          offBlocks7dayPlus: true,
          longestOffStretch: true,
          shortestOffStretch: true,
          operation: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              nameFr: true,
            }
          },
          bidPeriod: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              numCycles: true,
            }
          },
          favorites: {
            where: { userId: session.user.id },
            select: {
              id: true,
              rank: true,
            }
          },
          // Get schedule with shifts for metrics calculation
          schedule: {
            select: {
              id: true,
              lineNumber: true,
              bidPeriod: {
                select: {
                  numCycles: true,
                  startDate: true,
                  endDate: true,
                }
              },
              scheduleShifts: {
                select: {
                  dayNumber: true,
                  date: true,
                  shiftCodeId: true,
                  shiftCode: {
                    select: {
                      code: true,
                      beginTime: true,
                      endTime: true,
                      category: true,
                      hoursLength: true,
                    }
                  }
                },
                orderBy: {
                  dayNumber: 'asc'
                }
              }
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { lineNumber: 'asc' },
        ],
      }),

      // Get favorite bid lines WITHOUT filters - they should always show user's favorites
      prisma.bidLine.findMany({
        where: {
          favorites: {
            some: {
              userId: session.user.id
            }
          }
        },
        select: {
          id: true,
          operationId: true,
          lineNumber: true,
          shiftStart: true,
          shiftEnd: true,
          daysOfWeek: true,
          location: true,
          description: true,
          status: true,
          takenBy: true,
          takenAt: true,
          notes: true,
          scheduleId: true,
          // Pre-calculated schedule metrics
          weekendsOn: true,
          saturdaysOn: true,
          sundaysOn: true,
          blocks5day: true,
          blocks4day: true,
          blocks3day: true,
          blocks2day: true,
          blocks6day: true,
          singleDays: true,
          holidaysWorking: true,
          holidaysOff: true,
          shiftPattern: true,
          totalSaturdays: true,
          totalSaturdaysInPeriod: true,
          totalSundays: true,
          totalSundaysInPeriod: true,
          totalMondays: true,
          totalMondaysInPeriod: true,
          totalTuesdays: true,
          totalTuesdaysInPeriod: true,
          totalWednesdays: true,
          totalWednesdaysInPeriod: true,
          totalThursdays: true,
          totalThursdaysInPeriod: true,
          totalFridays: true,
          totalFridaysInPeriod: true,
          totalDaysWorked: true,
          totalDaysInPeriod: true,
          longestStretch: true,
          fridayWeekendBlocks: true,
          weekdayBlocks: true,
          offBlocks2day: true,
          offBlocks3day: true,
          offBlocks4day: true,
          offBlocks5day: true,
          offBlocks6day: true,
          offBlocks7dayPlus: true,
          longestOffStretch: true,
          shortestOffStretch: true,
          operation: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              nameFr: true,
            }
          },
          bidPeriod: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              numCycles: true,
            }
          },
          favorites: {
            where: { userId: session.user.id },
            select: {
              id: true,
              rank: true,
            }
          },
          // Get schedule with shifts for metrics calculation
          schedule: {
            select: {
              id: true,
              lineNumber: true,
              bidPeriod: {
                select: {
                  numCycles: true,
                  startDate: true,
                  endDate: true,
                }
              },
              scheduleShifts: {
                include: {
                  shiftCode: true
                }
              }
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { lineNumber: 'asc' },
        ],
      }),

      // Get status counts - optimized
      prisma.bidLine.groupBy({
        by: ['status'],
        where: operation !== 'all' ? { operationId: operation } : {},
        _count: { _all: true },
      }),
    ]);

    // Process results efficiently using pre-calculated stored metrics
    let processedBidLines = bidLinesResult.map((line) => ({
      ...line,
      isFavorited: line.favorites.length > 0,
      favoriteRank: line.favorites.length > 0 ? line.favorites[0].rank : null,
      favoriteId: line.favorites.length > 0 ? line.favorites[0].id : null,
      // Use pre-calculated stored metrics for instant performance
      scheduleMetrics: line.weekendsOn !== null ? {
        weekendsOn: line.weekendsOn,
        saturdaysOn: line.saturdaysOn,
        sundaysOn: line.sundaysOn,
        blocks5day: line.blocks5day,
        blocks4day: line.blocks4day,
        blocks3day: line.blocks3day,
        blocks2day: line.blocks2day,
        blocks6day: line.blocks6day,
        singleDays: line.singleDays,
        holidaysWorking: line.holidaysWorking,
        holidaysOff: line.holidaysOff,
        shiftPattern: line.shiftPattern,
        totalSaturdays: line.totalSaturdays,
        totalSaturdaysInPeriod: line.totalSaturdaysInPeriod,
        totalSundays: line.totalSundays,
        totalSundaysInPeriod: line.totalSundaysInPeriod,
        totalMondays: line.totalMondays,
        totalMondaysInPeriod: line.totalMondaysInPeriod,
        totalTuesdays: line.totalTuesdays,
        totalTuesdaysInPeriod: line.totalTuesdaysInPeriod,
        totalWednesdays: line.totalWednesdays,
        totalWednesdaysInPeriod: line.totalWednesdaysInPeriod,
        totalThursdays: line.totalThursdays,
        totalThursdaysInPeriod: line.totalThursdaysInPeriod,
        totalFridays: line.totalFridays,
        totalFridaysInPeriod: line.totalFridaysInPeriod,
        totalDaysWorked: line.totalDaysWorked,
        totalDaysInPeriod: line.totalDaysInPeriod,
        longestStretch: line.longestStretch,
        fridayWeekendBlocks: line.fridayWeekendBlocks,
        weekdayBlocks: line.weekdayBlocks,
        offBlocks2day: line.offBlocks2day,
        offBlocks3day: line.offBlocks3day,
        offBlocks4day: line.offBlocks4day,
        offBlocks5day: line.offBlocks5day,
        offBlocks6day: line.offBlocks6day,
        offBlocks7dayPlus: line.offBlocks7dayPlus,
        longestOffStretch: line.longestOffStretch,
        shortestOffStretch: line.shortestOffStretch,
      } : null,
    }));

    // Apply exact match filtering if needed
    if (exactMatchCategories) {
      processedBidLines = processedBidLines.filter((line) => {
        if (!line.schedule?.scheduleShifts) return false;
        
        // Get unique categories from this line's shift codes
        const lineCategories = new Set(
          line.schedule.scheduleShifts
            .filter((shift: any) => shift.shiftCode)
            .map((shift: any) => shift.shiftCode.category)
        );
        
        // For exact match: line must have exactly the same categories (no more, no fewer)
        const expectedCategoriesSet = new Set(exactMatchCategories);
        
        // Check if sets are equal
        return lineCategories.size === expectedCategoriesSet.size && 
               [...lineCategories].every(cat => expectedCategoriesSet.has(cat));
      });
    }

    // Process status counts
    const counts = {
      AVAILABLE: 0,
      TAKEN: 0,
      BLACKED_OUT: 0,
      total: 0
    };

    statusCounts.forEach(item => {
      counts[item.status as keyof typeof counts] = item._count._all;
      counts.total += item._count._all;
    });

    // Process favorites separately (without filters)
    const processedFavorites = favoritesResult.map((line) => ({
      ...line,
      isFavorited: true,
      favoriteRank: line.favorites?.[0]?.rank || 1000,
      favoriteId: line.favorites?.[0]?.id || null,
      shiftCalcMetrics: line.schedule ? {
        // Use pre-calculated metrics from the database
        weekendsOn: line.weekendsOn,
        saturdaysOn: line.saturdaysOn,
        sundaysOn: line.sundaysOn,
        blocks5day: line.blocks5day,
        blocks4day: line.blocks4day,
        blocks3day: line.blocks3day,
        blocks2day: line.blocks2day,
        blocks6day: line.blocks6day,
        singleDays: line.singleDays,
        holidaysWorking: line.holidaysWorking,
        holidaysOff: line.holidaysOff,
        shiftPattern: line.shiftPattern,
        totalSaturdays: line.totalSaturdays,
        totalSaturdaysInPeriod: line.totalSaturdaysInPeriod,
        totalSundays: line.totalSundays,
        totalSundaysInPeriod: line.totalSundaysInPeriod,
        totalMondays: line.totalMondays,
        totalMondaysInPeriod: line.totalMondaysInPeriod,
        totalTuesdays: line.totalTuesdays,
        totalTuesdaysInPeriod: line.totalTuesdaysInPeriod,
        totalWednesdays: line.totalWednesdays,
        totalWednesdaysInPeriod: line.totalWednesdaysInPeriod,
        totalThursdays: line.totalThursdays,
        totalThursdaysInPeriod: line.totalThursdaysInPeriod,
        totalFridays: line.totalFridays,
        totalFridaysInPeriod: line.totalFridaysInPeriod,
        totalDaysWorked: line.totalDaysWorked,
        totalDaysInPeriod: line.totalDaysInPeriod,
        longestStretch: line.longestStretch,
        fridayWeekendBlocks: line.fridayWeekendBlocks,
        weekdayBlocks: line.weekdayBlocks,
        offBlocks2day: line.offBlocks2day,
        offBlocks3day: line.offBlocks3day,
        offBlocks4day: line.offBlocks4day,
        offBlocks5day: line.offBlocks5day,
        offBlocks6day: line.offBlocks6day,
        offBlocks7dayPlus: line.offBlocks7dayPlus,
        longestOffStretch: line.longestOffStretch,
        shortestOffStretch: line.shortestOffStretch,
      } : null,
    }));
    
    const result = {
      operations,
      bidLines: processedBidLines,
      favorites: processedFavorites,
      statusCounts: counts,
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Clean old cache entries periodically
    if (cache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key);
        }
      }
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function buildOptimizedWhere(operation: string, search: string, status: string, categories: string, categoryMode: string = 'OR') {
  const where: any = {};

  if (operation && operation !== 'all') {
    where.operationId = operation;
  }

  if (search) {
    where.OR = [
      { lineNumber: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status && status !== 'all') {
    where.status = status;
  }

  if (categories && categories.trim() !== '') {
    const categoryList = categories.split(',').map(c => c.trim()).filter(c => c !== '');
    if (categoryList.length > 0) {
      if (categoryMode === 'AND' && categoryList.length > 1) {
        // EXACT MATCH logic - show lines that have EXACTLY the selected categories (no more, no fewer)
        // This requires custom filtering that will be done post-query
        where.schedule = {
          scheduleShifts: {
            some: {
              shiftCode: {
                category: {
                  in: categoryList
                }
              }
            }
          }
        };
        // Mark this query for post-processing exact match filtering
        where._exactMatchCategories = categoryList;
      } else {
        // OR logic - show lines that have ANY of the selected categories in their shift codes
        where.schedule = {
          scheduleShifts: {
            some: {
              shiftCode: {
                category: {
                  in: categoryList
                }
              }
            }
          }
        };
      }
    }
  }

  return where;
}

async function calculateShiftCalcMetrics(schedule: any) {
  if (!schedule?.scheduleShifts) {
    return null;
  }
  
  const shiftsWithCodes = schedule.scheduleShifts.filter((s: any) => s.shiftCode);
  
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

  const sortedShifts = schedule.scheduleShifts.sort((a: any, b: any) => a.dayNumber - b.dayNumber);
  const shiftTypes: string[] = [];
  let consecutiveWorkDays = 0;
  const workBlocks: number[] = [];
  
  // Track weekend work per weekend pair
  const weekends: { [weekendKey: string]: { saturday: boolean, sunday: boolean } } = {};
  let workingShifts = 0;
  
  // Get holidays for the schedule period using the existing holiday system
  let holidays: Date[] = [];
  if (sortedShifts.length > 0) {
    try {
      const firstShift = sortedShifts[0];
      const lastShift = sortedShifts[sortedShifts.length - 1];
      const startDate = new Date(firstShift.date);
      const endDate = new Date(lastShift.date);
      
      const holidayData = await getHolidaysForPeriod(startDate, endDate, HolidayFilters.WORKPLACE_STANDARD);
      holidays = holidayData.map(h => h.date);
    } catch (error) {
      console.warn('Failed to fetch holidays for schedule metrics:', error);
    }
  }
  
  // Create a set of holiday date strings for quick lookup
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
      if (isHolidayDate) {
        metrics.holidaysOff++;
      }
      
      // End of work block
      if (consecutiveWorkDays > 0) {
        workBlocks.push(consecutiveWorkDays);
        consecutiveWorkDays = 0;
      }
    }
  }
  
  // Count weekend types
  for (const weekend of Object.values(weekends)) {
    if (weekend.saturday && weekend.sunday) {
      // Both days worked - counts as weekend working
      metrics.weekendsOn++;
    } else if (weekend.saturday && !weekend.sunday) {
      // Only Saturday worked
      metrics.saturdaysOn++;
    } else if (weekend.sunday && !weekend.saturday) {
      // Only Sunday worked
      metrics.sundaysOn++;
    }
  }
  
  // Add final block if schedule ends on work day
  if (consecutiveWorkDays > 0) {
    workBlocks.push(consecutiveWorkDays);
  }
  
  // Count block types
  metrics.blocks5day = workBlocks.filter(block => block === 5).length;
  metrics.blocks4day = workBlocks.filter(block => block === 4).length;
  
  // Multiply all counts by the number of cycles for the full bid period
  metrics.weekendsOn *= numCycles;
  metrics.saturdaysOn *= numCycles;
  metrics.sundaysOn *= numCycles;
  metrics.blocks5day *= numCycles;
  metrics.blocks4day *= numCycles;
  metrics.holidaysWorking *= numCycles;
  metrics.holidaysOff *= numCycles;
  
  // Determine shift pattern
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