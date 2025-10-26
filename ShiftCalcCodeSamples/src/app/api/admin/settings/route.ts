// src/app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    console.log("User object:", JSON.stringify(session.user));
    console.log("Role property:", session.user?.role);
    
    const userRole = session.user?.role || 
                     session.user?.['role'] || 
                     session.user?.['Role'] ||
                     session.user?.['userRole'] ||
                     session.user?.['type'];
                     
    console.log("Detected user role:", userRole);
    
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Not admin", role: userRole }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();
    console.log("Received settings data:", data);
    
    // Validate required fields
    if (!data.startDate || data.numCycles === undefined) {
      return NextResponse.json({ error: "Missing required settings" }, { status: 400 });
    }
    
    // Store settings in database using Prisma model
    const result = await prisma.systemSettings.upsert({
      where: { 
        setting_key: 'app_settings' 
      },
      update: {
        setting_value: {
          startDate: data.startDate,
          numCycles: data.numCycles,
          updatedAt: new Date().toISOString()
        }
      },
      create: {
        setting_key: 'app_settings',
        setting_value: {
          startDate: data.startDate,
          numCycles: data.numCycles,
          updatedAt: new Date().toISOString()
        }
      }
    });
    
    console.log("Settings saved:", result);
    
    // Clear any cached holiday data
    await prisma.systemSettings.deleteMany({
      where: {
        setting_key: 'schedule_holidays'
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Settings saved successfully"
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ 
      error: "Failed to save settings", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Require authentication for reading settings
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Debug - log that this endpoint was called
    console.log("Settings GET endpoint called");
    
    // Get settings from database
    const settings = await prisma.systemSettings.findUnique({
      where: {
        setting_key: 'app_settings'
      }
    });
    
    if (settings && settings.setting_value) {
      return NextResponse.json(settings.setting_value);
    }
    
    // No settings found - return error indicating admin needs to configure them
    return NextResponse.json({
      error: 'No admin settings configured',
      message: 'Please configure start date and number of cycles in Admin Settings'
    }, { status: 404 });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ 
      error: "Failed to fetch settings",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}