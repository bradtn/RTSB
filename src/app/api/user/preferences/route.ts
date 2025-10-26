import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const body = await request.json();
    const { emailNotifications, smsNotifications, phoneNumber, notificationLanguage } = body;

    // Validate input
    if (typeof emailNotifications !== 'boolean' || typeof smsNotifications !== 'boolean') {
      return NextResponse.json({ error: 'Invalid notification preferences' }, { status: 400 });
    }

    // If SMS is enabled but no phone number provided, disable SMS
    const finalSmsNotifications = smsNotifications && phoneNumber?.trim() ? smsNotifications : false;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailNotifications,
        smsNotifications: finalSmsNotifications,
        phoneNumber: phoneNumber?.trim() || null,
        notificationLanguage: notificationLanguage || 'EN',
      },
      select: {
        id: true,
        emailNotifications: true,
        smsNotifications: true,
        phoneNumber: true,
        notificationLanguage: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotifications: true,
        smsNotifications: true,
        phoneNumber: true,
        notificationLanguage: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}