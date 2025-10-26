import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import twilio from 'twilio';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipient, subject, message, language } = body;

    if (!type || !recipient || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get notification settings
    const settings = await prisma.notificationSettings.findFirst();
    
    if (!settings) {
      console.warn('No notification settings found');
      return NextResponse.json({ error: 'Notification settings not configured' }, { status: 400 });
    }

    if (type === 'email') {
      // Send email notification
      let transporter;
      
      if (settings.emailProvider === 'SMTP') {
        transporter = nodemailer.createTransport({
          host: settings.emailHost || '',
          port: settings.emailPort || 587,
          secure: settings.emailSecure || false,
          auth: {
            user: settings.emailUser || '',
            pass: settings.emailPassword || '',
          },
        });
      } else if (settings.emailProvider === 'GMAIL') {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: settings.emailUser || '',
            pass: settings.emailPassword || '',
          },
        });
      } else if (settings.emailProvider === 'EXCHANGE') {
        transporter = nodemailer.createTransport({
          host: settings.emailHost || '',
          port: settings.emailPort || 587,
          secure: false,
          auth: {
            user: settings.emailUser || '',
            pass: settings.emailPassword || '',
          },
          tls: {
            ciphers: 'SSLv3',
          },
        });
      }

      if (transporter) {
        await transporter.sendMail({
          from: settings.emailUser || '',
          to: recipient,
          subject: subject || (language === 'FR' ? 'Notification de ligne favorite' : 'Favorite Line Notification'),
          text: message,
          html: `<p>${message}</p>`,
        });
        
        console.log(`Email sent to ${recipient}: ${message}`);
      }
    } else if (type === 'sms') {
      // Send SMS notification
      if (settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioFromNumber) {
        const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
        
        await client.messages.create({
          body: message,
          from: settings.twilioFromNumber,
          to: recipient,
        });
        
        console.log(`SMS sent to ${recipient}: ${message}`);
      } else {
        console.warn('Twilio settings not configured');
        return NextResponse.json({ error: 'SMS settings not configured' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}