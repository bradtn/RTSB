// src/app/api/schedules/filter/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { calculateScheduleScore } from "@/lib/scheduler/scoring";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get filter criteria from request body
    const criteria = await request.json();
    console.log("Received filter criteria:", criteria);
    
    // Initialize debug info if debug mode is enabled
    const debugMode = criteria.debug === true;
    const debugInfo: any = {
      enabled: debugMode,
      timestamp: new Date().toISOString(),
      criteria: {
        groups: criteria.selectedGroups?.length || 0,
        dayOffDates: criteria.dayOffDates?.length || 0,
        shiftCodes: criteria.selectedShiftCodes?.length || 0,
        shiftCategories: criteria.selectedShiftCategories?.length || 0,
        shiftLengths: criteria.selectedShiftLengths?.length || 0,
        weights: criteria.weights
      },
      processing: {
        totalSchedulesQueried: 0,
        schedulesAfterGroupFilter: 0,
        schedulesScored: 0,
        scoringErrors: []
      },
      zeroScoreAnalysis: [],
      highScoreAnalysis: [],
      filteringReasons: []
    };
    
    try {
      // Build where clause for raw SQL
      let whereClause = `
        WHERE BLACKOUT IS NULL 
        OR BLACKOUT = ''
        OR BLACKOUT = '0'
        OR BLACKOUT = 'FALSE'
        OR BLACKOUT = 'N'
        OR BLACKOUT = 'NO'
      `;
      
      if (criteria.selectedGroups && criteria.selectedGroups.length > 0) {
        const groupsQuoted = criteria.selectedGroups.map(g => `'${g}'`).join(', ');
        whereClause += ` AND \`GROUP\` IN (${groupsQuoted})`;
      }
      
      // Use raw SQL to ensure we get all columns including holiday data
      const schedules = await prisma.$queryRaw`
        SELECT id, LINE, \`GROUP\`, BLACKOUT, holidays_on, holidays_data,
               DAY_001, DAY_002, DAY_003, DAY_004, DAY_005, DAY_006, DAY_007, DAY_008,
               DAY_009, DAY_010, DAY_011, DAY_012, DAY_013, DAY_014, DAY_015, DAY_016,
               DAY_017, DAY_018, DAY_019, DAY_020, DAY_021, DAY_022, DAY_023, DAY_024,
               DAY_025, DAY_026, DAY_027, DAY_028, DAY_029, DAY_030, DAY_031, DAY_032,
               DAY_033, DAY_034, DAY_035, DAY_036, DAY_037, DAY_038, DAY_039, DAY_040,
               DAY_041, DAY_042, DAY_043, DAY_044, DAY_045, DAY_046, DAY_047, DAY_048,
               DAY_049, DAY_050, DAY_051, DAY_052, DAY_053, DAY_054, DAY_055, DAY_056
        FROM schedules
        ${Prisma.raw(whereClause)}
      `;
      
      console.log(`Found ${schedules.length} schedules matching filters`);
      
      if (debugMode) {
        debugInfo.processing.totalSchedulesQueried = schedules.length;
        debugInfo.processing.schedulesAfterGroupFilter = schedules.length;
      }
      
      // Debug the first schedule to see if holiday data is there
      if (schedules.length > 0) {
        console.log("First schedule holiday data:", {
          id: schedules[0].id,
          line: schedules[0].LINE,
          holidays_on: schedules[0].holidays_on,
          has_holiday_data: !!schedules[0].holidays_data
        });
        
        if (debugMode) {
          debugInfo.sampleSchedule = {
            id: schedules[0].id,
            LINE: schedules[0].LINE,
            GROUP: schedules[0].GROUP,
            hasHolidayData: !!schedules[0].holidays_data,
            dayColumns: Object.keys(schedules[0]).filter(k => k.startsWith('DAY_')).length
          };
        }
      }
      
      if (schedules.length === 0) {
        if (debugMode) {
          return NextResponse.json({
            schedules: [],
            debug: {
              ...debugInfo,
              message: "No schedules found matching the filter criteria",
              possibleReasons: [
                "No schedules in selected groups",
                "All schedules are blackout schedules",
                "Database query returned no results"
              ]
            }
          });
        }
        return NextResponse.json([]);
      }
      
      // Calculate scores for each schedule
      const scoredSchedules = schedules.map((schedule, index) => {
        try {
          // Convert day off dates from strings back to Date objects
          const processedCriteria = {
            ...criteria,
            dayOffDates: (criteria.dayOffDates || []).map(dateStr => 
              typeof dateStr === 'string' ? new Date(dateStr) : dateStr
            )
          };
          
          const result = calculateScheduleScore(schedule, processedCriteria);
          
          if (debugMode) {
            debugInfo.processing.schedulesScored++;
            
            // Track zero scores for analysis
            if (result.score === 0 && debugInfo.zeroScoreAnalysis.length < 5) {
              debugInfo.zeroScoreAnalysis.push({
                id: schedule.id,
                LINE: schedule.LINE,
                GROUP: schedule.GROUP,
                explanation: result.explanation,
                metrics: {
                  weekendsOn: result.weekendsOn,
                  blocks5day: result.blocks5day,
                  blocks4day: result.blocks4day
                }
              });
            }
            
            // Track high scores for analysis
            if (result.score > 80 && debugInfo.highScoreAnalysis.length < 5) {
              debugInfo.highScoreAnalysis.push({
                id: schedule.id,
                LINE: schedule.LINE,
                GROUP: schedule.GROUP,
                score: result.score,
                explanation: result.explanation
              });
            }
          }
          
          return {
            id: schedule.id,
            line: schedule.LINE || schedule.line || String(schedule.id),
            group: schedule.GROUP || schedule.group || "Unknown",
            matchScore: result.score,
            weekendsOn: result.weekendsOn,
            saturdaysOn: result.saturdaysOn,
            sundaysOn: result.sundaysOn,
            blocks5day: result.blocks5day,
            blocks4day: result.blocks4day,
            holidays_on: schedule.holidays_on || 0,        // Holiday data
            holidays_data: schedule.holidays_data || null, // Holiday data
            explanation: result.explanation
          };
        } catch (error) {
          console.error(`Error scoring schedule ${schedule.id}:`, error);
          
          if (debugMode) {
            debugInfo.processing.scoringErrors.push({
              scheduleId: schedule.id,
              LINE: schedule.LINE,
              error: error.message || String(error)
            });
          }
          
          // Return schedule with default values on error
          return {
            id: schedule.id,
            line: schedule.LINE || schedule.line || String(schedule.id),
            group: schedule.GROUP || schedule.group || "Unknown",
            matchScore: 0,
            weekendsOn: "0 of 0",
            saturdaysOn: "0 of 0",
            sundaysOn: "0 of 0",
            blocks5day: 0,
            blocks4day: 0,
            holidays_on: schedule.holidays_on || 0,        // Holiday data
            holidays_data: schedule.holidays_data || null, // Holiday data
            explanation: "Error calculating metrics"
          };
        }
      });
      
      // Sort by match score
      scoredSchedules.sort((a, b) => b.matchScore - a.matchScore);
      
      if (debugMode) {
        // Add summary statistics
        debugInfo.summary = {
          totalResults: scoredSchedules.length,
          zeroScores: scoredSchedules.filter(s => s.matchScore === 0).length,
          highScores: scoredSchedules.filter(s => s.matchScore > 80).length,
          mediumScores: scoredSchedules.filter(s => s.matchScore > 40 && s.matchScore <= 80).length,
          lowScores: scoredSchedules.filter(s => s.matchScore > 0 && s.matchScore <= 40).length,
          topScore: scoredSchedules[0]?.matchScore || 0,
          averageScore: scoredSchedules.length > 0 
            ? Math.round(scoredSchedules.reduce((sum, s) => sum + s.matchScore, 0) / scoredSchedules.length)
            : 0
        };
        
        // If all scores are zero, provide detailed analysis
        if (scoredSchedules.every(s => s.matchScore === 0)) {
          debugInfo.allZeroScoresAnalysis = {
            message: "All schedules scored 0. This usually means:",
            reasons: [
              "No schedules match the selected shift codes/categories/lengths",
              "The weight configuration may be set to 0 for all criteria",
              "The selected days off don't match any schedules",
              "There may be an issue with the scoring calculation"
            ],
            recommendation: "Try adjusting weights or selecting different criteria"
          };
        }
        
        return NextResponse.json({
          schedules: scoredSchedules,
          debug: debugInfo
        });
      }
      
      return NextResponse.json(scoredSchedules);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      
      // Rest of fallback code continues...
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in filter endpoint:", error);
    return NextResponse.json({ error: "Failed to filter schedules" }, { status: 500 });
  }
}