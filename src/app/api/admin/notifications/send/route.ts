import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      // Use default templates based on user's notification language
      const isFrench = user.notificationLanguage === 'FR';
      
      switch (type) {
        case 'your_turn':
          if (isFrench) {
            subject = 'C\'est votre tour d\'enchérir!';
            emailBody = `Bonjour ${user.firstName},\n\nC'est votre tour de sélectionner votre ligne d'enchère. Veuillez vous connecter au système pour faire votre sélection.\n\nCordialement,\nÉquipe d'administration`;
            smsBody = `Salut ${user.firstName}, c'est votre tour d'enchérir! Veuillez vous connecter pour sélectionner votre ligne.`;
          } else {
            subject = 'Your Turn to Bid!';
            emailBody = `Hello ${user.firstName},\n\nIt's your turn to select your bid line. Please log in to the system to make your selection.\n\nBest regards,\nAdmin Team`;
            smsBody = `Hi ${user.firstName}, it's your turn to bid! Please log in to select your bid line.`;
          }
          break;
        case 'next_in_line':
          if (isFrench) {
            subject = 'Vous êtes le prochain';
            emailBody = `Bonjour ${user.firstName},\n\nVous êtes le prochain à enchérir. Veuillez être prêt à faire votre sélection bientôt.\n\nCordialement,\nÉquipe d'administration`;
            smsBody = `Salut ${user.firstName}, vous êtes le prochain à enchérir. Soyez prêt.`;
          } else {
            subject = 'You\'re Next in Line';
            emailBody = `Hello ${user.firstName},\n\nYou're next in line to bid. Please be ready to make your selection soon.\n\nBest regards,\nAdmin Team`;
            smsBody = `Hi ${user.firstName}, you're next in line to bid. Please be ready.`;
          }
          break;
        case 'reminder':
          if (isFrench) {
            subject = 'Rappel d\'enchère';
            emailBody = `Bonjour ${user.firstName},\n\nCeci est un rappel concernant le processus d'enchère en cours. Veuillez vérifier votre statut.\n\nCordialement,\nÉquipe d'administration`;
            smsBody = `Rappel: Veuillez vérifier votre statut d'enchère.`;
          } else {
            subject = 'Bidding Reminder';
            emailBody = `Hello ${user.firstName},\n\nThis is a reminder about the ongoing bidding process. Please check your status.\n\nBest regards,\nAdmin Team`;
            smsBody = `Reminder: Please check your bidding status.`;
          }
          break;
      }
    }

    // Send notifications
    let emailSent = false;
    let smsSent = false;
    let error = null;

    try {
      console.log('📧 Notification send attempt:', { sendMethod, emailCount: emails.length, phoneCount: phones.length });
      console.log('📧 Email addresses:', emails);
      console.log('📧 Subject:', subject);
      
      if ((sendMethod === 'email' || sendMethod === 'both') && emails.length > 0) {
        console.log('📤 Sending email notification to:', emails[0]);
        // Create HTML email template with logo
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header with Logo -->
        <div style="padding: 20px; text-align: center; background: white;">
            <img src="https://shiftbid.ca/ShiftBidLogo.png" alt="ShiftBid Logo" style="max-height: 60px; height: auto;">
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; line-height: 1.6; color: #333;">
            ${emailBody.replace(/\n/g, '<br>')}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This is an automated notification from the Shift Bidding System.</p>
            <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

        await sendEmail({
          to: emails[0] as string, // Type assertion safe because we checked emails.length > 0
          subject,
          text: emailBody,
          html: htmlBody,
        });
        emailSent = true;
        console.log('✅ Email notification sent successfully');
      }

      if ((sendMethod === 'sms' || sendMethod === 'both') && phones.length > 0) {
        await sendSMS({
          to: phones[0] as string, // Type assertion safe because we checked phones.length > 0
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
        sentBy: session.user.id,
        deliveredAt: error ? null : new Date(),
        metadata: {
          templateId,
          seniorityRank: seniorityEntry.seniorityRank,
        },
      },
    });

    // Update bidding status if needed
    if (type === 'your_turn' && !error) {
      // Update current user status
      await prisma.seniorityList.update({
        where: { userId },
        data: { currentBiddingStatus: 'up_next' },
      });

      // Auto-notify next in line
      const nextInLine = await prisma.seniorityList.findFirst({
        where: {
          seniorityRank: seniorityEntry.seniorityRank + 1,
        },
      });

      if (nextInLine) {
        await prisma.seniorityList.update({
          where: { id: nextInLine.id },
          data: { currentBiddingStatus: 'next_in_line' },
        });

        // Send automatic notification to next in line
        await sendAutomaticNotification(nextInLine.userId, 'next_in_line', session.user.id);
      }
    }

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
}

// Helper function to send automatic notifications
async function sendAutomaticNotification(userId: string, type: string, sentBy: string) {
  try {
    const seniorityEntry = await prisma.seniorityList.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!seniorityEntry) return;

    const user = seniorityEntry.user;
    const preferredContact = seniorityEntry.preferredContact || 'email';
    const isFrench = user.notificationLanguage === 'FR';
    
    let subject = '';
    let message = '';
    let smsMessage = '';

    if (type === 'next_in_line') {
      if (isFrench) {
        subject = 'Vous êtes le prochain!';
        message = `Bonjour ${user.firstName},\n\nVous êtes maintenant le prochain à enchérir. Veuillez être prêt à faire votre sélection lorsque l'officier actuel complète son enchère.\n\nCordialement,\nÉquipe d'administration`;
        smsMessage = `Salut ${user.firstName}, vous êtes le prochain à enchérir! Soyez prêt.`;
      } else {
        subject = 'You\'re Next in Line!';
        message = `Hello ${user.firstName},\n\nYou're now next in line to bid. Please be ready to make your selection when the current officer completes their bid.\n\nBest regards,\nAdmin Team`;
        smsMessage = `Hi ${user.firstName}, you're next in line to bid! Please be ready.`;
      }
    }

    // Send based on preference
    const emails = [seniorityEntry.personalEmail, seniorityEntry.workEmail, user.email].filter(Boolean);
    const phones = [seniorityEntry.personalPhone, seniorityEntry.workPhone, user.phoneNumber].filter(Boolean);

    if ((preferredContact === 'email' || preferredContact === 'both') && emails.length > 0) {
      // Create HTML email template with logo for automatic notifications
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header with Logo -->
        <div style="padding: 20px; text-align: center; background: white;">
            <img src="https://shiftbid.ca/ShiftBidLogo.png" alt="ShiftBid Logo" style="max-height: 60px; height: auto;">
        </div>
        
        <!-- Content -->
        <div style="padding: 30px; line-height: 1.6; color: #333;">
            ${message.replace(/\n/g, '<br>')}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This is an automated notification from the Shift Bidding System.</p>
            <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

      await sendEmail({
        to: emails[0] as string, // Type assertion safe because we checked emails.length > 0
        subject,
        text: message,
        html: htmlBody,
      });
    }

    if ((preferredContact === 'sms' || preferredContact === 'both') && phones.length > 0) {
      await sendSMS({
        to: phones[0] as string, // Type assertion safe because we checked phones.length > 0
        body: smsMessage,
      });
    }

    // Log in history
    await prisma.notificationHistory.create({
      data: {
        userId,
        type,
        deliveryMethod: preferredContact,
        subject,
        message: preferredContact === 'sms' ? smsMessage : message,
        status: 'sent',
        sentBy,
        deliveredAt: new Date(),
        metadata: {
          automatic: true,
          trigger: 'your_turn_completed',
        },
      },
    });
  } catch (error) {
    console.error('Error sending automatic notification:', error);
  }
}