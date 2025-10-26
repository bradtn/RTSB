import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, firstName, lastName, badgeNumber, role, password } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If email is being changed, check for duplicates
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    // If badge number is being changed, check for duplicates
    if (badgeNumber && badgeNumber !== existingUser.badgeNumber) {
      const badgeExists = await prisma.user.findUnique({
        where: { badgeNumber },
      });
      
      if (badgeExists) {
        return NextResponse.json({ error: 'Badge number already in use' }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      email,
      firstName,
      lastName,
      badgeNumber: badgeNumber || null,
      role,
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        badgeNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATED',
        details: {
          updatedUserId: user.id,
          updatedUserEmail: user.email,
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
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

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascades will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_DELETED',
        details: {
          deletedUserId: id,
          deletedUserEmail: existingUser.email,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}