import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

// Format time strings to HH:MM format
function formatTimeString(timeStr) {
  if (!timeStr) return '';
  
  try {
    // Create a date object
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      // Get UTC hours/minutes to preserve original times
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch (e) {}
  
  // Fallback for other formats
  const timeMatch = timeStr.toString().match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const [_, hours, minutes] = timeMatch;
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  return timeStr;
}

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shiftCodes = await prisma.$queryRaw`
      SELECT * FROM shift_codes 
      ORDER BY CODE ASC
    `;

    // Process the shift codes with proper time formatting
    const processedCodes = Array.isArray(shiftCodes) ? shiftCodes.map(code => {
      const beginTime = formatTimeString(code.BEGIN);
      const endTime = formatTimeString(code.END);
      
      return {
        id: code.id,
        code: code.CODE,
        begin: beginTime,
        end: endTime,
        display: `${code.CODE} (${beginTime} - ${endTime})`,
        category: determineCategory(beginTime),
        length: determineLength(beginTime, endTime)
      };
    }) : [];

    return NextResponse.json(processedCodes);
  } catch (error) {
    console.error("Error fetching shift codes:", error);
    return NextResponse.json({ error: "Failed to fetch shift codes" }, { status: 500 });
  }
}

// Determine shift category based on begin time
function determineCategory(beginTime) {
  if (!beginTime) return "Unknown";
  
  if (beginTime.startsWith('06:') || beginTime === '07:00' || beginTime === '08:00') {
    return "Days";
  } else if (beginTime.startsWith('08:3') || beginTime.startsWith('08:4')) {
    return "Late Days";
  } else if ((beginTime >= '09:00' && beginTime <= '11:30')) {
    return "Mid Days";
  } else if ((beginTime >= '12:30' && beginTime <= '15:54')) {
    return "Afternoons";
  } else if ((beginTime >= '18:45' && beginTime <= '20:45')) {
    return "Midnights";
  }
  return "Other";
}

// Calculate shift length (paid hours, subtracting 0.5hr lunch break)
function determineLength(beginTime, endTime) {
  if (!beginTime || !endTime) return "Unknown";
  
  try {
    const [beginHours, beginMinutes] = beginTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let durationHours = endHours - beginHours;
    let durationMinutes = endMinutes - beginMinutes;
    
    // Handle overnight shifts
    if (durationHours < 0) durationHours += 24;
    if (durationMinutes < 0) {
      durationMinutes += 60;
      durationHours -= 1;
    }
    
    const totalHours = durationHours + (durationMinutes / 60);
    
    // Subtract 0.5 hour lunch break for shifts 6+ hours
    const paidHours = totalHours >= 6 ? totalHours - 0.5 : totalHours;
    
    // Display exact paid hours
    if (paidHours % 1 === 0) {
      return `${paidHours} Hour Shift`;
    } else {
      return `${paidHours} Hour Shift`;
    }
  } catch (e) {
    return "Unknown";
  }
}