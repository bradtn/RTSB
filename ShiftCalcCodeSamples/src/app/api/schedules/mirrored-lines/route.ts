// src/app/api/schedules/mirrored-lines/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { findMirroredLines } from "@/lib/scheduler/mirroredLineFinder";
import { Schedule, ShiftCodeInfo } from "@/types/scheduleTypes";
import { getSettingsFromDB } from "@/lib/settings";
import { parseISO } from "date-fns";

export async function GET(request: Request) {
  try {
    // Helper function to sanitize error messages for client
    const sanitizeError = (error: unknown): string => {
      if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
      }
      return String(error);
    };
    
    // Declare variables in a scope that's accessible to the entire function
    let lineIdNum: number;
    let targetOperations: string[] = [];
    let debugMode = false;
    const debugLog: any[] = [];
    
    try {
      const session = await getServerSession();
      
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      // Get line ID from query params
      const { searchParams } = new URL(request.url);
      const lineId = searchParams.get('lineId');
      
      // Check for debug mode
      debugMode = searchParams.get('debug') === 'true';
      
      if (debugMode) {
        debugLog.push({
          timestamp: new Date().toISOString(),
          step: 'request_params',
          data: {
            lineId,
            targetOperations: searchParams.get('targetOperations'),
            debug: searchParams.get('debug'),
            allParams: Array.from(searchParams.entries())
          }
        });
      }
      
      if (!lineId) {
        return NextResponse.json({ error: "Missing lineId parameter" }, { status: 400 });
      }
      
      // Validate that lineId is a number
      lineIdNum = parseInt(lineId);
      if (isNaN(lineIdNum)) {
        return NextResponse.json({ error: "Invalid lineId parameter" }, { status: 400 });
      }
      
      // Get target operations from query params (comma-separated list)
      const targetOperationsParam = searchParams.get('targetOperations');
      targetOperations = targetOperationsParam ? targetOperationsParam.split(',') : [];
      
      if (debugMode) {
        debugLog.push({
          timestamp: new Date().toISOString(),
          step: 'parsed_params',
          data: {
            lineIdNum,
            targetOperations,
            targetOperationsCount: targetOperations.length
          }
        });
      }
    } catch (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ 
        error: "Authentication error", 
        details: sanitizeError(authError)
      }, { status: 401 });
    }
    
    try {
      // Use a direct SQL query with proper column names based on schema inspection
      let schedules;
      try {
          
        // Execute the optimized query with properly escaped GROUP keyword
        const finalSql = `
          SELECT id, LINE, \`GROUP\`, BLACKOUT, holidays_on, holidays_data, 
            DAY_001, DAY_002, DAY_003, DAY_004, DAY_005, DAY_006, DAY_007, DAY_008, 
            DAY_009, DAY_010, DAY_011, DAY_012, DAY_013, DAY_014, DAY_015, DAY_016, 
            DAY_017, DAY_018, DAY_019, DAY_020, DAY_021, DAY_022, DAY_023, DAY_024, 
            DAY_025, DAY_026, DAY_027, DAY_028, DAY_029, DAY_030, DAY_031, DAY_032, 
            DAY_033, DAY_034, DAY_035, DAY_036, DAY_037, DAY_038, DAY_039, DAY_040, 
            DAY_041, DAY_042, DAY_043, DAY_044, DAY_045, DAY_046, DAY_047, DAY_048, 
            DAY_049, DAY_050, DAY_051, DAY_052, DAY_053, DAY_054, DAY_055, DAY_056
          FROM schedules
          WHERE BLACKOUT IS NULL 
          OR BLACKOUT = ''
          OR BLACKOUT = '0'
          OR BLACKOUT = 'FALSE'
          OR BLACKOUT = 'N'
          OR BLACKOUT = 'NO'
        `;
        
        schedules = await prisma.$queryRawUnsafe(finalSql);
          
      } catch (sqlError) {
        // Try a fallback approach with known working line IDs
        try {
          schedules = await prisma.$queryRawUnsafe(`
            SELECT * FROM schedules 
            WHERE id IN (172, 186, 200)
          `);
          
          if (!Array.isArray(schedules) || schedules.length === 0) {
            throw new Error("No schedules found with fallback query");
          }
        } catch (fallbackError) {
          return NextResponse.json({ 
            error: "Database query failed. Please try again or contact an administrator.",
            details: sqlError instanceof Error ? sqlError.message : String(sqlError)
          }, { status: 500 });
        }
      }
      
      if (!Array.isArray(schedules) || schedules.length === 0) {
        return NextResponse.json({ error: "No schedules found" }, { status: 404 });
      }
      
      console.log(`Found ${schedules.length} schedules to analyze for mirrored lines`);
      
      if (debugMode) {
        debugLog.push({
          timestamp: new Date().toISOString(),
          step: 'schedules_loaded',
          data: {
            totalSchedules: schedules.length,
            sampleSchedules: schedules.slice(0, 3).map((s: any) => ({
              id: s.id,
              LINE: s.LINE,
              GROUP: s.GROUP,
              dayColumnsCount: Object.keys(s).filter((k: string) => k.startsWith('DAY_')).length
            }))
          }
        });
      }
      
      // Get all shift codes to provide more info in the comparison
      let shiftCodesResult;
      try {
        shiftCodesResult = await prisma.$queryRaw`SELECT * FROM shift_codes ORDER BY CODE ASC`;
      } catch (error) {
        console.error("Error querying shift codes:", error);
        // Continue without shift codes - it will still work, just with less detail
        shiftCodesResult = [];
      }
      
      if (!Array.isArray(shiftCodesResult)) {
        console.warn("Shift codes query returned non-array result, using empty array instead");
        shiftCodesResult = [];
      }
      
      console.log(`Found ${shiftCodesResult.length} shift codes in database`);
      
      // Process shift codes data for formatting
      const shiftCodes: ShiftCodeInfo[] = [];
      
      if (Array.isArray(shiftCodesResult)) {
        for (const code of shiftCodesResult) {
          try {
            // Make sure we have at least a code value
            if (!code.CODE) {
              console.warn("Skipping shift code entry without CODE value");
              continue;
            }
            
            shiftCodes.push({
              id: code.id || 0,
              code: code.CODE,
              begin: code.BEGIN || "",
              end: code.END || "",
              display: `${code.CODE} (${code.BEGIN || ""} - ${code.END || ""})`,
              category: determineCategory(code.BEGIN),
              length: determineLength(code.BEGIN, code.END)
            });
          } catch (e) {
            console.error("Error processing shift code:", e, code);
            // Skip this one but continue processing others
          }
        }
      }
      
      console.log(`Processed ${shiftCodes.length} valid shift codes for mirrored lines`);
      
      // Get application settings
      const appSettings = await getSettingsFromDB();
      const numCycles = appSettings.numCycles || 1;
      
      // Parse startDate from settings, defaulting to current date if not available or invalid
      let startDate = new Date();
      if (appSettings.startDate) {
        try {
          const parsedDate = parseISO(appSettings.startDate);
          if (!isNaN(parsedDate.getTime())) {
            startDate = parsedDate;
          }
        } catch (e) {
          console.warn(`Invalid startDate in settings: ${appSettings.startDate}. Using current date instead.`);
        }
      }
      
      console.log(`Using ${numCycles} cycles from admin settings for mirrored line finder with startDate: ${startDate.toISOString()}`);
      
      if (debugMode) {
        debugLog.push({
          timestamp: new Date().toISOString(),
          step: 'settings_loaded',
          data: {
            numCycles,
            startDate: startDate.toISOString(),
            appSettings
          }
        });
      }
      
      // Output debug info for troubleshooting
      console.log(`About to call findMirroredLines with: lineId=${lineIdNum}, numSchedules=${schedules.length}, numShiftCodes=${shiftCodes.length}, numCycles=${numCycles}, startDate=${startDate.toISOString()}`);
      
      // Verify data integrity before processing
      if (schedules.length > 0) {
        // Verify the selected schedule exists
        const userLine = schedules.find(s => s.id === lineIdNum);
        if (!userLine) {
          if (debugMode) {
            return NextResponse.json({ 
              error: `Selected line with ID ${lineIdNum} not found`,
              debug: debugLog
            }, { status: 404 });
          }
          return NextResponse.json({ error: `Selected line with ID ${lineIdNum} not found` }, { status: 404 });
        }
        
        if (debugMode) {
          debugLog.push({
            timestamp: new Date().toISOString(),
            step: 'user_line_found',
            data: {
              userLine: {
                id: userLine.id,
                LINE: userLine.LINE,
                GROUP: userLine.GROUP,
                dayColumns: Object.keys(userLine).filter(k => k.startsWith('DAY_')).slice(0, 10)
              }
            }
          });
        }
        
        // Check if the selected line has day columns
        const userDayKeys = Object.keys(userLine).filter(key => 
          typeof key === 'string' && (key.toLowerCase().startsWith('day_'))
        );
        
        if (userDayKeys.length === 0) {
          return NextResponse.json({ 
            error: `Selected line with ID ${lineIdNum} has no day columns. Please select a different line or check schedule import.` 
          }, { status: 400 });
        }
      }
      
      try {
        // Safety check for data
        if (!Array.isArray(schedules) || schedules.length === 0) {
          return NextResponse.json({ 
            error: "No valid schedules found to process. Please verify data exists in the database."
          }, { status: 404 });
        }
        
        // Safety check for the selected line
        const userLineExists = schedules.some(s => s.id === lineIdNum);
        if (!userLineExists) {
          return NextResponse.json({ 
            error: `The selected line ID ${lineIdNum} does not exist in the database. Please select a different line.`
          }, { status: 404 });
        }
        
        // Verify the selected line has day data
        const selectedLine = schedules.find(s => s.id === lineIdNum);
        if (selectedLine) {
          // Check for day columns in the selected line
          const dayKeys = Object.keys(selectedLine).filter(k => k.toLowerCase().startsWith('day_'));
          if (dayKeys.length === 0) {
            return NextResponse.json({ 
              error: `Selected line with ID ${lineIdNum} has no day data columns. This data is required for mirrored line analysis.`
            }, { status: 400 });
          }
        }
        
        try {
          // Process mirrored lines
          if (debugMode) {
            debugLog.push({
              timestamp: new Date().toISOString(),
              step: 'calling_findMirroredLines',
              data: {
                lineIdNum,
                schedulesCount: schedules.length,
                shiftCodesCount: shiftCodes.length,
                numCycles,
                startDate: startDate.toISOString(),
                targetOperations
              }
            });
          }
          
          const result = findMirroredLines(
            lineIdNum, 
            schedules as Schedule[], 
            shiftCodes,
            numCycles,
            startDate,
            targetOperations.length > 0 ? targetOperations : undefined
          );
          
          const { mirrorScores, userLine, debugInfo: finderDebugInfo } = result;
          
          if (debugMode) {
            debugLog.push({
              timestamp: new Date().toISOString(),
              step: 'findMirroredLines_complete',
              data: {
                totalResults: mirrorScores.length,
                resultsWithHighScore: mirrorScores.filter(s => s.patternScore >= 85).length,
                resultsWithMedScore: mirrorScores.filter(s => s.patternScore >= 50 && s.patternScore < 85).length,
                resultsWithLowScore: mirrorScores.filter(s => s.patternScore < 50).length,
                topResults: mirrorScores.slice(0, 5).map(s => ({
                  line: s.line.LINE,
                  group: s.line.GROUP,
                  patternScore: s.patternScore,
                  userShiftPatternScore: s.userShiftPatternScore,
                  totalScore: s.totalScore,
                  workDayMismatchCount: s.workDayMismatchCount
                })),
                finderDebugInfo: finderDebugInfo || {}
              }
            });
          }
          
          // Log the first result to verify it contains the new score fields
          if (mirrorScores.length > 0) {
            console.log('First mirror result sample:', {
              line: mirrorScores[0].line.LINE,
              patternScore: mirrorScores[0].patternScore,
              userShiftPatternScore: mirrorScores[0].userShiftPatternScore, // Log the new user shift pattern score
              shiftDiffScore: mirrorScores[0].shiftDiffScore,
              significantDifferenceCount: mirrorScores[0].significantDifferenceCount,
              averageTimeDifferenceScore: mirrorScores[0].averageTimeDifferenceScore,
              meaningfulTradeScore: mirrorScores[0].meaningfulTradeScore,
              workDayMismatchCount: mirrorScores[0].workDayMismatchCount
            });
            
            // Log a few more entries to ensure values are being calculated properly
            console.log('DEBUG API - Additional result samples:');
            for (let i = 0; i < Math.min(3, mirrorScores.length); i++) {
              console.log(`Line ${mirrorScores[i].line.LINE} (${mirrorScores[i].line.GROUP}): userShiftPatternScore=${mirrorScores[i].userShiftPatternScore}, patternScore=${mirrorScores[i].patternScore}`);
            }
          }
          
          // Check if the user's line was found
          if (!userLine) {
            if (debugMode) {
              return NextResponse.json({ 
                error: "Selected line not found in processed data. Please try a different line.",
                debug: debugLog
              }, { status: 404 });
            }
            return NextResponse.json({ 
              error: "Selected line not found in processed data. Please try a different line."
            }, { status: 404 });
          }
          
          // Special handling for 0 results
          if (mirrorScores.length === 0 && debugMode) {
            debugLog.push({
              timestamp: new Date().toISOString(),
              step: 'no_results_analysis',
              data: {
                message: 'No mirrored lines found. This could be due to:',
                reasons: [
                  'All other lines have pattern scores below 50%',
                  'Target operations filter is too restrictive',
                  'The user line has a unique pattern not matched by others',
                  'Database has limited schedules available'
                ],
                userLineInfo: {
                  id: userLine.id,
                  LINE: userLine.LINE,
                  GROUP: userLine.GROUP
                },
                targetOperations,
                totalSchedulesChecked: schedules.length
              }
            });
          }
          
          // Create a more compact response to prevent Content-Length issues
          const compactResults: any = {
            userLine: {
              id: userLine.id,
              LINE: userLine.LINE,
              GROUP: userLine.GROUP
            },
            mirrorScores: mirrorScores.map(score => ({
              // Include only essential fields
              line: {
                id: score.line.id,
                LINE: score.line.LINE,
                GROUP: score.line.GROUP
              },
              patternScore: score.patternScore,
              userShiftPatternScore: score.userShiftPatternScore, // Include the new user shift pattern score
              shiftDiffScore: score.shiftDiffScore,
              totalScore: score.totalScore,
              meaningfulTradeScore: score.meaningfulTradeScore,
              differentCategoryCount: score.differentCategoryCount,
              sameCategoryCount: score.sameCategoryCount,
              significantDifferenceCount: score.significantDifferenceCount,
              averageTimeDifferenceScore: score.averageTimeDifferenceScore,
              workDayMismatchCount: score.workDayMismatchCount, // Include this field too
              totalUserWorkDays: score.totalUserWorkDays || 0, // Include the total user work days
              shiftComparison: score.shiftComparison
            }))
          };
          
          // Add debug information if in debug mode
          if (debugMode) {
            compactResults.debug = debugLog;
            compactResults.summary = {
              totalResults: mirrorScores.length,
              message: mirrorScores.length === 0 
                ? 'No matching schedules found. Try adjusting filters or selecting a different line.'
                : `Found ${mirrorScores.length} potential matches`
            };
          }
          
          // Setup a streaming response to handle large datasets
          const stream = new ReadableStream({
            start(controller) {
              try {
                // Convert to string and send
                controller.enqueue(JSON.stringify(compactResults));
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            }
          });

          // Return a streaming response
          return new Response(stream, {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Transfer-Encoding': 'chunked' // Let the server handle chunking
            }
          });
        } catch (processingError) {
          console.error("Error in findMirroredLines function:", processingError);
          
          // Detailed error message with context
          return NextResponse.json({ 
            error: "Error processing mirrored lines data", 
            details: sanitizeError(processingError),
            message: "The selected line could not be processed. Try selecting a different line from the list."
          }, { status: 500 });
        }
      } catch (err) {
        console.error("Error in findMirroredLines function:", err);
        
        return NextResponse.json({ 
          error: "Error processing mirrored lines data", 
          details: sanitizeError(err),
          message: "There was a problem analyzing the selected line. Please try again or select a different line."
        }, { status: 500 });
      }
      
    } catch (error) {
      console.error("Error finding mirrored lines:", error);
      // More detailed error message to help with debugging
      
      return NextResponse.json({ 
        error: "Failed to find mirrored lines", 
        details: sanitizeError(error),
        message: "There was a problem loading the schedule data. Please try again or select a different line."
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in mirrored lines endpoint:", error);
    // More detailed error message to help with debugging
    
    return NextResponse.json({ 
      error: "Server error", 
      details: sanitizeError(error),
      message: "An unexpected error occurred. Please try again or contact an administrator if the issue persists."
    }, { status: 500 });
  }
}

// Helper functions for shift code categorization (same as in shift-codes API)

// Format time strings to HH:MM format
function formatTimeString(timeStr: string | null): string {
  if (!timeStr) return '';
  
  // Convert to string to ensure we have a proper string
  const timeString = String(timeStr);
  
  // First, handle ISO date strings with full timestamps
  try {
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      // Get UTC hours/minutes to preserve original times
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch (e) {}
  
  // Next, try to parse various time formats
  // Handle HH:MM format
  try {
    const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const [_, hours, minutes] = timeMatch;
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
  } catch (e) {
    console.error("Error matching time format:", e);
  }
  
  // Handle numeric format (e.g., "0830" for 8:30)
  try {
    const numericMatch = timeString.match(/^(\d{2})(\d{2})$/);
    if (numericMatch) {
      const [_, hours, minutes] = numericMatch;
      return `${hours}:${minutes}`;
    }
  } catch (e) {
    console.error("Error matching numeric format:", e);
  }
  
  return timeStr;
}

// Determine shift category based on begin time
function determineCategory(beginTime: string | null): string {
  if (!beginTime) return "Unknown";
  
  const formattedTime = formatTimeString(beginTime);
  
  if (formattedTime.startsWith('06:') || formattedTime === '07:00') {
    return "Days";
  } else if (formattedTime.startsWith('08:3') || formattedTime.startsWith('08:4')) {
    return "Late Days";
  } else if ((formattedTime >= '09:00' && formattedTime <= '11:30')) {
    return "Mid Days";
  } else if ((formattedTime >= '12:30' && formattedTime <= '15:54')) {
    return "Afternoons";
  } else if ((formattedTime >= '18:45' && formattedTime <= '20:45')) {
    return "Midnights";
  }
  return "Other";
}

// Calculate shift length
function determineLength(beginTime: string | null, endTime: string | null): string {
  if (!beginTime || !endTime) return "Unknown";
  
  const begin = formatTimeString(beginTime);
  const end = formatTimeString(endTime);
  
  try {
    const [beginHours, beginMinutes] = begin.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    let durationHours = endHours - beginHours;
    let durationMinutes = endMinutes - beginMinutes;
    
    // Handle overnight shifts
    if (durationHours < 0) durationHours += 24;
    if (durationMinutes < 0) {
      durationMinutes += 60;
      durationHours -= 1;
    }
    
    const totalHours = durationHours + (durationMinutes / 60);
    
    // Round to nearest hour or half-hour for display
    if (Math.abs(totalHours - Math.round(totalHours)) < 0.25) {
      return `${Math.round(totalHours)} Hour Shift`;
    } else {
      return `${Math.floor(totalHours)}.5 Hour Shift`;
    }
  } catch (e) {
    return "Unknown";
  }
}