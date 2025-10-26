import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { getAllHolidaysInPeriod } from "@/utils/holidayCalculator";

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First try to get cached holiday data from system_settings
    const cachedHolidays = await prisma.systemSettings.findUnique({
      where: {
        setting_key: 'schedule_holidays'
      }
    });
    
    if (cachedHolidays && cachedHolidays.setting_value && cachedHolidays.setting_value.total_count) {
      return NextResponse.json({ 
        total: cachedHolidays.setting_value.total_count,
        holidays: cachedHolidays.setting_value.holiday_list || [],
        source: "database"
      });
    }
    
    // Get app settings from database
    const appSettings = await prisma.systemSettings.findUnique({
      where: {
        setting_key: 'app_settings'
      }
    });
    
    // Use settings from database - require proper admin configuration
    if (!appSettings?.setting_value?.startDate || !appSettings?.setting_value?.numCycles) {
      return NextResponse.json({ 
        error: "Admin settings not configured. Please set start date and number of cycles in admin panel." 
      }, { status: 400 });
    }

    const options = {
      startDate: appSettings.setting_value.startDate,
      numCycles: appSettings.setting_value.numCycles,
      daysPerCycle: 56
    };
    
    console.log("Using settings for holiday calculation:", options);
    
    // Calculate all holidays
    const holidays = getAllHolidaysInPeriod(null, options);
    
    // Format holiday list for response
    const formattedHolidays = holidays.map(h => {
      // Parse date manually and format without timezone conversion
      const [year, month, day] = h.date.split('-');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      return {
        name: h.name,
        date: h.date,
        formattedDate: `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`
      };
    });
    
    // Save to database for future use
    await prisma.systemSettings.upsert({
      where: {
        setting_key: 'schedule_holidays'
      },
      update: {
        setting_value: {
          total_count: holidays.length,
          holiday_list: formattedHolidays,
          calculated_with: options
        }
      },
      create: {
        setting_key: 'schedule_holidays',
        setting_value: {
          total_count: holidays.length,
          holiday_list: formattedHolidays,
          calculated_with: options
        }
      }
    });
    
    return NextResponse.json({ 
      total: holidays.length,
      holidays: formattedHolidays,
      source: "calculated",
      settings_used: options
    });
  } catch (error) {
    console.error("Error getting total holidays:", error);
    return NextResponse.json({ error: "Failed to get holiday data" }, { status: 500 });
  }
}