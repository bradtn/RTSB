import { useTranslation } from '@/lib/i18n';
import RegisterForm from './RegisterForm';

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { t } = useTranslation(locale);

  // Pre-translate strings for client component
  const translations = {
    signUp: t('auth.signUp'),
    appTitle: t('app.title'),
    firstName: t('auth.firstName'),
    lastName: t('auth.lastName'),
    email: t('auth.email'),
    badgeNumber: t('auth.badgeNumber'),
    language: t('common.language'),
    password: t('auth.password'),
    haveAccount: t('auth.haveAccount'),
    signIn: t('auth.signIn'),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/50">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            {translations.signUp}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {translations.appTitle}
          </p>
        </div>
        <RegisterForm locale={locale} translations={translations} />
      </div>
    </div>
  );
}