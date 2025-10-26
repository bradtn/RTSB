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
    if (!session || !['SUPER_ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const operation = await prisma.operation.update({
      where: { id },
      data: {
        name: body.name,
        nameEn: body.nameEn,
        nameFr: body.nameFr,
        description: body.description,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Error updating operation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if operation has related records
    const operation = await prisma.operation.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bidLines: true,
            users: true,
          },
        },
      },
    });

    if (!operation) {
      return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    }

    if (operation._count.bidLines > 0 || operation._count.users > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete operation with existing bid lines or users' 
      }, { status: 400 });
    }

    await prisma.operation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting operation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}