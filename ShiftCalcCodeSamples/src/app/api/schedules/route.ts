// src/app/api/schedules/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get group filter from query params
    const { searchParams } = new URL(request.url);
    const groupFilter = searchParams.get('group');
    
    // Build query with proper parameterization
    let whereClause = `
      (BLACKOUT IS NULL 
      OR BLACKOUT = ''
      OR BLACKOUT = '0'
      OR BLACKOUT = 'FALSE'
      OR BLACKOUT = 'N'
      OR BLACKOUT = 'NO')
    `;
    
    if (groupFilter) {
      whereClause += ` AND \`GROUP\` = ?`;
    }
    
    const query = `
      SELECT id, LINE, \`GROUP\`, holidays_on, holidays_data,
             DAY_001, DAY_002, DAY_003, DAY_004, DAY_005, DAY_006, DAY_007, DAY_008, 
             DAY_009, DAY_010, DAY_011, DAY_012, DAY_013, DAY_014, DAY_015, DAY_016, 
             DAY_017, DAY_018, DAY_019, DAY_020, DAY_021, DAY_022, DAY_023, DAY_024, 
             DAY_025, DAY_026, DAY_027, DAY_028, DAY_029, DAY_030, DAY_031, DAY_032, 
             DAY_033, DAY_034, DAY_035, DAY_036, DAY_037, DAY_038, DAY_039, DAY_040, 
             DAY_041, DAY_042, DAY_043, DAY_044, DAY_045, DAY_046, DAY_047, DAY_048, 
             DAY_049, DAY_050, DAY_051, DAY_052, DAY_053, DAY_054, DAY_055, DAY_056
      FROM schedules 
      WHERE ${whereClause}
    `;
    
    // Execute with proper parameterization
    const schedules = groupFilter 
      ? await prisma.$queryRawUnsafe(query, groupFilter)
      : await prisma.$queryRawUnsafe(query);
    
    // Create a minimal version of the schedules to reduce payload size
    const minimalSchedules = Array.isArray(schedules) ? schedules.map(schedule => {
      // Only include the essential fields
      const essentialData = {
        id: schedule.id,
        LINE: schedule.LINE,
        GROUP: schedule.GROUP,
        holidays_on: schedule.holidays_on,  // Include holidays_on field
        holidays_data: schedule.holidays_data  // Include holidays_data field
      };
      
      // Add all day columns
      for (let i = 1; i <= 56; i++) {
        const dayKey = `DAY_${String(i).padStart(3, '0')}`;
        if (schedule[dayKey] !== undefined) {
          essentialData[dayKey] = schedule[dayKey];
        }
      }
      
      return essentialData;
    }) : [];

    // Return regular JSON response
    return NextResponse.json(minimalSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}