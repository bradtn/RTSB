import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftCodes } = await request.json();

    if (!Array.isArray(shiftCodes) || shiftCodes.length === 0) {
      return NextResponse.json({ error: 'No shift codes provided' }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let unchanged = 0;
    const errors = [];

    for (const [index, shiftCodeData] of shiftCodes.entries()) {
      try {
        const { code, category, beginTime, endTime, hoursLength, isActive } = shiftCodeData;

        // Validate required fields
        if (!code || !category) {
          errors.push(`Row ${index + 2}: Code and Category are required`);
          continue;
        }

        const normalizedData = {
          category,
          beginTime: beginTime || '????',
          endTime: endTime || '????', 
          hoursLength: hoursLength || 0,
          isActive: Boolean(isActive)
        };

        // Check if shift code already exists
        const existingCode = await prisma.shiftCode.findFirst({
          where: { code }
        });

        if (existingCode) {
          // Check if any data actually changed
          const hasChanges = 
            existingCode.category !== normalizedData.category ||
            existingCode.beginTime !== normalizedData.beginTime ||
            existingCode.endTime !== normalizedData.endTime ||
            existingCode.hoursLength !== normalizedData.hoursLength ||
            existingCode.isActive !== normalizedData.isActive;

          if (hasChanges) {
            // Update existing shift code
            await prisma.shiftCode.update({
              where: { id: existingCode.id },
              data: normalizedData
            });
            updated++;
          } else {
            unchanged++;
          }
        } else {
          // Create new shift code
          await prisma.shiftCode.create({
            data: {
              code,
              ...normalizedData
            }
          });
          created++;
        }

      } catch (error: any) {
        console.error(`Error importing shift code at index ${index}:`, error);
        errors.push(`Row ${index + 2}: ${error.message || 'Unknown error'}`);
      }
    }

    const totalChanges = created + updated;
    
    return NextResponse.json({
      success: true,
      created,
      updated,
      unchanged,
      total: shiftCodes.length,
      totalChanges,
      errors
    });

  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}