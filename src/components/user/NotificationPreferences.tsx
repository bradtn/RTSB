'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Mail, MessageSquare, Save, Phone, Languages } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationPreferencesProps {
  translations: {
    notifications?: {
      title?: string;
      emailNotifications?: string;
      smsNotifications?: string;
      phoneNumber?: string;
      phoneNumberPlaceholder?: string;
      save?: string;
      settingsUpdated?: string;
      updateError?: string;
    };
    common?: {
      save?: string;
    };
  };
}

export default function NotificationPreferences({ translations }: NotificationPreferencesProps) {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  // Helper function to format phone number - much simpler approach
  const formatCanadianPhone = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Don't format if empty
    if (digits.length === 0) return '';
    
    // Format based on length
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else {
      // Limit to 10 digits
      const limited = digits.slice(0, 10);
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  // Helper function to get raw phone number for storage
  const getRawPhoneNumber = (formatted: string) => {
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    return digits ? `+1${digits}` : ''; // Add +1 prefix for Canadian numbers
  };

  // Helper function to parse existing phone numbers from database
  const parsePhoneForDisplay = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // If it starts with 1 and has 11 digits, remove the 1 (country code)
    if (digits.startsWith('1') && digits.length === 11) {
      const actualNumber = digits.slice(1); // Remove the leading 1
      return formatCanadianPhone(actualNumber);
    }
    
    // Otherwise format as-is
    return formatCanadianPhone(digits);
  };

  const [preferences, setPreferences] = useState({
    emailNotifications: session?.user?.emailNotifications ?? true,
    smsNotifications: session?.user?.smsNotifications ?? false,
    phoneNumber: session?.user?.phoneNumber ? parsePhoneForDisplay(session.user.phoneNumber) : '',
    notificationLanguage: session?.user?.notificationLanguage ?? session?.user?.language ?? 'EN',
  });

  // Update preferences when session changes
  useEffect(() => {
    if (session?.user) {
      setPreferences({
        emailNotifications: session.user.emailNotifications ?? true,
        smsNotifications: session.user.smsNotifications ?? false,
        phoneNumber: session.user.phoneNumber ? parsePhoneForDisplay(session.user.phoneNumber) : '',
        notificationLanguage: session.user.notificationLanguage ?? session.user.language ?? 'EN',
      });
    }
  }, [session?.user?.emailNotifications, session?.user?.smsNotifications, session?.user?.phoneNumber, session?.user?.notificationLanguage]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...preferences,
          phoneNumber: getRawPhoneNumber(preferences.phoneNumber),
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update preferences');
      }

      // Update session with new data
      await update({
        phoneNumber: responseData.phoneNumber,
        emailNotifications: responseData.emailNotifications,
        smsNotifications: responseData.smsNotifications,
        notificationLanguage: responseData.notificationLanguage,
      });

      // Small delay to ensure session update propagates
      await new Promise(resolve => setTimeout(resolve, 100));

      toast.success(translations.notifications?.settingsUpdated || 'Settings updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error(translations.notifications?.updateError || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {translations.notifications?.title || 'Notification Preferences'}
        </h2>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Phone Number */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Phone className="h-4 w-4" />
            {translations.notifications?.phoneNumber || 'Phone Number'}
          </label>
          <input
            type="tel"
            value={preferences.phoneNumber}
            onChange={(e) => setPreferences(prev => ({ 
              ...prev, 
              phoneNumber: formatCanadianPhone(e.target.value)
            }))}
            placeholder="(555) 123-4567"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter your Canadian phone number (e.g., 5551234567). The +1 country code will be added automatically.
          </p>
        </div>

        {/* Notification Language */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Languages className="h-4 w-4" />
            Notification Language
          </label>
          <select
            value={preferences.notificationLanguage}
            onChange={(e) => setPreferences(prev => ({ 
              ...prev, 
              notificationLanguage: e.target.value as 'EN' | 'FR'
            }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
          >
            <option value="EN">English</option>
            <option value="FR">Français</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Choose the language for your SMS and email notifications
          </p>
        </div>

        {/* Email Notifications */}
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5">
            <input
              id="email-notifications"
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="email-notifications" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Mail className="h-4 w-4" />
              {translations.notifications?.emailNotifications || 'Email Notifications'}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Receive notifications when your favorite lines are taken
            </p>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="flex items-start gap-3">
          <div className="flex items-center h-5">
            <input
              id="sms-notifications"
              type="checkbox"
              checked={preferences.smsNotifications}
              onChange={(e) => setPreferences(prev => ({ ...prev, smsNotifications: e.target.checked }))}
              disabled={getRawPhoneNumber(preferences.phoneNumber).length < 12}
              className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="sms-notifications" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <MessageSquare className="h-4 w-4" />
              {translations.notifications?.smsNotifications || 'SMS Notifications'}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Receive SMS alerts when your favorite lines are taken
            </p>
            {getRawPhoneNumber(preferences.phoneNumber).length < 12 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Valid Canadian phone number required for SMS notifications
              </p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : (translations.common?.save || 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}