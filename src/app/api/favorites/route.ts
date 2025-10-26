import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'dateAdded';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const filterBy = searchParams.get('filterBy') || 'all';

    let orderBy: any = { createdAt: sortOrder };
    
    switch (sortBy) {
      case 'rank':
        orderBy = [
          { rank: 'asc' }, // Ranked favorites first (1, 2, 3...)
          { createdAt: 'desc' } // Then unranked by date
        ];
        break;
      case 'lineNumber':
        orderBy = { bidLine: { lineNumber: sortOrder } };
        break;
      case 'shiftTime':
        orderBy = { bidLine: { shiftStart: sortOrder } };
        break;
      case 'status':
        orderBy = { bidLine: { status: sortOrder } };
        break;
    }

    const where: any = {
      userId: session.user.id,
    };

    if (filterBy === 'available') {
      where.bidLine = { status: 'AVAILABLE' };
    } else if (filterBy === 'taken') {
      where.bidLine = { status: 'TAKEN' };
    } else if (filterBy === 'hasNotes') {
      where.notes = { not: null };
    }

    const favorites = await prisma.favoriteLine.findMany({
      where,
      include: {
        bidLine: {
          include: {
            operation: true,
          },
        },
      },
      orderBy,
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bidLineId, rank, notes } = await request.json();

    if (!bidLineId) {
      return NextResponse.json({ error: 'bidLineId is required' }, { status: 400 });
    }

    // Check if favorite already exists
    const existingFavorite = await prisma.favoriteLine.findUnique({
      where: {
        userId_bidLineId: {
          userId: session.user.id,
          bidLineId: bidLineId,
        },
      },
    });

    if (existingFavorite) {
      // If it already exists, return it with the bidLine included
      const favoriteWithBidLine = await prisma.favoriteLine.findUnique({
        where: {
          userId_bidLineId: {
            userId: session.user.id,
            bidLineId: bidLineId,
          },
        },
        include: {
          bidLine: {
            include: {
              operation: true,
            },
          },
        },
      });
      return NextResponse.json(favoriteWithBidLine);
    }

    // If no rank is provided, automatically assign the next available rank
    let finalRank = rank;
    if (!finalRank) {
      const highestRanked = await prisma.favoriteLine.findFirst({
        where: {
          userId: session.user.id,
          rank: { not: null },
        },
        orderBy: { rank: 'desc' },
      });
      finalRank = (highestRanked?.rank || 0) + 1;
    }

    // Shift other ranks if inserting at a specific position
    if (rank) {
      await prisma.favoriteLine.updateMany({
        where: {
          userId: session.user.id,
          rank: { gte: rank },
        },
        data: {
          rank: { increment: 1 },
        },
      });
    }

    const favorite = await prisma.favoriteLine.create({
      data: {
        userId: session.user.id,
        bidLineId,
        rank: finalRank,
        notes: notes || null,
      },
      include: {
        bidLine: {
          include: {
            operation: true,
          },
        },
      },
    });

    return NextResponse.json(favorite);
  } catch (error) {
    console.error('Error creating favorite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { favoriteId, rank, notes } = await request.json();

    if (!favoriteId) {
      return NextResponse.json({ error: 'favoriteId is required' }, { status: 400 });
    }

    // Verify ownership
    const existingFavorite = await prisma.favoriteLine.findFirst({
      where: {
        id: favoriteId,
        userId: session.user.id,
      },
    });

    if (!existingFavorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    // Handle rank changes
    if (rank !== undefined && rank !== existingFavorite.rank) {
      if (rank === null) {
        // Removing rank - shift down higher ranks
        await prisma.favoriteLine.updateMany({
          where: {
            userId: session.user.id,
            rank: { gt: existingFavorite.rank || 0 },
          },
          data: {
            rank: { decrement: 1 },
          },
        });
      } else {
        // Setting new rank
        if (existingFavorite.rank) {
          // Had a rank before - remove old position first
          await prisma.favoriteLine.updateMany({
            where: {
              userId: session.user.id,
              rank: { gt: existingFavorite.rank },
            },
            data: {
              rank: { decrement: 1 },
            },
          });
        }
        
        // Shift existing ranks to make space for new rank
        await prisma.favoriteLine.updateMany({
          where: {
            userId: session.user.id,
            rank: { gte: rank },
            id: { not: favoriteId },
          },
          data: {
            rank: { increment: 1 },
          },
        });
      }
    }

    const updatedFavorite = await prisma.favoriteLine.update({
      where: { id: favoriteId },
      data: {
        rank: rank,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        bidLine: {
          include: {
            operation: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFavorite);
  } catch (error) {
    console.error('Error updating favorite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const favoriteId = searchParams.get('favoriteId');
    const bidLineId = searchParams.get('bidLineId');

    if (!favoriteId && !bidLineId) {
      return NextResponse.json({ error: 'favoriteId or bidLineId is required' }, { status: 400 });
    }

    let whereClause: any = { userId: session.user.id };
    if (favoriteId) {
      whereClause.id = favoriteId;
    } else {
      whereClause.bidLineId = bidLineId;
    }

    // Find the favorite to get its rank
    const favoriteToDelete = await prisma.favoriteLine.findFirst({
      where: whereClause,
    });

    if (!favoriteToDelete) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    // Delete the favorite
    await prisma.favoriteLine.delete({
      where: { id: favoriteToDelete.id },
    });

    // If it had a rank, shift down higher ranks
    if (favoriteToDelete.rank) {
      await prisma.favoriteLine.updateMany({
        where: {
          userId: session.user.id,
          rank: { gt: favoriteToDelete.rank },
        },
        data: {
          rank: { decrement: 1 },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}