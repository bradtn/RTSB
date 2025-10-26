import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOperationSchema = z.object({
  name: z.string().min(1),
  nameEn: z.string().min(1),
  nameFr: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export async function GET() {
  try {
    const operations = await prisma.operation.findMany({
      include: {
        _count: {
          select: {
            users: true,
            bidLines: true,
          },
        },
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(operations);
  } catch (error) {
    console.error('Error fetching operations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createOperationSchema.parse(body);

    const operation = await prisma.operation.create({
      data: validatedData
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'OPERATION_CREATED',
        details: {
          operationId: operation.id,
          name: operation.name
        }
      }
    });

    return NextResponse.json(operation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating operation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}