import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !['SUPER_ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const officers = await prisma.user.findMany({
      where: { role: 'OFFICER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        badgeNumber: true,
        email: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    const formattedOfficers = officers.map(officer => ({
      ...officer,
      fullName: `${officer.firstName} ${officer.lastName}`,
      displayName: officer.badgeNumber 
        ? `${officer.firstName} ${officer.lastName} (#${officer.badgeNumber})`
        : `${officer.firstName} ${officer.lastName}`
    }));

    return NextResponse.json(formattedOfficers);
  } catch (error) {
    console.error('Error fetching officers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}