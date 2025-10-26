// SMS sending utility using Twilio
import { prisma } from './prisma';

interface SMSOptions {
  to: string;
  body: string;
}

export async function sendSMS(options: SMSOptions): Promise<void> {
  console.log('📱 Sending SMS to:', options.to);
  console.log('📱 Message:', options.body);
  
  try {
    // Fetch Twilio settings from database
    const settings = await prisma.notificationSettings.findFirst();
    
    if (!settings || !settings.smsNotificationsEnabled) {
      throw new Error('SMS notifications are disabled in system settings.');
    }
    
    if (!settings.twilioAccountSid || !settings.twilioAuthToken || !settings.twilioFromNumber) {
      throw new Error('Twilio credentials not configured. Please configure SMS settings in the admin panel.');
    }
    
    // Use Twilio for real SMS sending
    const twilio = require('twilio');
    const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
    
    const message = await client.messages.create({
      from: settings.twilioFromNumber,
      to: options.to,
      body: options.body,
    });
    
    console.log('✅ SMS sent successfully via Twilio, SID:', message.sid);
    
  } catch (error: any) {
    console.error('❌ Failed to send SMS:', error.message);
    throw error;
  }
}