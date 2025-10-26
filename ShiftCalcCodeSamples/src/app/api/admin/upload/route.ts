// src/app/api/admin/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db/prisma";
import * as XLSX from 'xlsx';

// Helper function to process shift codes Excel file
async function processShiftCodesFile(buffer: ArrayBuffer) {
  console.log("Processing shift codes file");
  
  try {
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} shift code records in Excel file`);
    
    // Gather all existing codes to avoid duplicates
    const existingCodes = await prisma.$queryRaw`
      SELECT code FROM shift_codes
    `;
    
    const existingCodeSet = new Set();
    if (Array.isArray(existingCodes)) {
      existingCodes.forEach(item => existingCodeSet.add(item.code));
    }
    
    console.log(`Found ${existingCodeSet.size} existing shift codes in database`);
    
    // Track statistics
    const stats = {
      processed: 0,
      inserted: 0,
      skipped: 0,
      errors: 0
    };
    
    // Process each row
    for (const row of data) {
      stats.processed++;
      
      // Skip rows without CODE or header row
      if (!row['CODE'] || row['CODE'] === 'CODE') {
        stats.skipped++;
        continue;
      }
      
      // Get column values with fallbacks
      const code = row['CODE'] ? String(row['CODE']).trim() : null;
      const begin = row['BEGIN'] ? String(row['BEGIN']).trim() : null;
      const end = row['END'] ? String(row['END']).trim() : null;
      const description = row['DESCRIPTION'] ? String(row['DESCRIPTION']).trim() : null;
      
      // Skip if no code
      if (!code) {
        stats.skipped++;
        console.warn("Skipping row without CODE");
        continue;
      }
      
      // Skip if duplicate (already in database)
      if (existingCodeSet.has(code)) {
        stats.skipped++;
        console.log(`Skipping existing shift code: ${code}`);
        continue;
      }
      
      try {
        // Insert new shift code
        await prisma.$executeRaw`
          INSERT INTO shift_codes (code, begin, end, description, created_at, updated_at)
          VALUES (${code}, ${begin}, ${end}, ${description}, NOW(), NOW())
        `;
        stats.inserted++;
        
        // Add to the set to prevent duplicates within the import
        existingCodeSet.add(code);
      } catch (error) {
        stats.errors++;
        console.error(`Error inserting shift code ${code}:`, error);
      }
    }
    
    console.log(`Shift codes import statistics:`, stats);
    return stats;
  } catch (error) {
    console.error("Error processing shift codes file:", error);
    throw error;
  }
}

// Helper function to process schedules Excel file
async function processSchedulesFile(buffer: ArrayBuffer) {
  console.log("Processing schedules file");
  
  try {
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} schedule records in Excel file`);
    
    // Gather all existing LINE + GROUP combinations to avoid duplicates
    const existingSchedules = await prisma.$queryRaw`
      SELECT CONCAT(LINE, '-', IFNULL(\`GROUP\`, '')) as \`key\` FROM schedules
    `;
    
    const existingScheduleSet = new Set();
    if (Array.isArray(existingSchedules)) {
      existingSchedules.forEach(item => existingScheduleSet.add(item.key));
    }
    
    console.log(`Found ${existingScheduleSet.size} existing schedules in database`);
    
    // Track statistics
    const stats = {
      processed: 0,
      inserted: 0,
      skipped: 0,
      errors: 0
    };
    
    // Identify all DAY_ columns
    const sampleRow = data[0] || {};
    const dayColumns = Object.keys(sampleRow).filter(key => key.startsWith('DAY_'));
    console.log(`Found ${dayColumns.length} day columns in schedule file`);
    
    // Process each row
    for (const row of data) {
      stats.processed++;
      
      // Skip rows without LINE or header row
      if (!row['LINE'] || row['LINE'] === 'LINE') {
        stats.skipped++;
        continue;
      }
      
      // Get basic column values
      const line = row['LINE'] ? String(row['LINE']).trim() : null;
      const group = row['GROUP'] ? String(row['GROUP']).trim() : null;
      const blackout = row['BLACKOUT'] ? String(row['BLACKOUT']).trim() : null;
      
      // Skip if no line
      if (!line) {
        stats.skipped++;
        console.warn("Skipping row without LINE");
        continue;
      }
      
      // Create key for duplicate checking
      const scheduleKey = `${line}-${group || ''}`;
      
      // Skip if duplicate (already in database)
      if (existingScheduleSet.has(scheduleKey)) {
        stats.skipped++;
        console.log(`Skipping existing schedule: ${scheduleKey}`);
        continue;
      }
      
      try {
        // Prepare columns and values for SQL
        const columns = ['LINE', '`GROUP`', 'BLACKOUT', 'created_at', 'updated_at'];
        const values = [line, group, blackout, 'NOW()', 'NOW()'];
        const placeholders = ['?', '?', '?', 'NOW()', 'NOW()'];
        
        // Add day columns
        for (const dayCol of dayColumns) {
          if (row[dayCol] !== undefined) {
            const dayValue = row[dayCol] !== null ? String(row[dayCol]).trim() : null;
            columns.push(dayCol.toLowerCase());
            values.push(dayValue);
            placeholders.push('?');
          }
        }
        
        // Build and execute SQL
        const columnsStr = columns.join(', ');
        const placeholdersStr = placeholders.join(', ');
        
        const query = `INSERT INTO schedules (${columnsStr}) VALUES (${placeholdersStr})`;
        await prisma.$executeRawUnsafe(query, ...values.filter(v => v !== 'NOW()'));
        
        stats.inserted++;
        
        // Add to the set to prevent duplicates within the import
        existingScheduleSet.add(scheduleKey);
      } catch (error) {
        stats.errors++;
        console.error(`Error inserting schedule ${line}-${group}:`, error);
      }
    }
    
    console.log(`Schedules import statistics:`, stats);
    return stats;
  } catch (error) {
    console.error("Error processing schedules file:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  console.log("POST /api/admin/upload - Starting request");
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      console.log("Unauthorized upload attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse form data
    const formData = await request.formData();
    const scheduleFile = formData.get("scheduleFile") as File | null;
    const shiftCodeFile = formData.get("shiftCodeFile") as File | null;
    
    console.log("Files received:", { 
      scheduleFile: scheduleFile?.name || "none", 
      shiftCodeFile: shiftCodeFile?.name || "none" 
    });
    
    if (!scheduleFile && !shiftCodeFile) {
      console.log("No files provided");
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    
    const results = {
      schedules: { processed: 0, inserted: 0, skipped: 0, errors: 0 },
      shiftCodes: { processed: 0, inserted: 0, skipped: 0, errors: 0 }
    };
    
    // Process schedule file if provided
    if (scheduleFile) {
      console.log("Processing schedule file:", scheduleFile.name);
      const buffer = await scheduleFile.arrayBuffer();
      results.schedules = await processSchedulesFile(buffer);
    }
    
    // Process shift code file if provided
    if (shiftCodeFile) {
      console.log("Processing shift code file:", shiftCodeFile.name);
      const buffer = await shiftCodeFile.arrayBuffer();
      results.shiftCodes = await processShiftCodesFile(buffer);
    }
    
    console.log("Upload processing completed:", results);
    
    return NextResponse.json({ 
      success: true,
      message: `Import completed successfully. Imported ${results.schedules.inserted} schedules and ${results.shiftCodes.inserted} shift codes. Skipped ${results.schedules.skipped + results.shiftCodes.skipped} duplicates.`,
      results
    });
  } catch (error) {
    console.error("Error in file upload:", error);
    return NextResponse.json({ 
      error: "Failed to process uploaded files",
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
