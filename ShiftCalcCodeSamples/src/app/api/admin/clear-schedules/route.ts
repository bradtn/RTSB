// src/app/api/admin/clear-schedules/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function DELETE(request: Request) {
  console.log("DELETE /api/admin/clear-schedules - Starting request");
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      console.log("Unauthorized clear schedules attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Authenticated as admin, proceeding with clearing schedules");
    
    // Count rows before deletion for confirmation
    const countBefore = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM schedules
    `;
    
    const beforeCount = Array.isArray(countBefore) && countBefore.length > 0 
      ? Number(countBefore[0].count) 
      : 0;
      
    console.log(`Found ${beforeCount} schedules before clearing`);
    
    // Clear all schedules
    await prisma.$executeRaw`DELETE FROM schedules`;
    
    // Count rows after deletion for confirmation
    const countAfter = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM schedules
    `;
    
    const afterCount = Array.isArray(countAfter) && countAfter.length > 0 
      ? Number(countAfter[0].count) 
      : 0;
      
    console.log(`Found ${afterCount} schedules after clearing`);
    
    return NextResponse.json({ 
      success: true, 
      message: `All schedules cleared successfully. Removed ${beforeCount} records.`,
      details: {
        beforeCount,
        afterCount
      }
    });
  } catch (error) {
    console.error("Error clearing schedules:", error);
    return NextResponse.json({ 
      error: "Failed to clear schedules",
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
