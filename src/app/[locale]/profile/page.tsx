import { getServerSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import ProfileClient from './ProfileClient';

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const session = await getServerSession();
  const { t } = useTranslation(locale);

  if (!session) {
    redirect(`/${locale}/auth/login`);
  }

  // Pre-translate strings for client component
  const translations = {
    // Header translations
    appTitle: t('app.title'),
    navHome: t('nav.home'),
    navBidLines: t('nav.bidLines'),

    navAdmin: t('nav.admin'),
    navProfile: t('nav.profile'),
    navLogin: t('nav.login'),
    navLogout: t('nav.logout'),
    // Profile translations
    profile: {
      title: t('profile.title'),
      accountInformation: t('profile.accountInformation'),
      name: t('profile.name'),
      email: t('profile.email'),
      badgeNumber: t('profile.badgeNumber'),
      role: t('profile.role'),
      notSet: t('profile.notSet'),
      manageSettings: t('profile.manageSettings'),
    },
    // Notification translations
    notifications: {
      title: t('notifications.title'),
      emailNotifications: t('notifications.emailNotifications'),
      smsNotifications: t('notifications.smsNotifications'),
      phoneNumber: t('notifications.phoneNumber'),
      phoneNumberPlaceholder: t('notifications.phoneNumberPlaceholder'),
      settingsUpdated: t('notifications.settingsUpdated'),
      updateError: t('notifications.updateError'),
    },
    // Day-off requests translations  
    dayOffRequests: {
      title: t('dayOffRequests.title'),
      description: t('dayOffRequests.description'),
      selectDates: t('dayOffRequests.selectDates'),
      notes: t('dayOffRequests.notes'),
      notesPlaceholder: t('dayOffRequests.notesPlaceholder'),
      save: t('common.save'),
      clear: t('common.clear'),
      saving: t('dayOffRequests.saving'),
      saved: t('dayOffRequests.saved'),
      cleared: t('dayOffRequests.cleared'),
      error: t('dayOffRequests.error'),
    },
    common: {
      save: t('common.save'),
    },
  };

  return <ProfileClient locale={locale} translations={translations} />;
}