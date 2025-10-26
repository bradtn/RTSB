import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const bidLineId = id;
    const userId = session.user.id;

    // Check if already favorited
    const existing = await prisma.favoriteLine.findUnique({
      where: {
        userId_bidLineId: {
          userId,
          bidLineId,
        },
      },
    });

    if (existing) {
      // Use transaction for deletion to prevent race conditions
      await prisma.$transaction(async (tx) => {
        // Remove favorite
        await tx.favoriteLine.delete({
          where: {
            id: existing.id,
          },
        });

        // If it had a rank, shift down higher ranks
        if (existing.rank) {
          await tx.favoriteLine.updateMany({
            where: {
              userId: userId,
              rank: { gt: existing.rank },
            },
            data: {
              rank: { decrement: 1 },
            },
          });
        }
      });

      return NextResponse.json({ favorited: false });
    } else {
      // Use a transaction to prevent race conditions
      const favorite = await prisma.$transaction(async (tx) => {
        // Find the next available rank within transaction
        const highestRanked = await tx.favoriteLine.findFirst({
          where: {
            userId: userId,
            rank: { not: null },
          },
          orderBy: { rank: 'desc' },
        });
        const nextRank = (highestRanked?.rank || 0) + 1;

        // Add favorite with automatic rank assignment
        return await tx.favoriteLine.create({
          data: {
            userId,
            bidLineId,
            rank: nextRank,
          },
        });
      });

      // Check if line was taken and send notification
      const bidLine = await prisma.bidLine.findUnique({
        where: { id: bidLineId },
      });

      if (bidLine?.status === 'TAKEN') {
        // Log notification to history instead of creating a notification record
        await prisma.notificationHistory.create({
          data: {
            userId,
            type: 'LINE_TAKEN',
            subject: 'Favorited Line Taken',
            message: `Line ${bidLine.lineNumber} has already been taken`,
            deliveryMethod: 'IN_APP',
            status: 'DELIVERED',
            sentBy: 'SYSTEM',
            sentAt: new Date(),
            deliveredAt: new Date(),
            metadata: { bidLineId },
          },
        });
      }

      console.log('Created favorite with rank:', favorite.rank, 'for bidLine:', bidLineId, 'user:', userId);
      return NextResponse.json({ favorited: true, data: favorite });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}