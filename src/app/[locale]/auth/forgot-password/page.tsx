import { Metadata } from 'next';
import { useTranslation } from '@/lib/i18n';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password - ShiftBid',
  description: 'Reset your password',
};

interface ForgotPasswordPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale } = await params;
  const { t } = useTranslation(locale);
  
  const translations = {
    forgotPassword: t('auth.forgotPasswordTitle'),
    resetInstructions: t('auth.resetInstructions'),
    email: t('auth.email'),
    sendResetLink: t('auth.sendResetLink'),
    backToLogin: t('auth.backToLogin'),
    resetLinkSent: t('auth.resetLinkSent'),
    emailRequired: t('auth.email'),
    invalidEmail: t('auth.resetError'),
    resetError: t('auth.resetError'),
    sending: t('auth.sending')
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {translations.forgotPassword}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {translations.resetInstructions}
          </p>
        </div>
        
        <ForgotPasswordForm 
          locale={locale}
          translations={translations}
        />
      </div>
    </div>
  );
}