// src/app/api/admin/export-shift-codes/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  console.log("GET /api/admin/export-shift-codes - Starting request");
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      console.log("Unauthorized export attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Use raw SQL to get the data with proper formatting
    const shiftCodes = await prisma.$queryRaw`
      SELECT 
        id, 
        code as CODE, 
        TIME_FORMAT(begin, '%H:%i') as BEGIN, 
        TIME_FORMAT(end, '%H:%i') as END,
        description as DESCRIPTION,
        created_at, 
        updated_at
      FROM 
        shift_codes
    `;
    
    console.log(`Found ${Array.isArray(shiftCodes) ? shiftCodes.length : 0} shift codes to export`);
    console.log("Sample data:", Array.isArray(shiftCodes) && shiftCodes.length > 0 ? shiftCodes[0] : "No data");
    
    if (!Array.isArray(shiftCodes) || shiftCodes.length === 0) {
      return NextResponse.json({ message: "No shift codes found in database" });
    }
    
    // Prepare data for Excel with date formatting
    const excelData = shiftCodes.map(code => ({
      id: code.id,
      CODE: code.CODE,
      BEGIN: code.BEGIN,
      END: code.END,
      DESCRIPTION: code.DESCRIPTION || "",
      created_at: new Date(code.created_at).toLocaleDateString(),
      updated_at: new Date(code.updated_at).toLocaleDateString()
    }));
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },   // id
      { wch: 10 },  // CODE
      { wch: 10 },  // BEGIN
      { wch: 10 },  // END
      { wch: 30 },  // DESCRIPTION
      { wch: 15 },  // created_at
      { wch: 15 }   // updated_at
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shift Codes");
    
    // Convert to buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: "buffer", 
      bookType: "xlsx"
    });
    
    // Set headers for file download
    const headers = new Headers();
    headers.append("Content-Disposition", 'attachment; filename="shift_codes.xlsx"');
    headers.append("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error exporting shift codes:", error);
    return NextResponse.json({ 
      error: "Failed to export shift codes",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
