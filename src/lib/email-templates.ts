import { useTranslation } from '@/lib/i18n';

interface PasswordResetEmailProps {
  firstName: string;
  resetUrl: string;
  locale: 'en' | 'fr';
}

export function getPasswordResetEmailContent({ firstName, resetUrl, locale }: PasswordResetEmailProps) {
  const { t } = useTranslation(locale);

  const subject = locale === 'fr' 
    ? 'Demande de réinitialisation de mot de passe - ShiftBid'
    : 'Password Reset Request - ShiftBid';

  const textMessage = locale === 'fr' 
    ? `Bonjour ${firstName},

Vous avez demandé de réinitialiser votre mot de passe pour votre compte ShiftBid.

Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :
${resetUrl}

Ce lien expirera dans 30 minutes pour des raisons de sécurité.

Si vous n'avez pas demandé cette réinitialisation de mot de passe, veuillez ignorer ce courriel et votre mot de passe restera inchangé.

Merci,
L'équipe ShiftBid`
    : `Hello ${firstName},

You have requested to reset your password for your ShiftBid account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 30 minutes for security reasons.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Thank you,
The ShiftBid Team`;

  const htmlMessage = locale === 'fr' 
    ? `
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
            <img src="https://453.shiftbid.ca/ShiftBidLogo.png" alt="Logo ShiftBid" style="max-height: 60px; height: auto;">
        </div>
        <!-- Content -->
        <div style="padding: 30px; line-height: 1.6; color: #333;">
            <h2 style="color: #2563eb; margin-top: 0;">Demande de réinitialisation de mot de passe</h2>
            <p>Bonjour ${firstName},</p>
            <p>Vous avez demandé de réinitialiser votre mot de passe pour votre compte ShiftBid.</p>
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Réinitialiser le mot de passe</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">Ce lien expirera dans 30 minutes pour des raisons de sécurité.</p>
            <p style="font-size: 14px; color: #6b7280;">Si vous n'avez pas demandé cette réinitialisation de mot de passe, veuillez ignorer ce courriel et votre mot de passe restera inchangé.</p>
        </div>
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">Ceci est une notification de sécurité automatique de ShiftBid.</p>
            <p style="margin: 5px 0 0 0;">Veuillez ne pas répondre à ce courriel.</p>
        </div>
    </div>
</body>
</html>`
    : `
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
            <img src="https://453.shiftbid.ca/ShiftBidLogo.png" alt="ShiftBid Logo" style="max-height: 60px; height: auto;">
        </div>
        <!-- Content -->
        <div style="padding: 30px; line-height: 1.6; color: #333;">
            <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
            <p>Hello ${firstName},</p>
            <p>You have requested to reset your password for your ShiftBid account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">This link will expire in 30 minutes for security reasons.</p>
            <p style="font-size: 14px; color: #6b7280;">If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This is an automated security notification from ShiftBid.</p>
            <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;

  return {
    subject,
    textMessage,
    htmlMessage
  };
}