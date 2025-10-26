import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function POST() {
  try {
    // Delete cached holiday data
    await prisma.systemSettings.deleteMany({
      where: {
        setting_key: 'schedule_holidays'
      }
    });
    
    console.log("Holiday cache cleared successfully");
    
    return NextResponse.json({ 
      success: true,
      message: "Holiday cache cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing holiday cache:", error);
    return NextResponse.json({ 
      error: "Failed to clear holiday cache", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}