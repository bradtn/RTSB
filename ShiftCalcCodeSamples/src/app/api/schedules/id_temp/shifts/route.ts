// src/app/api/schedules/[id]/shifts/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scheduleId = params.id;
    
    // Get the schedule data with all day fields
    const schedule = await prisma.schedules.findUnique({
      where: {
        id: parseInt(scheduleId)
      },
      select: {
        id: true,
        LINE: true,
        GROUP: true,
        DAY_001: true, DAY_002: true, DAY_003: true, DAY_004: true, DAY_005: true, 
        DAY_006: true, DAY_007: true, DAY_008: true, DAY_009: true, DAY_010: true,
        DAY_011: true, DAY_012: true, DAY_013: true, DAY_014: true, DAY_015: true,
        DAY_016: true, DAY_017: true, DAY_018: true, DAY_019: true, DAY_020: true,
        DAY_021: true, DAY_022: true, DAY_023: true, DAY_024: true, DAY_025: true,
        DAY_026: true, DAY_027: true, DAY_028: true, DAY_029: true, DAY_030: true,
        DAY_031: true, DAY_032: true, DAY_033: true, DAY_034: true, DAY_035: true,
        DAY_036: true, DAY_037: true, DAY_038: true, DAY_039: true, DAY_040: true,
        DAY_041: true, DAY_042: true, DAY_043: true, DAY_044: true, DAY_045: true,
        DAY_046: true, DAY_047: true, DAY_048: true, DAY_049: true, DAY_050: true,
        DAY_051: true, DAY_052: true, DAY_053: true, DAY_054: true, DAY_055: true,
        DAY_056: true
      }
    });
    
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    
    // Get shift codes for reference
    const shiftCodes = await prisma.shiftCodes.findMany();
    
    // Create a map of shift codes to start/end times
    const shiftCodeMap = new Map();
    shiftCodes.forEach(code => {
      shiftCodeMap.set(code.CODE, {
        startHour: code.START_HOUR || 8,
        startMinute: code.START_MINUTE || 0,
        endHour: code.END_HOUR || 16,
        endMinute: code.END_MINUTE || 30
      });
    });
    
    // Fetch start date from settings
    const settingsQuery = await prisma.$queryRaw`SELECT * FROM settings WHERE NAME = 'scheduleStartDate'`;
    const settingsArray = Array.isArray(settingsQuery) ? settingsQuery : [settingsQuery];
    
    let startDate = new Date(); // Default to today
    if (settingsArray.length > 0 && settingsArray[0].VALUE) {
      try {
        startDate = new Date(settingsArray[0].VALUE);
        if (isNaN(startDate.getTime())) {
          startDate = new Date(); // Default to today if invalid
        }
      } catch (e) {
        console.error("Error parsing schedule start date:", e);
        startDate = new Date();
      }
    }
    
    // Process shifts data
    const shifts = [];
    
    // Look for day fields from 001 to 056
    for (let i = 1; i <= 56; i++) {
      const dayField = `DAY_${String(i).padStart(3, '0')}`;
      const shiftCode = schedule[dayField];
      
      if (shiftCode && shiftCode !== "OFF" && shiftCode !== "X") {
        // Calculate the date for this shift
        const shiftDate = new Date(startDate);
        shiftDate.setDate(startDate.getDate() + i - 1); // Day 1 is the start date
        
        // Get the shift times from the map, or use defaults
        const shiftTimes = shiftCodeMap.get(shiftCode) || {
          startHour: 8,
          startMinute: 0,
          endHour: 16,
          endMinute: 30
        };
        
        // Create start time
        const startTime = new Date(shiftDate);
        startTime.setHours(shiftTimes.startHour, shiftTimes.startMinute, 0, 0);
        
        // Create end time
        const endTime = new Date(shiftDate);
        endTime.setHours(shiftTimes.endHour, shiftTimes.endMinute, 0, 0);
        
        // Add shift to the list
        shifts.push({
          day: i,
          code: shiftCode,
          startTime: startTime,
          endTime: endTime
        });
      }
    }
    
    // Return the schedule with shift data
    return NextResponse.json({
      id: schedule.id,
      line: schedule.LINE,
      group: schedule.GROUP,
      shifts: shifts,
      startDate: startDate
    });
    
  } catch (error) {
    console.error("Error fetching shift data:", error);
    return NextResponse.json({ error: "Failed to fetch shift data" }, { status: 500 });
  }
}
