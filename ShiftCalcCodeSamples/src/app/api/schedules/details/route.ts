// src/app/api/schedules/details/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { calculateScheduleScore } from "@/lib/scheduler/scoring";

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get IDs from query string
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json({ error: "No schedule IDs provided" }, { status: 400 });
    }
    
    const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      return NextResponse.json({ error: "Invalid schedule IDs" }, { status: 400 });
    }

    console.log("Fetching schedules with IDs:", ids);

    // Try using Prisma's type-safe query instead of raw SQL
    try {
      // Use Prisma's findMany instead of raw SQL for better error handling
      const schedules = await prisma.schedule.findMany({
        where: {
          id: {
            in: ids
          }
        }
      });
      
      console.log(`Found ${schedules.length} schedules`);
      
      if (schedules.length === 0) {
        return NextResponse.json({ error: `No schedules found with IDs: ${ids.join(', ')}` }, { status: 404 });
      }

      // Process schedules
      const processedSchedules = schedules.map(schedule => {
        // Calculate metrics for each schedule
        const result = calculateScheduleScore(schedule, {
          selectedGroups: [],
          dayOffDates: [],
          selectedShiftCodes: [],
          selectedShiftCategories: [],
          selectedShiftLengths: [],
          weights: {
            groupWeight: 1.0,
            daysWeight: 1.0,
            shiftWeight: 1.0,
            blocks5dayWeight: 1.0,
            blocks4dayWeight: 1.0,
            weekendWeight: 1.0,
            saturdayWeight: 1.0,
            sundayWeight: 1.0
          }
        });

        return {
          id: schedule.id,
          line: schedule.LINE || schedule.line,
          group: schedule.GROUP || schedule.group || "Unknown",
          matchScore: result.score,
          weekendsOn: result.weekendsOn,
          saturdaysOn: result.saturdaysOn,
          sundaysOn: result.sundaysOn,
          blocks5day: result.blocks5day,
          blocks4day: result.blocks4day,
          explanation: result.explanation
        };
      });

      return NextResponse.json(processedSchedules);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      
      // Fall back to raw query if Prisma model doesn't match
      console.log("Trying raw SQL query as fallback");
      
      const rawSchedules = await prisma.$queryRaw`
        SELECT * FROM schedules WHERE id IN (${Prisma.join(ids)})
      `;
      
      if (!Array.isArray(rawSchedules) || rawSchedules.length === 0) {
        return NextResponse.json({ error: `No schedules found with IDs: ${ids.join(', ')}` }, { status: 404 });
      }
      
      // Process raw schedules
      const processedRawSchedules = rawSchedules.map(schedule => {
        // Calculate metrics for each schedule
        const result = calculateScheduleScore(schedule, {
          selectedGroups: [],
          dayOffDates: [],
          selectedShiftCodes: [],
          selectedShiftCategories: [],
          selectedShiftLengths: [],
          weights: {
            groupWeight: 1.0,
            daysWeight: 1.0,
            shiftWeight: 1.0,
            blocks5dayWeight: 1.0,
            blocks4dayWeight: 1.0,
            weekendWeight: 1.0,
            saturdayWeight: 1.0,
            sundayWeight: 1.0
          }
        });

        return {
          id: schedule.id,
          line: schedule.LINE || schedule.line,
          group: schedule.GROUP || schedule.group || "Unknown",
          matchScore: result.score,
          weekendsOn: result.weekendsOn,
          saturdaysOn: result.saturdaysOn,
          sundaysOn: result.sundaysOn,
          blocks5day: result.blocks5day,
          blocks4day: result.blocks4day,
          explanation: result.explanation
        };
      });

      return NextResponse.json(processedRawSchedules);
    }
  } catch (error) {
    console.error("Error fetching schedule details:", error);
    return NextResponse.json({ error: "Failed to fetch schedule details" }, { status: 500 });
  }
}