'use client';

import { useSession } from 'next-auth/react';
import Header from '@/components/Layout/Header';
import NotificationPreferences from '@/components/user/NotificationPreferences';

interface ProfileClientProps {
  locale: string;
  translations: {
    // Header translations
    appTitle: string;
    navHome: string;
    navBidLines: string;
    navAdmin: string;
    navProfile: string;
    navLogin: string;
    navLogout: string;
    // Page translations
    [key: string]: any;
  };
}

export default function ProfileClient({ locale, translations }: ProfileClientProps) {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        locale={locale} 
        translations={translations}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {translations.profile?.title || translations.navProfile || 'Profile'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {translations.profile?.manageSettings || 'Manage your account settings and preferences'}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6">
          {/* User Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {translations.profile?.accountInformation || 'Account Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {translations.profile?.name || 'Name'}
                </label>
                <p className="text-gray-900 dark:text-gray-100">{session.user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {translations.profile?.email || 'Email'}
                </label>
                <p className="text-gray-900 dark:text-gray-100">{session.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {translations.profile?.badgeNumber || 'Badge Number'}
                </label>
                <p className="text-gray-900 dark:text-gray-100">{session.user.badgeNumber || (translations.profile?.notSet || 'Not set')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {translations.profile?.role || 'Role'}
                </label>
                <p className="text-gray-900 dark:text-gray-100 capitalize">
                  {session.user.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <NotificationPreferences translations={{ notifications: translations.notifications, common: translations.common }} />
        </div>
      </div>
    </div>
  );
}