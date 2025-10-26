// src/app/api/admin/data-stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request: Request) {
  console.log("GET /api/admin/data-stats - Starting request");
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      console.log("Unauthorized access to data stats");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get schedule count
    const schedulesCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM schedules
    `;
    
    // Get shift codes count
    const shiftCodesCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM shift_codes
    `;
    
    // Get users count
    const usersCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users
    `;
    
    const stats = {
      schedules: Array.isArray(schedulesCount) ? Number(schedulesCount[0].count) : 0,
      shiftCodes: Array.isArray(shiftCodesCount) ? Number(shiftCodesCount[0].count) : 0,
      users: Array.isArray(usersCount) ? Number(usersCount[0].count) : 0
    };
    
    console.log("Data stats:", stats);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching data stats:", error);
    return NextResponse.json({ 
      error: "Failed to fetch data statistics",
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
