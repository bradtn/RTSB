import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const { code, beginTime, endTime, category, hoursLength, isActive } = data;

    const shiftCode = await prisma.shiftCode.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(beginTime && { beginTime }),
        ...(endTime && { endTime }),
        ...(category && { category }),
        ...(hoursLength !== undefined && { hoursLength: parseFloat(hoursLength) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(shiftCode);
  } catch (error) {
    console.error("Error updating shift code:", error);
    return NextResponse.json(
      { error: "Failed to update shift code" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if shift code is being used in any schedules
    const usageCount = await prisma.scheduleShift.count({
      where: { shiftCodeId: id }
    });

    if (usageCount > 0) {
      // Soft delete by setting isActive to false
      await prisma.shiftCode.update({
        where: { id },
        data: { isActive: false }
      });
      
      return NextResponse.json({ 
        message: "Shift code deactivated (was in use)" 
      });
    } else {
      // Hard delete if not in use
      await prisma.shiftCode.delete({
        where: { id }
      });
      
      return NextResponse.json({ 
        message: "Shift code deleted" 
      });
    }
  } catch (error) {
    console.error("Error deleting shift code:", error);
    return NextResponse.json(
      { error: "Failed to delete shift code" }, 
      { status: 500 }
    );
  }
}