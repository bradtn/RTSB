import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { getClientIP, getUserAgent } from '@/lib/request-utils';

const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
  badgeNumber: z.string().optional(),
  language: z.enum(['EN', 'FR']).default('EN'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 400 });
    }

    // Check badge number uniqueness if provided
    if (validatedData.badgeNumber) {
      const existingBadge = await prisma.user.findUnique({
        where: { badgeNumber: validatedData.badgeNumber }
      });

      if (existingBadge) {
        return NextResponse.json({ error: 'Badge number already in use' }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user with OFFICER role (pending approval)
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
        role: 'OFFICER',
        badgeNumber: validatedData.badgeNumber,
        language: validatedData.language,
        emailVerified: null, // Requires email verification
      }
    });

    // Log registration activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        details: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
      }
    });

    // Send welcome email (if email service is configured)
    try {
      const welcomeSubject = validatedData.language === 'FR' 
        ? 'Bienvenue sur Shift Bidding System'
        : 'Welcome to Shift Bidding System';
      
      const welcomeText = validatedData.language === 'FR'
        ? `Bonjour ${user.firstName} ${user.lastName},\n\nBienvenue sur Shift Bidding System. Votre compte a été créé avec succès.\n\nEmail: ${user.email}\nVeuillez utiliser le mot de passe que vous avez créé lors de l'inscription.\n\nCordialement,\nL'équipe Shift Bidding`
        : `Hello ${user.firstName} ${user.lastName},\n\nWelcome to Shift Bidding System. Your account has been created successfully.\n\nEmail: ${user.email}\nPlease use the password you created during registration.\n\nBest regards,\nShift Bidding Team`;

      await sendEmail({
        to: user.email,
        subject: welcomeSubject,
        html: welcomeText.replace(/\n/g, '<br>'),
        text: welcomeText,
      });
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Notify admins of new registration (optional)
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { email: true, firstName: true, lastName: true, language: true }
      });

      for (const admin of admins) {
        const adminMessage = admin.language === 'FR' 
          ? `Un nouvel utilisateur s'est inscrit:\n\nNom: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nBadge: ${user.badgeNumber || 'N/A'}\nLangue: ${user.language}\n\nConnectez-vous au système pour approuver ce compte.`
          : `A new user has registered:\n\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nBadge: ${user.badgeNumber || 'N/A'}\nLanguage: ${user.language}\n\nPlease log in to the system to approve this account.`;
        
        await sendEmail({
          to: admin.email,
          subject: admin.language === 'FR' 
            ? 'Nouvelle inscription utilisateur' 
            : 'New User Registration',
          text: adminMessage,
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h3>${admin.language === 'FR' ? 'Nouvelle inscription' : 'New Registration'}</h3>
              <p>${admin.language === 'FR' ? 'Un nouvel utilisateur s\'est inscrit:' : 'A new user has registered:'}</p>
              <ul>
                <li><strong>${admin.language === 'FR' ? 'Nom' : 'Name'}:</strong> ${user.firstName} ${user.lastName}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>${admin.language === 'FR' ? 'Badge' : 'Badge'}:</strong> ${user.badgeNumber || 'N/A'}</li>
                <li><strong>${admin.language === 'FR' ? 'Langue' : 'Language'}:</strong> ${user.language}</li>
              </ul>
              <p>${admin.language === 'FR' 
                ? 'Connectez-vous au système pour approuver ce compte.' 
                : 'Please log in to the system to approve this account.'}</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.warn('Failed to notify admins:', emailError);
    }

    // Don't return sensitive information
    const { password, ...userResponse } = user;
    return NextResponse.json({ 
      message: 'Registration successful. Please check your email for further instructions.',
      user: userResponse 
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.issues 
      }, { status: 400 });
    }

    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}