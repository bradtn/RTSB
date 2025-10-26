import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notes, tags } = await request.json();
    const bidLineId = id;

    const favorite = await prisma.favoriteLine.findUnique({
      where: {
        userId_bidLineId: {
          userId: session.user.id,
          bidLineId,
        },
      },
    });

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    const updatedFavorite = await prisma.favoriteLine.update({
      where: { id: favorite.id },
      data: {
        notes,
        tags,
      },
      include: {
        bidLine: true,
      },
    });

    return NextResponse.json(updatedFavorite);
  } catch (error) {
    console.error('Error updating favorite notes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}