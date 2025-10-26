import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
    }

    // Get recipient email from request body
    const body = await request.json();
    const { recipientEmail } = body;

    if (!recipientEmail) {
      return NextResponse.json(
        { success: false, message: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Get current notification settings
    console.log('🔍 Fetching notification settings...');
    const settings = await prisma.notificationSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    console.log('⚙️ Settings found:', {
      exists: !!settings,
      emailProvider: settings?.emailProvider,
      emailNotificationsEnabled: settings?.emailNotificationsEnabled,
      emailUser: settings?.emailUser,
      hasPassword: !!settings?.emailPassword,
      passwordLength: settings?.emailPassword?.length || 0
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, message: 'No notification settings found' },
        { status: 400 }
      );
    }

    if (!settings.emailNotificationsEnabled) {
      return NextResponse.json(
        { success: false, message: 'Email notifications are disabled' },
        { status: 400 }
      );
    }

    // Prefer Resend API for better deliverability (check env vars first, then database settings)
    const resendApiKey = process.env.RESEND_API_KEY || settings.resendApiKey;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || settings.resendFromEmail;
    
    if (resendApiKey && resendFromEmail) {
      console.log('📧 Using Resend API for optimal deliverability...');
      
      const testEmailData = {
        from: resendFromEmail,
        to: recipientEmail,
        subject: 'Test Email - Shift Bidding System Notifications',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Email Configuration Test</h2>
            <p>This is a test email from the Shift Bidding System notification service.</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="color: #374151; margin: 0 0 8px 0;">Configuration Details:</h3>
              <ul style="color: #6b7280; margin: 0;">
                <li><strong>Provider:</strong> RESEND API</li>
                <li><strong>From:</strong> ${resendFromEmail}</li>
                <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p style="color: #059669;"><strong>✅ Email notifications are working correctly!</strong></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This test was initiated by ${session.user.name || session.user.email} from the admin panel.
            </p>
          </div>
        `,
        text: `
Email Configuration Test

This is a test email from the Shift Bidding System notification service.

Configuration Details:
- Provider: RESEND API
- From: ${resendFromEmail}
- Test Date: ${new Date().toLocaleString()}

✅ Email notifications are working correctly!

This test was initiated by ${session.user.name || session.user.email} from the admin panel.
        `
      };

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testEmailData),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Resend API error: ${error}`);
        }

        console.log('✅ Test email sent successfully via Resend API to:', recipientEmail);
        
        return NextResponse.json({
          success: true,
          message: `Test email sent successfully to ${recipientEmail} via Resend API`,
          details: {
            provider: 'RESEND',
            to: recipientEmail,
            timestamp: new Date().toISOString()
          }
        });

      } catch (resendError: any) {
        console.error('Resend API test error:', resendError);
        
        return NextResponse.json({
          success: false,
          message: `Resend API test failed: ${resendError.message}`,
          details: {
            provider: 'RESEND',
            error: resendError.message
          }
        }, { status: 400 });
      }
    }

    let transporter;

    try {
      // Configure transporter based on email provider
      if (settings.emailProvider === 'RESEND') {
        throw new Error('Resend provider selected but no API key/from email configured');
      } else if (settings.emailProvider === 'GMAIL') {
        if (!settings.emailUser || !settings.emailPassword) {
          throw new Error('Missing Gmail configuration');
        }

        console.log('🔍 Using Gmail SMTP with SSL on port 465...');
        console.log('📧 Email User:', settings.emailUser);
        console.log('🔐 Password provided:', settings.emailPassword ? 'Yes (length: ' + settings.emailPassword.length + ')' : 'No');
        
        transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // Use SSL
          auth: {
            user: settings.emailUser,
            pass: settings.emailPassword,
          },
          connectionTimeout: 15000, // Increased timeout
          greetingTimeout: 10000,
          socketTimeout: 15000,
          debug: true,
          logger: true,
        });
      } else if (settings.emailProvider === 'EXCHANGE') {
        if (!settings.emailHost || !settings.emailUser || !settings.emailPassword) {
          throw new Error('Missing Exchange configuration');
        }

        // Note: Exchange Web Services would require additional setup
        // For now, we'll use SMTP fallback
        transporter = nodemailer.createTransport({
          host: settings.emailHost || 'smtp.office365.com',
          port: settings.emailPort || 587,
          secure: false,
          auth: {
            user: settings.emailUser,
            pass: settings.emailPassword,
          },
        });
      } else {
        // SMTP (including Gmail configured as SMTP)
        if (!settings.emailHost || !settings.emailPort || !settings.emailUser || !settings.emailPassword) {
          throw new Error('Missing SMTP configuration');
        }

        console.log('🔍 Using SMTP configuration...');
        console.log('📧 Host:', settings.emailHost);
        console.log('🔌 Port:', settings.emailPort);
        console.log('🔒 Secure:', settings.emailSecure);
        console.log('📧 Email User:', settings.emailUser);
        console.log('🔐 Password provided:', settings.emailPassword ? 'Yes (length: ' + settings.emailPassword.length + ')' : 'No');

        // Special handling for Gmail SMTP
        if (settings.emailHost === 'smtp.gmail.com') {
          console.log('📧 Detected Gmail SMTP, trying standard working configuration...');
          // Try the most basic Gmail configuration that usually works
          transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // Use STARTTLS instead of SSL
            auth: {
              user: settings.emailUser,
              pass: settings.emailPassword,
            },
            tls: {
              rejectUnauthorized: false // Accept self-signed certificates
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
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            debug: true,
            logger: true,
          });
        }
      }

      // Skip verification and try to send directly
      console.log('⏭️ Skipping verification, attempting direct send...');

      // Send test email with timeout
      const testEmail = {
        from: `"${settings.emailFromName || 'Shift Bidding System'}" <${settings.emailUser}>`,
        to: recipientEmail,
        subject: 'Test Email - Shift Bidding System Notifications',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Email Configuration Test</h2>
            <p>This is a test email from the Shift Bidding System notification service.</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="color: #374151; margin: 0 0 8px 0;">Configuration Details:</h3>
              <ul style="color: #6b7280; margin: 0;">
                <li><strong>Provider:</strong> ${settings.emailProvider.toUpperCase()}</li>
                <li><strong>Host:</strong> ${settings.emailHost || 'Gmail/Exchange'}</li>
                <li><strong>From:</strong> ${settings.emailUser}</li>
                <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p style="color: #059669;"><strong>✅ Email notifications are working correctly!</strong></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              This test was initiated by ${session.user.name || session.user.email} from the admin panel.
            </p>
          </div>
        `,
        text: `
Email Configuration Test

This is a test email from the Shift Bidding System notification service.

Configuration Details:
- Provider: ${settings.emailProvider.toUpperCase()}
- Host: ${settings.emailHost || 'Gmail/Exchange'}
- From: ${settings.emailUser}
- Test Date: ${new Date().toLocaleString()}

✅ Email notifications are working correctly!

This test was initiated by ${session.user.name || session.user.email} from the admin panel.
        `,
      };

      console.log('📤 Sending test email...');
      await Promise.race([
        transporter.sendMail(testEmail),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
        )
      ]);
      console.log('✅ Test email sent successfully');

      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${recipientEmail}`,
        details: {
          provider: settings.emailProvider,
          to: recipientEmail,
          timestamp: new Date().toISOString()
        }
      });

    } catch (emailError: any) {
      console.error('Email test error:', emailError);
      
      return NextResponse.json({
        success: false,
        message: `Email test failed: ${emailError.message}`,
        details: {
          provider: settings.emailProvider,
          error: emailError.message,
          code: emailError.code
        }
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Email test endpoint error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}