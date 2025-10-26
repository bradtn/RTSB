// src/app/api/admin/export-schedules/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { writeFileSync } from "fs";
import { join } from "path";
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  console.log("GET /api/admin/export-schedules - Starting request");
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      console.log("Unauthorized export attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch schedules from database
    const schedules = await prisma.$queryRaw`
      SELECT * FROM schedules
    `;
    
    console.log(`Found ${Array.isArray(schedules) ? schedules.length : 0} schedules to export`);
    
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: "No schedules found to export" }, { status: 404 });
    }
    
    // Create Excel workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(schedules);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedules");
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    // Set headers for file download
    const headers = new Headers();
    headers.append("Content-Disposition", 'attachment; filename="schedules.xlsx"');
    headers.append("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error exporting schedules:", error);
    return NextResponse.json({ 
      error: "Failed to export schedules",
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
