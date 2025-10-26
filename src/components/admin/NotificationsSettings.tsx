'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Mail, MessageCircle, TestTube, Save, Eye, EyeOff, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotificationSettings {
  id?: string;
  // Email Settings
  emailProvider: 'resend' | 'gmail' | 'exchange' | 'smtp';
  emailHost?: string;
  emailPort?: number;
  emailSecure?: boolean;
  emailUser?: string;
  emailPassword?: string;
  emailFromAddress?: string;
  emailFromName?: string;
  // Exchange specific
  exchangeUrl?: string;
  exchangeUsername?: string;
  exchangePassword?: string;
  // Gmail specific
  gmailClientId?: string;
  gmailClientSecret?: string;
  gmailRefreshToken?: string;
  // Resend Email Service
  resendApiKey?: string;
  resendFromEmail?: string;
  // Twilio SMS Settings
  twilioEnabled: boolean;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  // General Settings
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface NotificationTestResult {
  success: boolean;
  message: string;
  details?: any;
}

interface NotificationsSettingsProps {
  locale: string;
  translations: {
    // Navigation
    adminSettings: string;
    // Common
    commonSave: string;
    commonCancel: string;
    commonEdit: string;
    commonActive: string;
    commonInactive: string;
    commonStatus: string;
    // Messages
    changesSaved: string;
    changesError: string;
  };
}

export default function NotificationsSettings({ locale, translations }: NotificationsSettingsProps) {
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [testResults, setTestResults] = useState<{[key: string]: NotificationTestResult}>({});
  const [testing, setTesting] = useState<{[key: string]: boolean}>({});
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/notifications/settings');
      if (!res.ok) throw new Error('Failed to fetch notification settings');
      return res.json();
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<NotificationSettings>) => {
      const res = await fetch('/api/admin/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success(translations.changesSaved || 'Settings saved successfully');
    },
    onError: (error: any) => {
      toast.error(translations.changesError || `Failed to save settings: ${error.message}`);
    },
  });

  // Test connection mutations
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      if (!testEmailRecipient) {
        throw new Error('Please enter a test email address');
      }
      const res = await fetch('/api/admin/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testEmailRecipient }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onMutate: () => {
      setTesting(prev => ({ ...prev, email: true }));
    },
    onSettled: () => {
      setTesting(prev => ({ ...prev, email: false }));
    },
    onSuccess: (data) => {
      setTestResults(prev => ({ ...prev, email: data }));
      toast.success('Email test completed');
    },
    onError: (error: any) => {
      setTestResults(prev => ({ ...prev, email: { success: false, message: error.message } }));
      toast.error('Email test failed');
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async () => {
      if (!testPhoneNumber) {
        throw new Error('Please enter a test phone number');
      }
      const res = await fetch('/api/admin/notifications/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientPhone: testPhoneNumber }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result;
    },
    onMutate: () => {
      setTesting(prev => ({ ...prev, sms: true }));
    },
    onSettled: () => {
      setTesting(prev => ({ ...prev, sms: false }));
    },
    onSuccess: (data) => {
      setTestResults(prev => ({ ...prev, sms: data }));
      toast.success('SMS test completed');
    },
    onError: (error: any) => {
      setTestResults(prev => ({ ...prev, sms: { success: false, message: error.message } }));
      toast.error('SMS test failed');
    },
  });

  const [formData, setFormData] = useState<NotificationSettings>({
    emailProvider: 'smtp',
    twilioEnabled: false,
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof NotificationSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications Settings</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure email and SMS notification providers
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <Shield className="w-4 h-4" />
          Super Admin Only
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Settings */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 shadow-xl rounded-xl p-8 border border-blue-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              General Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.notificationsEnabled}
                  onChange={(e) => handleInputChange('notificationsEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Enable Notifications System
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.emailNotificationsEnabled}
                  onChange={(e) => handleInputChange('emailNotificationsEnabled', e.target.checked)}
                  disabled={!formData.notificationsEnabled}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Enable Email Notifications
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.smsNotificationsEnabled}
                  onChange={(e) => handleInputChange('smsNotificationsEnabled', e.target.checked)}
                  disabled={!formData.notificationsEnabled}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Enable SMS Notifications
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        {formData.emailNotificationsEnabled && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 shadow-xl rounded-xl p-8 border border-green-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Email Configuration
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Test email address"
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => testEmailMutation.mutate()}
                  disabled={testing.email || !testEmailRecipient}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <TestTube className="w-3 h-3" />
                  {testing.email ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            </div>

            {/* Email Provider Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Email Provider
              </label>
              <select
                value={formData.emailProvider}
                onChange={(e) => handleInputChange('emailProvider', e.target.value as 'resend' | 'gmail' | 'exchange' | 'smtp')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="resend">Resend (Recommended)</option>
                <option value="smtp">Generic SMTP</option>
                <option value="gmail">Gmail</option>
                <option value="exchange">Microsoft Exchange</option>
              </select>
            </div>

            {/* SMTP Settings */}
            {formData.emailProvider === 'smtp' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    value={formData.emailHost || ''}
                    onChange={(e) => handleInputChange('emailHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    SMTP Port *
                  </label>
                  <input
                    type="number"
                    value={formData.emailPort || ''}
                    onChange={(e) => handleInputChange('emailPort', parseInt(e.target.value))}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Email Username *
                  </label>
                  <input
                    type="email"
                    value={formData.emailUser || ''}
                    onChange={(e) => handleInputChange('emailUser', e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Email Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.emailPassword ? 'text' : 'password'}
                      value={formData.emailPassword || ''}
                      onChange={(e) => handleInputChange('emailPassword', e.target.value)}
                      placeholder="App password or regular password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('emailPassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.emailPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    From Address *
                  </label>
                  <input
                    type="email"
                    value={formData.emailFromAddress || ''}
                    onChange={(e) => handleInputChange('emailFromAddress', e.target.value)}
                    placeholder="notifications@yourcompany.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={formData.emailFromName || ''}
                    onChange={(e) => handleInputChange('emailFromName', e.target.value)}
                    placeholder="Shift Bidding System"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.emailSecure || false}
                      onChange={(e) => handleInputChange('emailSecure', e.target.checked)}
                      className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Use SSL/TLS (recommended for port 465)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Resend Settings */}
            {formData.emailProvider === 'resend' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Resend API Key *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.resendApiKey ? 'text' : 'password'}
                      value={formData.resendApiKey || ''}
                      onChange={(e) => handleInputChange('resendApiKey', e.target.value)}
                      placeholder="re_xxxxxxxxxxxx"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, resendApiKey: !prev.resendApiKey }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.resendApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get your API key from <a href="https://resend.com/api-keys" target="_blank" className="text-blue-500 hover:underline">resend.com</a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    From Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.resendFromEmail || ''}
                    onChange={(e) => handleInputChange('resendFromEmail', e.target.value)}
                    placeholder="noreply@yourdomain.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Must be from a verified domain in your Resend account
                  </p>
                </div>
              </div>
            )}

            {/* Gmail Settings */}
            {formData.emailProvider === 'gmail' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Gmail Client ID *
                  </label>
                  <input
                    type="text"
                    value={formData.gmailClientId || ''}
                    onChange={(e) => handleInputChange('gmailClientId', e.target.value)}
                    placeholder="Google Cloud Console Client ID"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Gmail Client Secret *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.gmailClientSecret ? 'text' : 'password'}
                      value={formData.gmailClientSecret || ''}
                      onChange={(e) => handleInputChange('gmailClientSecret', e.target.value)}
                      placeholder="Google Cloud Console Client Secret"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('gmailClientSecret')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.gmailClientSecret ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Gmail Refresh Token *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.gmailRefreshToken ? 'text' : 'password'}
                      value={formData.gmailRefreshToken || ''}
                      onChange={(e) => handleInputChange('gmailRefreshToken', e.target.value)}
                      placeholder="OAuth2 Refresh Token"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('gmailRefreshToken')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.gmailRefreshToken ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Exchange Settings */}
            {formData.emailProvider === 'exchange' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Exchange Server URL *
                  </label>
                  <input
                    type="url"
                    value={formData.exchangeUrl || ''}
                    onChange={(e) => handleInputChange('exchangeUrl', e.target.value)}
                    placeholder="https://outlook.office365.com/EWS/Exchange.asmx"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Exchange Username *
                  </label>
                  <input
                    type="email"
                    value={formData.exchangeUsername || ''}
                    onChange={(e) => handleInputChange('exchangeUsername', e.target.value)}
                    placeholder="user@company.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Exchange Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.exchangePassword ? 'text' : 'password'}
                      value={formData.exchangePassword || ''}
                      onChange={(e) => handleInputChange('exchangePassword', e.target.value)}
                      placeholder="Exchange password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('exchangePassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.exchangePassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults.email && (
              <div className={`mt-6 p-4 rounded-lg border ${
                testResults.email.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <p className={`font-medium ${
                  testResults.email.success 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  Email Test: {testResults.email.success ? 'Success' : 'Failed'}
                </p>
                <p className={`text-sm ${
                  testResults.email.success 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {testResults.email.message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SMS/Twilio Settings */}
        {formData.smsNotificationsEnabled && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 shadow-xl rounded-xl p-8 border border-purple-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  SMS Configuration (Twilio)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => testSmsMutation.mutate()}
                  disabled={testing.sms || !testPhoneNumber}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <TestTube className="w-3 h-3" />
                  {testing.sms ? 'Sending...' : 'Send Test'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Twilio Account SID *
                </label>
                <input
                  type="text"
                  value={formData.twilioAccountSid || ''}
                  onChange={(e) => handleInputChange('twilioAccountSid', e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Twilio Auth Token *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.twilioAuthToken ? 'text' : 'password'}
                    value={formData.twilioAuthToken || ''}
                    onChange={(e) => handleInputChange('twilioAuthToken', e.target.value)}
                    placeholder="Twilio Auth Token"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('twilioAuthToken')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.twilioAuthToken ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Twilio Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.twilioFromNumber || ''}
                  onChange={(e) => handleInputChange('twilioFromNumber', e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Test Results */}
            {testResults.sms && (
              <div className={`mt-6 p-4 rounded-lg border ${
                testResults.sms.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <p className={`font-medium ${
                  testResults.sms.success 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  SMS Test: {testResults.sms.success ? 'Success' : 'Failed'}
                </p>
                <p className={`text-sm ${
                  testResults.sms.success 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {testResults.sms.message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : (translations.commonSave || 'Save Settings')}
          </button>
        </div>
      </form>
    </div>
  );
}