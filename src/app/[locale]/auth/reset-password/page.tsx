import { Metadata } from 'next';
import { Suspense } from 'react';
import { useTranslation } from '@/lib/i18n';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password - ShiftBid',
  description: 'Set your new password',
};

interface ResetPasswordPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  const { t } = useTranslation(locale);
  
  const translations = {
    resetPassword: t('auth.resetPasswordTitle'),
    newPassword: t('auth.newPassword'),
    confirmPassword: t('auth.confirmPassword'),
    resetPasswordButton: t('auth.resetPasswordButton'),
    backToLogin: t('auth.backToLogin'),
    passwordUpdated: t('auth.passwordUpdated'),
    passwordMismatch: t('auth.passwordMismatch'),
    passwordTooShort: t('auth.passwordTooShort'),
    resetError: t('auth.resetError'),
    invalidToken: t('auth.invalidToken'),
    resetting: t('auth.resetting'),
    enterNewPassword: t('auth.enterNewPassword')
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {translations.resetPassword}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {translations.enterNewPassword}
          </p>
        </div>
        
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm 
            locale={locale}
            translations={translations}
          />
        </Suspense>
      </div>
    </div>
  );
}