// src/app/api/admin/upload-employees/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db/prisma";
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Processing ${data.length} employee assignments`);
    
    // Debug: Show first row to see column names
    if (data.length > 0) {
      console.log('First row columns:', Object.keys(data[0]));
      console.log('First row data:', data[0]);
    }
    
    // Track statistics
    const stats = {
      processed: 0,
      updated: 0,
      notFound: 0,
      errors: 0,
      details: [] as any[]
    };
    
    // Process each row
    for (const row of data) {
      stats.processed++;
      
      // Expected columns: Operation, Line, Name (or GROUP, LINE, EMPLOYEE_NAME)
      const operation = row['Operation'] || row['GROUP'] || row['Group'];
      const line = row['Line'] || row['LINE'] || row['Line #'] || row['Line Number'];
      const employeeName = row['Name'] || row['EMPLOYEE_NAME'] || row['Employee'] || row['Employee Name'];
      
      if (!operation || !line || !employeeName) {
        stats.errors++;
        const errorDetail = {
          row: stats.processed,
          status: 'Error',
          error: 'Missing required fields',
          missing: {
            operation: !operation,
            line: !line,
            employeeName: !employeeName
          },
          data: row
        };
        stats.details.push(errorDetail);
        console.error(`Row ${stats.processed} - Missing fields:`, errorDetail);
        continue;
      }
      
      try {
        // Update the schedule with employee name
        const result = await prisma.$executeRaw`
          UPDATE schedules 
          SET employee_name = ${employeeName}
          WHERE \`GROUP\` = ${operation} 
          AND LINE = ${line.toString()}
        `;
        
        if (result > 0) {
          stats.updated++;
          stats.details.push({
            row: stats.processed,
            status: 'Updated',
            operation,
            line,
            employee: employeeName
          });
        } else {
          stats.notFound++;
          stats.details.push({
            row: stats.processed,
            status: 'Schedule not found',
            operation,
            line,
            employee: employeeName
          });
        }
      } catch (error) {
        stats.errors++;
        const errorDetail = {
          row: stats.processed,
          status: 'Error',
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          operation,
          line,
          employee: employeeName,
          data: row
        };
        stats.details.push(errorDetail);
        console.error(`Row ${stats.processed} - Database error:`, errorDetail);
      }
    }
    
    // Log summary
    console.log('Employee upload summary:', {
      processed: stats.processed,
      updated: stats.updated,
      notFound: stats.notFound,
      errors: stats.errors
    });
    
    // Log only errors for easier debugging
    if (stats.errors > 0) {
      const errorDetails = stats.details.filter(d => d.status === 'Error');
      console.error('Upload errors:', errorDetails);
    }
    
    // Log only not found entries if any
    if (stats.notFound > 0) {
      const notFoundDetails = stats.details.filter(d => d.status === 'Schedule not found');
      console.warn('Schedules not found:', notFoundDetails);
    }
    
    return NextResponse.json({
      success: true,
      stats,
      message: `Processed ${stats.processed} rows: ${stats.updated} updated, ${stats.notFound} not found, ${stats.errors} errors`
    });
    
  } catch (error) {
    console.error('Error uploading employee assignments:', error);
    return NextResponse.json({ 
      error: "Failed to upload employee assignments",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to download a sample template
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create sample data
    const sampleData = [
      { Operation: 'Yard', Line: '1', Name: 'John Smith' },
      { Operation: 'Yard', Line: '2', Name: 'Jane Doe' },
      { Operation: 'Shop', Line: '1', Name: 'Bob Johnson' },
      { Operation: 'Shop', Line: '2', Name: 'Alice Williams' },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, "Employee Assignments");

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="employee_assignment_template.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ error: "Failed to generate template" }, { status: 500 });
  }
}