import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bidPeriods = await prisma.bidPeriod.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: {
            schedules: true
          }
        }
      }
    });

    return NextResponse.json(bidPeriods);
  } catch (error) {
    console.error("Error fetching bid periods:", error);
    return NextResponse.json(
      { error: "Failed to fetch bid periods" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUPERVISOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { name, startDate, numCycles } = data;

    if (!name || !startDate || !numCycles) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    // Calculate end date based on 56-day cycles
    // Parse as UTC to avoid timezone issues
    const start = new Date(startDate + 'T00:00:00.000Z');
    const totalDays = 56 * numCycles;
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + totalDays - 1);

    // Deactivate other active bid periods
    await prisma.bidPeriod.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    const bidPeriod = await prisma.bidPeriod.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        numCycles: parseInt(numCycles),
        isActive: true
      }
    });

    return NextResponse.json(bidPeriod, { status: 201 });
  } catch (error) {
    console.error("Error creating bid period:", error);
    return NextResponse.json(
      { error: "Failed to create bid period" }, 
      { status: 500 }
    );
  }
}