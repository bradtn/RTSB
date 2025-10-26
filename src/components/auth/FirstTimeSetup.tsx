'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle, User, Phone, Bell, Globe, CheckCircle } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface FirstTimeSetupProps {
  locale?: string;
  onSetupComplete?: () => void;
}

export default function FirstTimeSetup({ locale = 'en', onSetupComplete }: FirstTimeSetupProps) {
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data for all steps
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [profileData, setProfileData] = useState({
    phoneNumber: '',
    notificationLanguage: 'EN' as 'EN' | 'FR',
    emailNotifications: true,
    smsNotifications: false,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const t = {
    title: locale === 'fr' ? 'Configuration initiale du compte' : 'Account Initial Setup',
    subtitle: locale === 'fr' ? 'Configurons votre compte pour une meilleure expérience' : "Let's set up your account for the best experience",
    step1Title: locale === 'fr' ? 'Étape 1: Changer votre mot de passe' : 'Step 1: Change Your Password',
    step2Title: locale === 'fr' ? 'Étape 2: Préférences de profil' : 'Step 2: Profile Preferences',
    currentPassword: locale === 'fr' ? 'Mot de passe actuel' : 'Current Password',
    newPassword: locale === 'fr' ? 'Nouveau mot de passe' : 'New Password',
    confirmPassword: locale === 'fr' ? 'Confirmer le mot de passe' : 'Confirm Password',
    phoneNumber: locale === 'fr' ? 'Numéro de téléphone' : 'Phone Number',
    notificationLanguage: locale === 'fr' ? 'Langue des notifications' : 'Notification Language',
    emailNotifications: locale === 'fr' ? 'Notifications par courriel' : 'Email Notifications',
    smsNotifications: locale === 'fr' ? 'Notifications SMS' : 'SMS Notifications',
    next: locale === 'fr' ? 'Suivant' : 'Next',
    back: locale === 'fr' ? 'Retour' : 'Back',
    complete: locale === 'fr' ? 'Terminer la configuration' : 'Complete Setup',
    logout: locale === 'fr' ? 'Se déconnecter' : 'Logout',
    passwordRequirements: locale === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters long.',
    phoneOptional: locale === 'fr' ? 'Requis pour les notifications SMS' : 'Required for SMS notifications',
    currentPasswordHint: locale === 'fr' ? 'Utilisez "password" si votre mot de passe a été réinitialisé' : 'Use "password" if your password was reset',
    setupComplete: locale === 'fr' ? 'Configuration terminée avec succès!' : 'Setup completed successfully!',
    english: locale === 'fr' ? 'Anglais' : 'English',
    french: locale === 'fr' ? 'Français' : 'French',
  };

  const formatCanadianPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    else if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    else if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    else return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(locale === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError(t.passwordRequirements);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      if (res.ok) {
        setCurrentStep(2);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Save profile preferences
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (res.ok) {
        // Update session to clear mustChangePassword and reflect changes
        await update({ 
          mustChangePassword: false,
          phoneNumber: profileData.phoneNumber,
          notificationLanguage: profileData.notificationLanguage,
          emailNotifications: profileData.emailNotifications,
          smsNotifications: profileData.smsNotifications,
        });
        
        alert(t.setupComplete);
        onSetupComplete?.();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to save preferences');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <User className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-16 h-1 rounded ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <form onSubmit={handlePasswordSubmit} className="p-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {t.step1Title}
            </h4>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Current Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                {t.currentPassword} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="password"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.currentPasswordHint}
              </p>
            </div>

            {/* New Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                {t.newPassword} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                {t.confirmPassword} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.passwordRequirements}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
              >
                {t.logout}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {t.next}
              </button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <form onSubmit={handleProfileSubmit} className="p-6">
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {t.step2Title}
            </h4>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Phone Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                {t.phoneNumber}
              </label>
              <input
                type="tel"
                value={profileData.phoneNumber}
                onChange={(e) => setProfileData({ ...profileData, phoneNumber: formatCanadianPhone(e.target.value) })}
                className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="519-XXX-XXXX"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.phoneOptional}
              </p>
            </div>

            {/* Notification Language */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                {t.notificationLanguage} *
              </label>
              <select
                value={profileData.notificationLanguage}
                onChange={(e) => setProfileData({ ...profileData, notificationLanguage: e.target.value as 'EN' | 'FR' })}
                className="w-full px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EN">{t.english}</option>
                <option value="FR">{t.french}</option>
              </select>
            </div>

            {/* Notification Preferences */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                <Bell className="inline h-4 w-4 mr-1" />
                Notification Preferences
              </label>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={profileData.emailNotifications}
                    onChange={(e) => setProfileData({ ...profileData, emailNotifications: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t.emailNotifications}</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={profileData.smsNotifications}
                    onChange={(e) => setProfileData({ ...profileData, smsNotifications: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={!profileData.phoneNumber.trim()}
                  />
                  <span className={`ml-2 text-sm ${!profileData.phoneNumber.trim() ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t.smsNotifications}
                  </span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
              >
                {t.back}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {t.complete}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}