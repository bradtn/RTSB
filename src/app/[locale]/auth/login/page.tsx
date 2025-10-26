import { useTranslation } from '@/lib/i18n';
import Image from 'next/image';
import LoginForm from './LoginForm';
import LogoWithTheme from '@/components/common/LogoWithTheme';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = useTranslation(locale);

  // Pre-translate strings for client component
  const translations = {
    signIn: t('auth.signIn'),
    appTitle: t('app.title'),
    email: t('auth.email'),
    password: t('auth.password'),
    rememberMe: t('auth.rememberMe'),
    forgotPassword: t('auth.forgotPassword'),
    noAccount: t('auth.noAccount'),
    signUp: t('auth.signUp'),
    loginSuccess: t('messages.loginSuccess'),
    loginError: t('messages.loginError'),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/50">
        <div>
          <div className="flex justify-center mb-6">
            <LogoWithTheme className="h-20 w-auto object-contain" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {translations.signIn}
          </h2>
        </div>
        <LoginForm locale={locale} translations={translations} />
      </div>
    </div>
  );
}