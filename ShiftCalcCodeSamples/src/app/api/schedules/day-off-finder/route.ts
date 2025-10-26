// src/app/api/schedules/day-off-finder/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { parseISO, format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userOperation, userLine, desiredDaysOff, targetOperations, startDate, debug } = body;

    // Initialize debug info collection
    const debugInfo: any = {
      enabled: debug === true,
      requestParams: {
        userOperation,
        userLine,
        desiredDaysOffCount: desiredDaysOff?.length || 0,
        desiredDaysOff: desiredDaysOff,
        targetOperations,
        startDate
      },
      processedSchedules: 0,
      matchesFound: 0,
      lowMatchSchedules: [],
      highMatchSchedules: [],
      errors: []
    };

    if (!userOperation || !userLine || !desiredDaysOff?.length || !targetOperations?.length) {
      return NextResponse.json({ 
        error: "Missing required parameters",
        debug: debug ? debugInfo : undefined
      }, { status: 400 });
    }

    // Fetch all schedules
    const placeholders = targetOperations.map(() => '?').join(',');
    const query = `
      SELECT * FROM \`schedules\` 
      WHERE \`GROUP\` IN (${placeholders})
      ORDER BY \`GROUP\`, \`LINE\`
    `;
    
    const allSchedules = await prisma.$queryRawUnsafe(query, ...targetOperations) as any[];
    
    console.log(`Found ${allSchedules.length} schedules in target operations:`, targetOperations);
    
    if (debug) {
      debugInfo.totalSchedulesFound = allSchedules.length;
      debugInfo.targetOperationsUsed = targetOperations;
      debugInfo.scheduleSample = allSchedules.slice(0, 3).map((s: any) => ({
        id: s.id,
        GROUP: s.GROUP,
        LINE: s.LINE
      }));
    }

    // Fetch shift codes for ranking
    const shiftCodes = await prisma.$queryRaw`
      SELECT * FROM shift_codes 
      ORDER BY CODE ASC
    ` as any[];

    // Get the user's shift codes for comparison
    const userSchedule = await prisma.$queryRaw`
      SELECT * FROM \`schedules\` 
      WHERE \`GROUP\` = ${userOperation} AND \`LINE\` = ${userLine}
      LIMIT 1
    ` as any[];

    const userShiftCodes = new Set<string>();
    if (userSchedule.length > 0) {
      for (let i = 1; i <= 56; i++) {
        const dayKey = `DAY_${i.toString().padStart(3, '0')}`;
        const code = userSchedule[0][dayKey];
        if (code && code !== "----") {
          userShiftCodes.add(code);
        }
      }
    }

    // Process each schedule to find matches
    const results = [];
    
    // Get the start date from settings if not provided
    let actualStartDate = startDate;
    if (!actualStartDate) {
      const settings = await prisma.systemSettings.findUnique({
        where: { setting_key: 'app_settings' }
      });
      if (settings && settings.setting_value) {
        const settingValue = settings.setting_value as any;
        actualStartDate = settingValue.startDate || "2025-04-24";
      } else {
        actualStartDate = "2025-04-24"; // Fallback
      }
    }
    
    const start = parseISO(actualStartDate);
    console.log("Processing schedules. Start date:", actualStartDate);
    console.log("Desired days off:", desiredDaysOff);
    
    if (debug) {
      debugInfo.actualStartDate = actualStartDate;
      debugInfo.parsedStartDate = format(start, 'yyyy-MM-dd');
    }

    for (const schedule of allSchedules) {
      // Skip the user's own schedule
      if (schedule.GROUP === userOperation && schedule.LINE.toString() === userLine.toString()) {
        if (debug) {
          debugInfo.skippedUserSchedule = { GROUP: schedule.GROUP, LINE: schedule.LINE };
        }
        continue;
      }
      
      if (debug) {
        debugInfo.processedSchedules++;
      }

      // Check if this schedule has all desired days off
      let matchCount = 0;
      const matchedDays = [];
      const dayAnalysis = [];
      
      for (const desiredDay of desiredDaysOff) {
        const targetDate = parseISO(desiredDay);
        const daysSinceStart = Math.floor((targetDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const dayIndex = daysSinceStart % 56;
        const dayNum = dayIndex + 1;
        const dayKey = `DAY_${dayNum.toString().padStart(3, '0')}`;
        
        // More detailed logging for first schedule
        if (allSchedules.indexOf(schedule) === 0) {
          console.log(`  Checking ${desiredDay}: daysSinceStart=${daysSinceStart}, dayIndex=${dayIndex}, dayKey=${dayKey}, value=${schedule[dayKey]}`);
        }
        
        const isDayOff = schedule[dayKey] === "----";
        if (isDayOff) {
          matchCount++;
          matchedDays.push(desiredDay);
        }
        
        if (debug && allSchedules.indexOf(schedule) < 5) {
          dayAnalysis.push({
            desiredDay,
            dayKey,
            scheduleValue: schedule[dayKey],
            isDayOff,
            daysSinceStart,
            dayIndex
          });
        }
      }
      
      if (debug && dayAnalysis.length > 0) {
        if (!debugInfo.sampleDayAnalysis) {
          debugInfo.sampleDayAnalysis = [];
        }
        debugInfo.sampleDayAnalysis.push({
          schedule: `${schedule.GROUP} Line ${schedule.LINE}`,
          matchCount,
          totalDesired: desiredDaysOff.length,
          analysis: dayAnalysis
        });
      }

      // Log matching info for first few schedules
      if (allSchedules.indexOf(schedule) < 3) {
        console.log(`Schedule ${schedule.GROUP} Line ${schedule.LINE}: matched ${matchCount}/${desiredDaysOff.length} days`);
      }
      
      // Include schedules with at least 50% match (or at least 1 day for small selections)
      const minMatchCount = Math.max(1, Math.floor(desiredDaysOff.length * 0.5));
      
      if (debug) {
        const matchPercent = Math.round((matchCount / desiredDaysOff.length) * 100);
        if (matchCount < minMatchCount) {
          debugInfo.lowMatchSchedules.push({
            GROUP: schedule.GROUP,
            LINE: schedule.LINE,
            matchCount,
            matchPercent,
            minRequired: minMatchCount
          });
        } else if (matchPercent >= 80) {
          debugInfo.highMatchSchedules.push({
            GROUP: schedule.GROUP,
            LINE: schedule.LINE,
            matchCount,
            matchPercent
          });
        }
      }
      
      if (matchCount >= minMatchCount) {
        if (debug) {
          debugInfo.matchesFound++;
        }
        // Calculate shift compatibility score
        let shiftCompatibility = 0;
        const scheduleShiftCodes = new Set<string>();
        
        for (let i = 1; i <= 56; i++) {
          const dayKey = `DAY_${i.toString().padStart(3, '0')}`;
          const code = schedule[dayKey];
          if (code && code !== "----") {
            scheduleShiftCodes.add(code);
          }
        }

        // Higher score for schedules with similar shift codes
        for (const code of scheduleShiftCodes) {
          if (userShiftCodes.has(code)) {
            shiftCompatibility += 2;
          }
        }

        // Bonus points if from the same operation (familiar shift patterns)
        if (schedule.GROUP === userOperation) {
          shiftCompatibility += 10;
        }

        // Get shift time ranges for this schedule
        const shiftTimes = [];
        for (const code of scheduleShiftCodes) {
          const shiftInfo = shiftCodes.find((sc: any) => sc.CODE === code);
          if (shiftInfo) {
            shiftTimes.push({
              code,
              begin: shiftInfo.BEGIN,
              end: shiftInfo.END
            });
          }
        }

        // Get the full 56-day pattern
        const schedulePattern = Array.from({ length: 56 }, (_, i) => 
          schedule[`DAY_${(i + 1).toString().padStart(3, '0')}`]
        );

        results.push({
          id: schedule.id,
          operation: schedule.GROUP,
          line: schedule.LINE,
          matchedDays,
          matchPercentage: Math.round((matchCount / desiredDaysOff.length) * 100),
          matchCount,
          totalDesiredDays: desiredDaysOff.length,
          shiftCompatibility,
          isFromSameOperation: schedule.GROUP === userOperation,
          shiftTimes: shiftTimes.slice(0, 3), // Top 3 most common shifts
          totalWorkDays: schedulePattern.filter(code => code !== "----").length,
          schedulePattern // Include the full pattern for comparison
        });
      }
    }

    // Sort by match percentage first, then by shift compatibility
    results.sort((a, b) => {
      // First sort by match percentage
      if (a.matchPercentage !== b.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      // Then by shift compatibility
      return b.shiftCompatibility - a.shiftCompatibility;
    });

    // Get user's schedule pattern
    let userPattern = null;
    if (userSchedule.length > 0) {
      userPattern = Array.from({ length: 56 }, (_, i) => 
        userSchedule[0][`DAY_${(i + 1).toString().padStart(3, '0')}`]
      );
    }

    // Add debug summary if enabled
    if (debug) {
      debugInfo.summary = {
        totalProcessed: debugInfo.processedSchedules,
        totalMatches: results.length,
        message: results.length === 0 
          ? `No schedules found with at least ${Math.max(1, Math.floor(desiredDaysOff.length * 0.5))} matching days off out of ${desiredDaysOff.length} requested`
          : `Found ${results.length} schedules matching your criteria`,
        possibleReasons: results.length === 0 ? [
          'The combination of desired days off is rare',
          'Target operations may not have schedules with those specific days off',
          'Try selecting fewer days or different combinations',
          'Consider expanding target operations'
        ] : undefined
      };
    }
    
    return NextResponse.json({
      results,
      totalFound: results.length,
      userOperation,
      userLine,
      userSchedule: userPattern ? {
        operation: userOperation,
        line: userLine,
        pattern: userPattern
      } : null,
      debug: debug ? debugInfo : undefined
    });

  } catch (error) {
    console.error("Error in day-off-finder:", error);
    return NextResponse.json({ error: "Failed to find matching schedules" }, { status: 500 });
  }
}