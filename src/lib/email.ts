import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Get current notification settings
    const settings = await prisma.notificationSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!settings || !settings.emailNotificationsEnabled) {
      console.log('📧 Email notifications are disabled, skipping send');
      return;
    }

    // Prefer Resend API for better deliverability (check env vars first, then database settings)
    const resendApiKey = process.env.RESEND_API_KEY || settings.resendApiKey;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || settings.resendFromEmail;
    
    if (resendApiKey && resendFromEmail) {
      console.log('📧 Using Resend API for optimal deliverability...');
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text.replace(/\n/g, '<br>'),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      console.log('✅ Email sent successfully via Resend API to:', options.to);
      return;
    }

    let transporter;

    // Configure transporter based on email provider
    if (settings.emailProvider === 'RESEND') {
      // This should be handled above by the Resend API check, but just in case
      throw new Error('Resend provider selected but no API key/from email configured');
    } else if (settings.emailProvider === 'GMAIL') {
      if (!settings.emailUser || !settings.emailPassword) {
        throw new Error('Missing Gmail configuration');
      }

      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: settings.emailUser,
          pass: settings.emailPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else if (settings.emailProvider === 'EXCHANGE') {
      if (!settings.emailHost || !settings.emailUser || !settings.emailPassword) {
        throw new Error('Missing Exchange configuration');
      }

      transporter = nodemailer.createTransport({
        host: settings.emailHost || 'smtp.office365.com',
        port: settings.emailPort || 587,
        secure: false, // Use STARTTLS
        auth: {
          user: settings.emailUser,
          pass: settings.emailPassword,
        },
      });
    } else {
      // Custom SMTP
      if (!settings.emailHost || !settings.emailPort || !settings.emailUser || !settings.emailPassword) {
        throw new Error('Missing SMTP configuration');
      }

      // Special handling for Gmail SMTP
      if (settings.emailHost === 'smtp.gmail.com') {
        transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false, // Use STARTTLS
          auth: {
            user: settings.emailUser,
            pass: settings.emailPassword,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
      } else {
        // Generic SMTP
        transporter = nodemailer.createTransport({
          host: settings.emailHost,
          port: settings.emailPort,
          secure: settings.emailSecure || false,
          auth: {
            user: settings.emailUser,
            pass: settings.emailPassword,
          },
        });
      }
    }

    // Send email with professional from address
    const fromAddress = settings.emailFromAddress || `noreply@shiftbid.ca`;
    await transporter.sendMail({
      from: `"${settings.emailFromName || 'ShiftBid Notifications'}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replace(/\n/g, '<br>'),
    });

    console.log('✅ Email sent successfully to:', options.to);

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}