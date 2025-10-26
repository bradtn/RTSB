import { NextRequest, NextResponse } from 'next/server';
import { withSupervisor } from '@/lib/api/withAuth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

interface NotificationRequest {
  userId: string;
  type: 'your_turn' | 'next_in_line' | 'reminder' | 'custom';
  templateId?: string;
  customSubject?: string;
  customMessage?: string;
  sendMethod?: 'email' | 'sms' | 'both';
}

// BEFORE: 15+ lines of auth boilerplate in every route
// AFTER: Clean, focused handler with auth handled by middleware
export const POST = withSupervisor(async (request) => {
  try {
    // request.user is now guaranteed to be authenticated supervisor/admin
    const body: NotificationRequest = await request.json();
    const { userId, type, templateId, customSubject, customMessage, sendMethod = 'email' } = body;

    // Fetch user and their seniority info
    const seniorityEntry = await prisma.seniorityList.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!seniorityEntry) {
      return NextResponse.json({ error: 'User not found in seniority list' }, { status: 404 });
    }

    const user = seniorityEntry.user;
    
    // Determine contact methods
    const emails = [
      seniorityEntry.personalEmail,
      seniorityEntry.workEmail,
      user.email,
    ].filter(Boolean);
    
    const phones = [
      seniorityEntry.personalPhone,
      seniorityEntry.workPhone,
      user.phoneNumber,
    ].filter(Boolean);

    // Get notification template or use custom message
    let subject = customSubject || '';
    let emailBody = customMessage || '';
    let smsBody = customMessage || '';

    if (templateId) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: templateId },
      });
      
      if (template) {
        subject = template.subject;
        emailBody = template.emailBody;
        smsBody = template.smsBody;
        
        // Replace variables
        const replacements = {
          '{{firstName}}': user.firstName,
          '{{lastName}}': user.lastName,
          '{{badgeNumber}}': user.badgeNumber || '',
          '{{rank}}': seniorityEntry.seniorityRank.toString(),
        };
        
        for (const [key, value] of Object.entries(replacements)) {
          subject = subject.replace(new RegExp(key, 'g'), value);
          emailBody = emailBody.replace(new RegExp(key, 'g'), value);
          smsBody = smsBody.replace(new RegExp(key, 'g'), value);
        }
      }
    } else if (type !== 'custom') {
      // Use default templates
      switch (type) {
        case 'your_turn':
          subject = 'Your Turn to Bid!';
          emailBody = `Hello ${user.firstName},\n\nIt's your turn to select your bid line. Please log in to the system to make your selection.\n\nBest regards,\nAdmin Team`;
          smsBody = `Hi ${user.firstName}, it's your turn to bid! Please log in to select your bid line.`;
          break;
        case 'next_in_line':
          subject = 'You\'re Next in Line';
          emailBody = `Hello ${user.firstName},\n\nYou're next in line to bid. Please be ready to make your selection soon.\n\nBest regards,\nAdmin Team`;
          smsBody = `Hi ${user.firstName}, you're next in line to bid. Please be ready.`;
          break;
        case 'reminder':
          subject = 'Bidding Reminder';
          emailBody = `Hello ${user.firstName},\n\nThis is a reminder about the ongoing bidding process. Please check your status.\n\nBest regards,\nAdmin Team`;
          smsBody = `Reminder: Please check your bidding status.`;
          break;
      }
    }

    // Send notifications
    let emailSent = false;
    let smsSent = false;
    let error = null;

    try {
      if ((sendMethod === 'email' || sendMethod === 'both') && emails.length > 0) {
        await sendEmail({
          to: emails[0] as string,
          subject,
          text: emailBody,
          html: emailBody.replace(/\n/g, '<br>'),
        });
        emailSent = true;
      }

      if ((sendMethod === 'sms' || sendMethod === 'both') && phones.length > 0) {
        await sendSMS({
          to: phones[0] as string,
          body: smsBody,
        });
        smsSent = true;
      }
    } catch (err: any) {
      error = err.message;
    }

    // Create notification history record
    await prisma.notificationHistory.create({
      data: {
        userId,
        recipientEmail: emailSent && emails.length > 0 ? emails[0] as string : null,
        recipientPhone: smsSent && phones.length > 0 ? phones[0] as string : null,
        type,
        deliveryMethod: sendMethod,
        subject,
        message: sendMethod === 'sms' ? smsBody : emailBody,
        status: error ? 'failed' : 'sent',
        error,
        sentBy: request.user.id, // Available thanks to withAuth middleware
        deliveredAt: error ? null : new Date(),
        metadata: {
          templateId,
          seniorityRank: seniorityEntry.seniorityRank,
        },
      },
    });

    return NextResponse.json({
      success: !error,
      message: error || 'Notification sent successfully',
      emailSent,
      smsSent,
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
});

// Example of different auth levels:
// export const GET = withAuthOnly(handler);      // Any authenticated user
// export const POST = withSupervisor(handler);   // Supervisor or Super Admin only  
// export const DELETE = withSuperAdmin(handler); // Super Admin only