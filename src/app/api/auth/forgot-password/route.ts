import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { getPasswordResetEmailContent } from '@/lib/email-templates';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists and get their language preference
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        firstName: true,
        language: true
      }
    });

    if (!user) {
      // Don't reveal if user doesn't exist (security best practice)
      return NextResponse.json({
        message: 'If an account with that email exists, you will receive a password reset link.'
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Clean up any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase().trim() }
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase().trim(),
        token,
        expires
      }
    });

    // Determine user's locale and reset URL
    const userLocale = (user.language === 'FR' ? 'fr' : 'en') as 'en' | 'fr';
    const resetUrl = `https://453.shiftbid.ca/${userLocale}/auth/reset-password?token=${token}`;
    
    // Get localized email content
    const { subject, textMessage, htmlMessage } = getPasswordResetEmailContent({
      firstName: user.firstName,
      resetUrl,
      locale: userLocale
    });

    await sendEmail({
      to: email.toLowerCase().trim(),
      subject,
      text: textMessage,
      html: htmlMessage
    });

    return NextResponse.json({
      message: 'If an account with that email exists, you will receive a password reset link.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}