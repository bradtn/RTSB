import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/sms';

interface CompleteRequest {
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'SUPERVISOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CompleteRequest = await request.json();
    const { userId } = body;

    // Find the user's seniority entry
    const seniorityEntry = await prisma.seniorityList.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!seniorityEntry) {
      return NextResponse.json({ error: 'User not found in seniority list' }, { status: 404 });
    }

    // Mark current user as completed
    await prisma.seniorityList.update({
      where: { userId },
      data: { 
        currentBiddingStatus: 'completed',
        hasBid: true,
        bidAt: new Date(),
      },
    });

    // Find the next person in line (next rank)
    const nextInLine = await prisma.seniorityList.findFirst({
      where: {
        seniorityRank: seniorityEntry.seniorityRank + 1,
      },
      include: {
        user: true,
      },
    });

    if (nextInLine) {
      // Update next person to 'up_next'
      await prisma.seniorityList.update({
        where: { id: nextInLine.id },
        data: { currentBiddingStatus: 'up_next' },
      });

      // Find the person after next (for 'next_in_line')
      const personAfterNext = await prisma.seniorityList.findFirst({
        where: {
          seniorityRank: seniorityEntry.seniorityRank + 2,
        },
        include: {
          user: true,
        },
      });

      if (personAfterNext) {
        // Update person after next to 'next_in_line'
        await prisma.seniorityList.update({
          where: { id: personAfterNext.id },
          data: { currentBiddingStatus: 'next_in_line' },
        });
      }


      // Also send "next in line" notification to person after next
      if (personAfterNext) {
        try {
          const emails = [personAfterNext.personalEmail, personAfterNext.workEmail, personAfterNext.user.email].filter(Boolean);
          const phones = [personAfterNext.personalPhone, personAfterNext.workPhone, personAfterNext.user.phoneNumber].filter(Boolean);
          
          // Check user's notification language preference
          const isFrench = personAfterNext.user.notificationLanguage === 'FR';
          
          let subject: string;
          let smsMessage: string;
          
          if (isFrench) {
            subject = 'Vous êtes le prochain!';
            smsMessage = `Salut ${personAfterNext.user.firstName}, vous êtes le prochain à enchérir! Soyez prêt.`;
          } else {
            subject = 'You\'re Next in Line!';
            smsMessage = `Hi ${personAfterNext.user.firstName}, you're next in line to bid! Please be ready.`;
          }

          if (phones.length > 0) {
            await sendSMS({
              to: phones[0] as string, // Type assertion safe because we checked phones.length > 0
              body: smsMessage,
            });
          }

          // Create notification history record
          await prisma.notificationHistory.create({
            data: {
              userId: personAfterNext.userId,
              recipientPhone: phones.length > 0 ? phones[0] as string : null,
              type: 'next_in_line',
              deliveryMethod: 'sms',
              subject: subject,
              message: smsMessage,
              status: 'sent',
              sentBy: session.user.id,
              deliveredAt: new Date(),
              metadata: {
                automatic: true,
                trigger: 'mark_as_completed',
              },
            },
          });

        } catch (notificationError) {
          console.error('Error sending next in line notification:', notificationError);
          // Don't fail the completion if notification fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Officer marked as completed and notifications sent',
      nextInLine: nextInLine ? {
        name: `${nextInLine.user.firstName} ${nextInLine.user.lastName}`,
        rank: nextInLine.seniorityRank,
      } : null,
    });

  } catch (error) {
    console.error('Error marking as completed:', error);
    return NextResponse.json({ error: 'Failed to mark as completed' }, { status: 500 });
  }
}