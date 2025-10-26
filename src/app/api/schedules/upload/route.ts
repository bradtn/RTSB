import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { withSupervisor } from '@/lib/api/withAuth';
import { updateBidLineMetrics } from '@/lib/schedule-metrics';

interface ShiftEntry {
  date: string;
  shiftCode: string;
  priority: number;
}

interface ParsedSchedule {
  lineNumber: string;
  groupName: string;
  operationName?: string;
  shifts: ShiftEntry[];
}

function parseDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  // Handle Excel serial dates
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue);
    if (date) {
      return `${date.y.toString().padStart(4, '0')}${date.m.toString().padStart(2, '0')}${date.d.toString().padStart(2, '0')}`;
    }
  }
  
  // Handle string dates in YYYYMMDD format
  if (typeof dateValue === 'string') {
    const cleaned = dateValue.replace(/[^0-9]/g, '');
    if (cleaned.length === 8) {
      return cleaned;
    }
  }
  
  return null;
}

function getShiftPriority(shiftCode: string): number {
  if (!shiftCode || shiftCode === 'OFF') return 0;
  if (shiftCode.includes('OT')) return 3;
  return 1;
}

function parseScheduleSheet(workbook: XLSX.WorkBook, sheetName: string): ParsedSchedule[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  // Use the same approach as ShiftCalc: sheet_to_json to get objects
  const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
  const schedules: ParsedSchedule[] = [];

  console.log(`Found ${data.length} rows in sheet "${sheetName}"`);
  
  // Identify all DAY_ columns (same as ShiftCalc)
  const sampleRow: Record<string, any> = data[0] || {};
  const dayColumns = Object.keys(sampleRow).filter(key => key.startsWith('DAY_'));
  console.log(`Found ${dayColumns.length} day columns:`, dayColumns.slice(0, 5)); // Log first 5

  if (dayColumns.length === 0) {
    throw new Error(`No DAY_ columns found in sheet "${sheetName}". Expected columns like DAY_001, DAY_002, etc.`);
  }

  // Process each row (same structure as ShiftCalc)
  for (const row of data as Record<string, any>[]) {
    // Skip rows without LINE or header row
    if (!row['LINE'] || row['LINE'] === 'LINE') {
      continue;
    }

    // Get basic column values (same as ShiftCalc)
    const lineNumber = row['LINE'] ? String(row['LINE']).trim() : null;
    const groupName = row['GROUP'] ? String(row['GROUP']).trim() : '';
    
    // Use GROUP column as the operation name (as confirmed by user)
    const operationName = groupName;

    // Skip if no line number
    if (!lineNumber) {
      console.log(`Skipping row with empty line number, row data:`, Object.keys(row).slice(0, 10));
      continue;
    }

    const shifts: ShiftEntry[] = [];

    // Process day columns (same logic as ShiftCalc)
    for (const dayCol of dayColumns) {
      if (row[dayCol] !== undefined) {
        const dayValue = row[dayCol] !== null ? String(row[dayCol]).trim() : null;
        
        // Skip empty cells, dashes, or non-work indicators (same as ShiftCalc logic)
        if (!dayValue || dayValue === '' || dayValue === '-' || dayValue === '----' || dayValue.toLowerCase() === 'off') {
          continue;
        }

        // Extract day number from column name (DAY_001 -> 001)
        const dayMatch = dayCol.match(/DAY_(\d+)/);
        if (dayMatch) {
          const dayString = dayMatch[1]; // Keep as string with leading zeros
          
          shifts.push({
            date: dayString, // Use day number as string (001, 002, etc.)
            shiftCode: dayValue.toUpperCase(),
            priority: getShiftPriority(dayValue)
          });
        }
      }
    }

    // Add schedule (even if no shifts, like ShiftCalc does)
    schedules.push({
      lineNumber,
      groupName,
      operationName,
      shifts
    });
  }

  console.log(`Processed ${schedules.length} schedules from sheet "${sheetName}"`);
  console.log(`Unique line numbers found:`, [...new Set(schedules.map(s => s.lineNumber))].sort());
  return schedules;
}

async function uploadSchedules(request: NextRequest & { user: any }, params?: any) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bidPeriodId = formData.get('bidPeriodId') as string;
    const operationId = formData.get('operationId') as string; // This can be optional for multi-operation files

    if (!file || !bidPeriodId) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    // Verify bid period exists
    const bidPeriod = await prisma.bidPeriod.findUnique({
      where: { id: bidPeriodId }
    });

    if (!bidPeriod) {
      return NextResponse.json(
        { error: "Bid period not found" }, 
        { status: 404 }
      );
    }

    // Parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Parse all worksheets
    let allSchedules: ParsedSchedule[] = [];
    console.log('Available worksheets:', workbook.SheetNames);
    
    for (const sheetName of workbook.SheetNames) {
      try {
        console.log(`Parsing worksheet: ${sheetName}`);
        const schedules = parseScheduleSheet(workbook, sheetName);
        console.log(`Found ${schedules.length} schedules in sheet ${sheetName}`);
    
    // Log a few sample line numbers to debug
    if (schedules.length > 0) {
      console.log('Sample line numbers:', schedules.slice(0, 5).map(s => s.lineNumber));
      console.log('Last few line numbers:', schedules.slice(-5).map(s => s.lineNumber));
    }
        allSchedules = allSchedules.concat(schedules);
      } catch (error) {
        console.warn(`Error parsing sheet ${sheetName}:`, error);
        // Continue with other sheets instead of failing completely
      }
    }

    if (allSchedules.length === 0) {
      return NextResponse.json(
        { error: "No valid schedule data found in file" }, 
        { status: 400 }
      );
    }

    // Calculate 56-day cycle start date
    const cycleStartDate = bidPeriod.startDate;
    
    // Process and save schedules
    const createdSchedules = [];
    const createdBidLines = [];
    const errors = [];
    const operationMap = new Map<string, string>(); // operationName -> operationId

    console.log(`Starting to process ${allSchedules.length} schedules...`);
    let processedCount = 0;
    
    for (const parsedSchedule of allSchedules) {
      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`Processed ${processedCount}/${allSchedules.length} schedules...`);
      }
      
      try {
        // Determine which operation to use
        // Always use the operation from Excel data (GROUP column) since each line can have different operations
        let finalOperationId = null;
        
        if (parsedSchedule.operationName) {
          // Try to find or create operation based on Excel data
          if (operationMap.has(parsedSchedule.operationName)) {
            finalOperationId = operationMap.get(parsedSchedule.operationName)!;
            console.log(`Using cached operation "${parsedSchedule.operationName}" for line ${parsedSchedule.lineNumber}`);
          } else {
            // Find existing operation or create new one
            const existingOperation = await prisma.operation.findFirst({
              where: {
                OR: [
                  { name: parsedSchedule.operationName },
                  { nameEn: parsedSchedule.operationName },
                  { nameFr: parsedSchedule.operationName }
                ]
              }
            });
            
            if (existingOperation) {
              finalOperationId = existingOperation.id;
              operationMap.set(parsedSchedule.operationName, existingOperation.id);
              console.log(`Found existing operation "${parsedSchedule.operationName}" (${existingOperation.id}) for line ${parsedSchedule.lineNumber}`);
            } else {
              // Create new operation
              const newOperation = await prisma.operation.create({
                data: {
                  name: parsedSchedule.operationName,
                  nameEn: parsedSchedule.operationName,
                  nameFr: parsedSchedule.operationName,
                  description: `Auto-created from schedule upload`
                }
              });
              finalOperationId = newOperation.id;
              operationMap.set(parsedSchedule.operationName, newOperation.id);
              console.log(`Created new operation "${parsedSchedule.operationName}" (${newOperation.id}) for line ${parsedSchedule.lineNumber}`);
            }
          }
        }
        
        // If still no operation, create a default one for this upload
        if (!finalOperationId) {
          console.warn(`No operation found for line ${parsedSchedule.lineNumber}, using default operation`);
          const defaultOpName = 'Default Operation';
          if (!operationMap.has(defaultOpName)) {
            const defaultOperation = await prisma.operation.upsert({
              where: { name: defaultOpName },
              update: {},
              create: {
                name: defaultOpName,
                nameEn: defaultOpName,
                nameFr: defaultOpName,
                description: 'Default operation for schedules without specified operation'
              }
            });
            operationMap.set(defaultOpName, defaultOperation.id);
          }
          finalOperationId = operationMap.get(defaultOpName)!;
        }

        // Create or update schedule record
        // Use findFirst + create/update approach since the constraint doesn't match the schema yet
        let schedule = await prisma.schedule.findFirst({
          where: {
            bidPeriodId,
            operationId: finalOperationId,
            lineNumber: parsedSchedule.lineNumber
          }
        });

        if (schedule) {
          // Update existing schedule
          console.log(`Updating existing schedule: Line ${parsedSchedule.lineNumber}, Operation ${finalOperationId}`);
          schedule = await prisma.schedule.update({
            where: { id: schedule.id },
            data: {
              groupName: null, // Don't use GROUP column as groupName since it represents operation
              operationId: finalOperationId,
              updatedAt: new Date()
            }
          });
        } else {
          // Create new schedule
          console.log(`Creating new schedule: Line ${parsedSchedule.lineNumber}, Operation ${finalOperationId}`);
          schedule = await prisma.schedule.create({
            data: {
              bidPeriodId,
              lineNumber: parsedSchedule.lineNumber,
              operationId: finalOperationId,
              groupName: null // Don't use GROUP column as groupName since it represents operation
            }
          });
        }

        // Delete existing schedule shifts
        await prisma.scheduleShift.deleteMany({
          where: { scheduleId: schedule.id }
        });

        // Create schedule shifts for the 56-day cycle
        const scheduleShifts = [];
        
        for (let dayNumber = 1; dayNumber <= 56; dayNumber++) {
          const dayDate = new Date(cycleStartDate);
          dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
          
          // Find shift for this day number (shifts use day numbers as zero-padded strings)
          const dayString = dayNumber.toString().padStart(3, '0');
          const shift = parsedSchedule.shifts.find(s => s.date === dayString);
          
          // Find matching shift code in database or create placeholder
          let shiftCodeId = null;
          if (shift && shift.shiftCode && shift.shiftCode !== 'OFF') {
            let shiftCode = await prisma.shiftCode.findUnique({
              where: { code: shift.shiftCode }
            });
            
            if (!shiftCode) {
              console.warn(`Shift code not found: ${shift.shiftCode} - creating placeholder`);
              // Create a placeholder shift code with unknown times
              shiftCode = await prisma.shiftCode.create({
                data: {
                  code: shift.shiftCode,
                  beginTime: '????',
                  endTime: '????',
                  category: 'UNKNOWN',
                  hoursLength: 0
                }
              });
              
              // Track this as an error for the upload report
              errors.push({
                lineNumber: parsedSchedule.lineNumber,
                error: `Created placeholder for unknown shift code: ${shift.shiftCode}`
              });
            }
            shiftCodeId = shiftCode?.id || null;
          }

          // Always create an entry for each day (56 total)
          scheduleShifts.push({
            scheduleId: schedule.id,
            dayNumber,
            date: dayDate,
            shiftCodeId, // null for OFF days
            isHoliday: false
          });
        }

        await prisma.scheduleShift.createMany({
          data: scheduleShifts
        });

        // Create or update corresponding bid line
        const existingBidLine = await prisma.bidLine.findFirst({
          where: {
            operationId: finalOperationId,
            lineNumber: parsedSchedule.lineNumber
          }
        });

        if (existingBidLine) {
          // Update existing bid line to link to this schedule
          await prisma.bidLine.update({
            where: { id: existingBidLine.id },
            data: {
              scheduleId: schedule.id,
              bidPeriodId: schedule.bidPeriodId,
              updatedAt: new Date()
            }
          });
          
          // Calculate and update schedule metrics
          try {
            await updateBidLineMetrics(existingBidLine.id);
          } catch (error) {
            console.warn(`Failed to update metrics for bid line ${existingBidLine.id}:`, error);
          }
          
          createdBidLines.push({
            id: existingBidLine.id,
            lineNumber: parsedSchedule.lineNumber,
            action: 'updated'
          });
        } else {
          // Create new bid line linked to this schedule
          const newBidLine = await prisma.bidLine.create({
            data: {
              operationId: finalOperationId,
              lineNumber: parsedSchedule.lineNumber,
              bidPeriodId: schedule.bidPeriodId,
              scheduleId: schedule.id,
              daysOfWeek: [], // Will be calculated from schedule
              status: 'AVAILABLE',
              description: `Line ${parsedSchedule.lineNumber}${parsedSchedule.groupName ? ` Group ${parsedSchedule.groupName}` : ''}`
            }
          });
          
          // Calculate and update schedule metrics
          try {
            await updateBidLineMetrics(newBidLine.id);
          } catch (error) {
            console.warn(`Failed to update metrics for bid line ${newBidLine.id}:`, error);
          }
          
          createdBidLines.push({
            id: newBidLine.id,
            lineNumber: parsedSchedule.lineNumber,
            action: 'created'
          });
        }

        createdSchedules.push({
          id: schedule.id,
          lineNumber: parsedSchedule.lineNumber,
          groupName: parsedSchedule.groupName,
          shiftsCount: parsedSchedule.shifts.length
        });
      } catch (error) {
        console.error(`Error processing schedule ${parsedSchedule.lineNumber}:`, error);
        console.error('Full error details:', error);
        errors.push({
          lineNumber: parsedSchedule.lineNumber,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log(`Upload summary: ${allSchedules.length} processed, ${createdSchedules.length} schedules, ${createdBidLines.length} bid lines, ${errors.length} errors`);
    
    return NextResponse.json({
      success: true,
      processed: allSchedules.length,
      created: createdSchedules.length,
      bidLines: createdBidLines.length,
      schedules: createdSchedules,
      bidLineDetails: createdBidLines,
      errors
    });

  } catch (error) {
    console.error("Error uploading schedules:", error);
    return NextResponse.json(
      { 
        error: "Failed to upload schedules",
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

export const POST = withSupervisor(uploadSchedules);