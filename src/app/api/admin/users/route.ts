import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withSupervisor, withSuperAdmin } from '@/lib/api/withAuth';

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'SUPERVISOR', 'OFFICER']),
  badgeNumber: z.string().optional(),
  language: z.enum(['EN', 'FR']).default('EN'),
  operationIds: z.array(z.string()).optional()
});

async function getUsers(request: NextRequest & { user: any }, params?: any) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        badgeNumber: true,
        language: true,
        mustChangePassword: true,
        createdAt: true,
        operations: {
          include: {
            operation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function createUser(request: NextRequest & { user: any }, params?: any) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user with mustChangePassword set to true for first-time setup
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
        role: validatedData.role,
        badgeNumber: validatedData.badgeNumber,
        language: validatedData.language,
        mustChangePassword: true
      }
    });

    // Assign to operations if provided
    if (validatedData.operationIds && validatedData.operationIds.length > 0) {
      await Promise.all(
        validatedData.operationIds.map(operationId =>
          prisma.operationUser.create({
            data: {
              userId: user.id,
              operationId,
              isSupervisor: validatedData.role === 'SUPERVISOR'
            }
          })
        )
      );
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: request.user.id,
        action: 'USER_CREATED',
        details: {
          createdUserId: user.id,
          email: user.email,
          role: user.role
        }
      }
    });

    const { password, ...userResponse } = user;
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withSupervisor(getUsers);
export const POST = withSuperAdmin(createUser);