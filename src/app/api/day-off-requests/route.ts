import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's day-off requests
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dayOffRequest = await prisma.dayOffRequest.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(dayOffRequest || { dates: [], notes: null });
  } catch (error) {
    console.error('Error fetching day-off requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day-off requests' },
      { status: 500 }
    );
  }
}

// POST/PUT - Save or update user's day-off requests
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dates, notes } = await request.json();

    // Convert date strings to DateTime objects at noon UTC to avoid timezone shifts
    const dateObjects = dates.map((date: string) => {
      // Parse as noon UTC to avoid midnight timezone issues
      return new Date(`${date}T12:00:00.000Z`);
    });

    const dayOffRequest = await prisma.dayOffRequest.upsert({
      where: { userId: session.user.id },
      update: {
        dates: dateObjects,
        notes,
      },
      create: {
        userId: session.user.id,
        dates: dateObjects,
        notes,
      },
    });

    return NextResponse.json(dayOffRequest);
  } catch (error) {
    console.error('Error saving day-off requests:', error);
    return NextResponse.json(
      { error: 'Failed to save day-off requests' },
      { status: 500 }
    );
  }
}

// DELETE - Clear user's day-off requests
export async function DELETE() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.dayOffRequest.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting day-off requests:', error);
    return NextResponse.json(
      { error: 'Failed to delete day-off requests' },
      { status: 500 }
    );
  }
}