import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Twilio } from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    // Get recipient phone from request body
    const body = await request.json();
    const { recipientPhone } = body;

    if (!recipientPhone) {
      return NextResponse.json(
        { success: false, message: 'Recipient phone number is required' },
        { status: 400 }
      );
    }

    // Get current notification settings
    const settings = await prisma.notificationSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, message: 'No notification settings found' },
        { status: 400 }
      );
    }

    if (!settings.smsNotificationsEnabled) {
      return NextResponse.json(
        { success: false, message: 'SMS notifications are disabled' },
        { status: 400 }
      );
    }

    if (!settings.twilioAccountSid || !settings.twilioAuthToken || !settings.twilioFromNumber) {
      return NextResponse.json(
        { success: false, message: 'Missing Twilio configuration' },
        { status: 400 }
      );
    }

    try {
      // Initialize Twilio client
      const client = new Twilio(settings.twilioAccountSid, settings.twilioAuthToken);
      
      const testMessage = `🚀 SHIFT BIDDING SYSTEM TEST 🚀

✅ SMS CONFIGURATION: WORKING
📡 Provider: Twilio
📞 From: ${settings.twilioFromNumber}
⏰ Time: ${new Date().toLocaleString()}
👤 Admin: ${session.user.name || session.user.email}

🔔 This is a test message to verify SMS notifications are working perfectly! You should receive real-time alerts when your favorite bid lines are taken.

💪 Ready to bid smart!`;

      // Send test SMS to the provided recipient phone number
      const message = await client.messages.create({
        body: testMessage,
        from: settings.twilioFromNumber,
        to: recipientPhone
      });

      return NextResponse.json({
        success: true,
        message: `Test SMS sent successfully to ${recipientPhone}`,
        details: {
          messageSid: message.sid,
          status: message.status,
          to: recipientPhone,
          from: settings.twilioFromNumber,
          timestamp: new Date().toISOString()
        }
      });

    } catch (twilioError: any) {
      console.error('Twilio test error:', twilioError);
      
      return NextResponse.json({
        success: false,
        message: `SMS test failed: ${twilioError.message}`,
        details: {
          error: twilioError.message,
          code: twilioError.code,
          moreInfo: twilioError.moreInfo
        }
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('SMS test endpoint error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}