import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { filterSchedules, ScheduleFilter, ScheduleWithShifts, PrismaScheduleWithShifts } from "@/lib/schedule-utils";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bidPeriodId = searchParams.get('bidPeriodId');
    const operationId = searchParams.get('operationId');
    const groupName = searchParams.get('group');
    const includeShifts = searchParams.get('includeShifts') === 'true';

    let where: any = { isActive: true };

    if (bidPeriodId) {
      where.bidPeriodId = bidPeriodId;
    }

    if (operationId) {
      where.operationId = operationId;
    }

    if (groupName) {
      where.groupName = groupName;
    }

    const include: any = {
      operation: true,
      bidPeriod: true,
      bidLines: true,
      _count: {
        select: {
          scheduleShifts: true
        }
      }
    };

    if (includeShifts) {
      include.scheduleShifts = {
        include: {
          shiftCode: true
        },
        orderBy: {
          dayNumber: 'asc' as const
        }
      };
    }

    const rawSchedules = await prisma.schedule.findMany({
      where,
      include,
      orderBy: [
        { groupName: 'asc' },
        // Remove lineNumber sorting here, we'll do natural sort in JS
      ]
    });

    // Apply additional filters if provided
    const filters: ScheduleFilter = {};
    
    const groupNames = searchParams.get('groupNames');
    if (groupNames) {
      filters.groupNames = groupNames.split(',');
    }

    const shiftCategories = searchParams.get('shiftCategories');
    if (shiftCategories) {
      filters.shiftCategories = shiftCategories.split(',');
    }

    const minHoursPerWeek = searchParams.get('minHoursPerWeek');
    if (minHoursPerWeek) {
      filters.minHoursPerWeek = parseFloat(minHoursPerWeek);
    }

    const maxHoursPerWeek = searchParams.get('maxHoursPerWeek');
    if (maxHoursPerWeek) {
      filters.maxHoursPerWeek = parseFloat(maxHoursPerWeek);
    }

    const maxConsecutiveDays = searchParams.get('maxConsecutiveDays');
    if (maxConsecutiveDays) {
      filters.maxConsecutiveDays = parseInt(maxConsecutiveDays);
    }

    const weekendsOff = searchParams.get('weekendsOff');
    if (weekendsOff) {
      filters.weekendsOff = weekendsOff === 'true';
    }

    // Safe type assertion - we control the include structure so we know it matches our interface
    const schedules = rawSchedules as unknown as ScheduleWithShifts[];
    let filteredSchedules: ScheduleWithShifts[] = schedules;
    if (includeShifts && Object.keys(filters).length > 0) {
      filteredSchedules = filterSchedules(filteredSchedules, filters);
    }

    // Natural sort function for line numbers
    const naturalSort = (a: string, b: string): number => {
      return a.localeCompare(b, undefined, { 
        numeric: true, 
        sensitivity: 'base',
        caseFirst: 'upper'
      });
    };

    // Sort schedules with natural sorting for line numbers
    const sortedSchedules = filteredSchedules.sort((a, b) => {
      // First sort by group name
      if (a.groupName !== b.groupName) {
        if (!a.groupName) return 1;
        if (!b.groupName) return -1;
        return a.groupName.localeCompare(b.groupName);
      }
      // Then natural sort by line number
      return naturalSort(a.lineNumber, b.lineNumber);
    });

    console.log(`Returning ${sortedSchedules.length} schedules`);
    return NextResponse.json(sortedSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !["SUPER_ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { bidPeriodId, lineNumber, operationId, groupName } = data;

    if (!bidPeriodId || !lineNumber || !operationId) {
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

    const schedule = await prisma.schedule.create({
      data: {
        bidPeriodId,
        lineNumber,
        operationId,
        groupName: groupName || null
      },
      include: {
        operation: true,
        bidPeriod: true
      }
    });

    // Create empty schedule shifts for 56-day cycle
    const scheduleShifts = [];
    for (let dayNumber = 1; dayNumber <= 56; dayNumber++) {
      const dayDate = new Date(bidPeriod.startDate);
      dayDate.setDate(dayDate.getDate() + (dayNumber - 1));
      
      scheduleShifts.push({
        scheduleId: schedule.id,
        dayNumber,
        date: dayDate,
        shiftCodeId: null,
        isHoliday: false
      });
    }

    await prisma.scheduleShift.createMany({
      data: scheduleShifts
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" }, 
      { status: 500 }
    );
  }
}