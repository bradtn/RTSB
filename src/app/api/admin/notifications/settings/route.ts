import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface NotificationSettings {
  // Email Settings
  emailProvider: 'gmail' | 'exchange' | 'smtp';
  emailHost?: string;
  emailPort?: number;
  emailSecure?: boolean;
  emailUser?: string;
  emailPassword?: string;
  emailFromAddress?: string;
  emailFromName?: string;
  // Exchange specific
  exchangeUrl?: string;
  exchangeUsername?: string;
  exchangePassword?: string;
  // Gmail specific
  gmailClientId?: string;
  gmailClientSecret?: string;
  gmailRefreshToken?: string;
  // Twilio SMS Settings
  twilioEnabled: boolean;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  // General Settings
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    // Try to get existing settings
    let settings = await prisma.notificationSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          emailProvider: 'smtp',
          twilioEnabled: false,
          notificationsEnabled: true,
          emailNotificationsEnabled: true,
          smsNotificationsEnabled: false,
        }
      });
    }

    // Don't expose sensitive fields in full
    const sanitizedSettings = {
      ...settings,
      emailPassword: settings.emailPassword ? '••••••••' : '',
      exchangePassword: settings.exchangePassword ? '••••••••' : '',
      gmailClientSecret: settings.gmailClientSecret ? '••••••••' : '',
      gmailRefreshToken: settings.gmailRefreshToken ? '••••••••' : '',
      twilioAuthToken: settings.twilioAuthToken ? '••••••••' : '',
    };

    return NextResponse.json(sanitizedSettings);

  } catch (error: any) {
    console.error('Notification settings fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    const updates: Partial<NotificationSettings> = await request.json();

    // Get existing settings to preserve unchanged sensitive fields
    const existingSettings = await prisma.notificationSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Prepare update data, preserving existing sensitive values if new ones are masked
    const updateData: any = { ...updates };
    
    if (updates.emailPassword === '••••••••' && existingSettings?.emailPassword) {
      updateData.emailPassword = existingSettings.emailPassword;
    }
    if (updates.exchangePassword === '••••••••' && existingSettings?.exchangePassword) {
      updateData.exchangePassword = existingSettings.exchangePassword;
    }
    if (updates.gmailClientSecret === '••••••••' && existingSettings?.gmailClientSecret) {
      updateData.gmailClientSecret = existingSettings.gmailClientSecret;
    }
    if (updates.gmailRefreshToken === '••••••••' && existingSettings?.gmailRefreshToken) {
      updateData.gmailRefreshToken = existingSettings.gmailRefreshToken;
    }
    if (updates.twilioAuthToken === '••••••••' && existingSettings?.twilioAuthToken) {
      updateData.twilioAuthToken = existingSettings.twilioAuthToken;
    }

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.notificationSettings.update({
        where: { id: existingSettings.id },
        data: updateData
      });
    } else {
      // Create new settings
      settings = await prisma.notificationSettings.create({
        data: updateData
      });
    }

    // Return sanitized settings
    const sanitizedSettings = {
      ...settings,
      emailPassword: settings.emailPassword ? '••••••••' : '',
      exchangePassword: settings.exchangePassword ? '••••••••' : '',
      gmailClientSecret: settings.gmailClientSecret ? '••••••••' : '',
      gmailRefreshToken: settings.gmailRefreshToken ? '••••••••' : '',
      twilioAuthToken: settings.twilioAuthToken ? '••••••••' : '',
    };

    return NextResponse.json(sanitizedSettings);

  } catch (error: any) {
    console.error('Notification settings update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}