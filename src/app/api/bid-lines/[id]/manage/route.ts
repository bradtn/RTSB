import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitBidLineUpdateFromServer } from '@/lib/socket-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !['SUPER_ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, officerId, officerName, notes } = body;

    // Get the bid line
    const bidLine = await prisma.bidLine.findUnique({
      where: { id },
      include: { operation: true }
    });

    if (!bidLine) {
      return NextResponse.json({ error: 'Bid line not found' }, { status: 404 });
    }

    let updatedBidLine;

    switch (action) {
      case 'assign':
        if (!officerName) {
          return NextResponse.json({ error: 'Officer name required for assignment' }, { status: 400 });
        }

        // If officerId is provided and not 'manual', verify the officer exists
        let officer = null;
        if (officerId && officerId !== 'manual') {
          officer = await prisma.user.findUnique({
            where: { id: officerId }
          });

          if (!officer) {
            return NextResponse.json({ error: 'Officer not found' }, { status: 404 });
          }
        }

        updatedBidLine = await prisma.bidLine.update({
          where: { id },
          data: {
            status: 'TAKEN',
            takenBy: officerName,
            takenAt: new Date(),
            notes: notes || null
          },
          include: {
            operation: true,
            schedule: {
              include: {
                scheduleShifts: {
                  include: { shiftCode: true },
                  orderBy: { dayNumber: 'asc' }
                }
              }
            }
          }
        });

        // Log the activity - only if user exists in database
        try {
          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              bidLineId: id,
              action: 'ADMIN_ASSIGNED_LINE',
              details: {
                assignedTo: officerName,
                assignedToId: officerId,
                notes: notes
              }
            }
          });
        } catch (logError) {
          console.warn('Failed to log activity (user may not exist in DB):', logError);
          // Continue without logging if user doesn't exist
        }

        // Send notifications to users who favorited this line
        try {
          const usersWithFavorites = await prisma.user.findMany({
            where: {
              favoritedLines: {
                some: {
                  bidLineId: id
                }
              },
              smsNotifications: true,
              phoneNumber: {
                not: null
              }
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              notificationLanguage: true
            }
          });

          for (const user of usersWithFavorites) {
            if (user.phoneNumber) {
              // Get remaining favorites with details for this user
              const remainingFavorites = await prisma.favoriteLine.findMany({
                where: {
                  userId: user.id,
                  bidLine: {
                    status: 'AVAILABLE'
                  }
                },
                include: {
                  bidLine: {
                    include: {
                      operation: true
                    }
                  }
                }
              });
              
              // Group remaining favorites by operation
              const favoritesByOperation = remainingFavorites.reduce((acc, fav) => {
                const opName = fav.bidLine.operation?.name || 'Unknown Operation';
                if (!acc[opName]) acc[opName] = [];
                acc[opName].push(fav.bidLine.lineNumber);
                return acc;
              }, {} as Record<string, string[]>);
              
              // Build the remaining lines text
              let remainingText = '';
              if (remainingFavorites.length > 0) {
                const operationTexts = Object.entries(favoritesByOperation).map(([opName, lineNumbers]) => {
                  const sortedLines = lineNumbers.sort((a, b) => parseInt(a) - parseInt(b));
                  return `📋 ${opName}: #${sortedLines.join(', #')}`;
                });
                remainingText = user.notificationLanguage === 'FR' 
                  ? `🔍 LIGNES FAVORITES RESTANTES:\n${operationTexts.join('\n')}`
                  : `🔍 REMAINING FAVORITES:\n${operationTexts.join('\n')}`;
              } else {
                remainingText = user.notificationLanguage === 'FR' 
                  ? '❌ Aucune ligne favorite restante - temps de chercher de nouvelles options!'
                  : '❌ No favorite lines remaining - time to scout for new options!';
              }
              
              const message = user.notificationLanguage === 'FR' 
                ? `🚨 ALERTE SHIFT BIDDING 🚨\n\n⚠️ Votre ligne favorite #${bidLine.lineNumber} (${bidLine.operation?.name}) vient d'être prise!\n\n${remainingText}\n\n📱 Connectez-vous rapidement pour voir les mises à jour en temps réel.`
                : `🚨 SHIFT BIDDING ALERT 🚨\n\n⚠️ Your favorite line #${bidLine.lineNumber} (${bidLine.operation?.name}) has just been taken!\n\n${remainingText}\n\n📱 Log in now to see real-time updates.`;
              
              // Send SMS notification directly using Twilio
              try {
                const settings = await prisma.notificationSettings.findFirst();
                if (settings && settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioFromNumber) {
                  const twilio = require('twilio');
                  const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);
                  
                  await client.messages.create({
                    body: message,
                    from: settings.twilioFromNumber,
                    to: user.phoneNumber,
                  });
                  
                  console.log(`SMS sent successfully to ${user.phoneNumber}: ${message}`);
                } else {
                  console.error('Twilio settings not configured properly');
                }
              } catch (smsError) {
                console.error(`Failed to send SMS to ${user.phoneNumber}:`, smsError);
              }
            }
          }
        } catch (notificationError) {
          console.error('Error sending favorite line notifications:', notificationError);
          // Continue without failing the assignment
        }

        break;

      case 'release':
        updatedBidLine = await prisma.bidLine.update({
          where: { id },
          data: {
            status: 'AVAILABLE',
            takenBy: null,
            takenAt: null,
            notes: notes || null
          },
          include: {
            operation: true,
            schedule: {
              include: {
                scheduleShifts: {
                  include: { shiftCode: true },
                  orderBy: { dayNumber: 'asc' }
                }
              }
            }
          }
        });

        // Log the activity - only if user exists in database
        try {
          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              bidLineId: id,
              action: 'ADMIN_RELEASED_LINE',
              details: {
                previouslyTakenBy: bidLine.takenBy,
                notes: notes
              }
            }
          });
        } catch (logError) {
          console.warn('Failed to log activity (user may not exist in DB):', logError);
          // Continue without logging if user doesn't exist
        }

        break;

      case 'blackout':
        updatedBidLine = await prisma.bidLine.update({
          where: { id },
          data: {
            status: 'BLACKED_OUT',
            takenBy: null,
            takenAt: null,
            notes: notes || null
          },
          include: {
            operation: true,
            schedule: {
              include: {
                scheduleShifts: {
                  include: { shiftCode: true },
                  orderBy: { dayNumber: 'asc' }
                }
              }
            }
          }
        });

        // Log the activity - only if user exists in database
        try {
          await prisma.activityLog.create({
            data: {
              userId: session.user.id,
              bidLineId: id,
              action: 'ADMIN_BLACKED_OUT_LINE',
              details: {
                notes: notes
              }
            }
          });
        } catch (logError) {
          console.warn('Failed to log activity (user may not exist in DB):', logError);
          // Continue without logging if user doesn't exist
        }

        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Emit real-time WebSocket update after successful management action
    if (updatedBidLine) {
      await emitBidLineUpdateFromServer({
        bidLineId: updatedBidLine.id,
        lineNumber: updatedBidLine.lineNumber,
        status: updatedBidLine.status as 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT',
        takenBy: updatedBidLine.takenBy || undefined,
        takenAt: updatedBidLine.takenAt?.toISOString(),
        operationName: updatedBidLine.operation?.name,
      });
    }

    return NextResponse.json(updatedBidLine);
  } catch (error) {
    console.error('Error managing bid line:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}