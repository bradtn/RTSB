import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Check authentication using JWT token (same as middleware)
    const token = await getToken({ req: request });
    console.log('Excel upload parse - token:', token ? 'EXISTS' : 'NULL');
    console.log('Excel upload parse - user:', token?.username);
    
    if (!token) {
      console.log('Excel upload parse - No token, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const nameCell = sheet['B1'];
    const periodCell = sheet['B2'];
    
    if (!nameCell || !periodCell) {
      return NextResponse.json(
        { error: 'Invalid Excel file format. Missing name or period information.' },
        { status: 400 }
      );
    }

    const name = nameCell.v as string;
    const period = periodCell.v as string;

    // First pass: collect all shifts including duplicates
    const rawShifts = [];
    let row = 5;
    
    while (true) {
      const dayCell = sheet[`A${row}`];
      const dateCell = sheet[`B${row}`];
      const shiftCell = sheet[`C${row}`];
      const timeCell = sheet[`D${row}`];
      const workCenterCell = sheet[`E${row}`];

      if (!dateCell) break;

      const dateValue = dateCell.v;
      let formattedDate = '';
      
      // Handle different date formats
      if (typeof dateValue === 'number' && dateValue.toString().length === 8) {
        // Format: YYYYMMDD (e.g., 20250601)
        const dateStr = dateValue.toString();
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof dateValue === 'string') {
        // Check if it's already in YYYY-MM-DD format
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDate = dateValue;
        } else if (dateValue.length === 8 && dateValue.match(/^\d{8}$/)) {
          // String format YYYYMMDD
          const year = dateValue.substring(0, 4);
          const month = dateValue.substring(4, 6);
          const day = dateValue.substring(6, 8);
          formattedDate = `${year}-${month}-${day}`;
        }
      }

      // Handle shift codes
      let shiftCode = shiftCell?.v || '';
      
      // Convert "Overtime" to "OT"
      if (shiftCode === 'Overtime') {
        shiftCode = 'OT';
      }

      rawShifts.push({
        date: formattedDate,
        dayOfWeek: dayCell?.v || '',
        shiftCode: shiftCode,
        shiftTime: timeCell?.v || '',
        workCenter: workCenterCell?.v || '',
      });

      row++;
    }

    // Second pass: consolidate shifts by date, prioritizing work shifts over OFF
    const shiftsByDate = new Map();
    
    for (const shift of rawShifts) {
      const existing = shiftsByDate.get(shift.date);
      
      if (!existing) {
        // First entry for this date
        shiftsByDate.set(shift.date, shift);
      } else {
        // Date already exists - check if we need to update
        // Priority: OT > Regular shifts > OFF
        if (shift.shiftCode === 'OT') {
          // OT always takes priority
          shiftsByDate.set(shift.date, shift);
        } else if (existing.shiftCode === 'OFF' && shift.shiftCode !== 'OFF') {
          // Any working shift overrides OFF
          shiftsByDate.set(shift.date, shift);
        }
        // Otherwise keep the existing entry
      }
    }
    
    // Convert map back to array, maintaining date order
    const shifts = Array.from(shiftsByDate.values());

    const result = {
      name,
      period,
      shifts: shifts.filter(shift => shift.date), // Keep all shifts with valid dates (including OFF days)
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to parse Excel file. Please ensure it is a valid schedule extract.' },
      { status: 500 }
    );
  }
}