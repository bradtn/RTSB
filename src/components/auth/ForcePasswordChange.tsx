'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface ForcePasswordChangeProps {
  locale?: string;
  onPasswordChanged?: () => void;
}

export default function ForcePasswordChange({ locale = 'en', onPasswordChanged }: ForcePasswordChangeProps) {
  const { update } = useSession();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    title: locale === 'fr' ? 'Changement de mot de passe requis' : 'Password Change Required',
    subtitle: locale === 'fr' ? 'Vous devez changer votre mot de passe avant de continuer.' : 'You must change your password before continuing.',
    currentPassword: locale === 'fr' ? 'Mot de passe actuel' : 'Current Password',
    newPassword: locale === 'fr' ? 'Nouveau mot de passe' : 'New Password',
    confirmPassword: locale === 'fr' ? 'Confirmer le mot de passe' : 'Confirm Password',
    changePassword: locale === 'fr' ? 'Changer le mot de passe' : 'Change Password',
    cancel: locale === 'fr' ? 'Annuler' : 'Cancel',
    logout: locale === 'fr' ? 'Se déconnecter' : 'Logout',
    passwordRequirements: locale === 'fr' ? 'Le mot de passe doit contenir au moins 6 caractères.' : 'Password must be at least 6 characters long.',
    success: locale === 'fr' ? 'Mot de passe changé avec succès!' : 'Password changed successfully!',
    currentPasswordHint: locale === 'fr' ? 'Utilisez "password" si votre mot de passe a été réinitialisé' : 'Use "password" if your password was reset',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError(locale === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(t.passwordRequirements);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(t.success);
        // Update the session to clear mustChangePassword
        await update({ mustChangePassword: false });
        onPasswordChanged?.();
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
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
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
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
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              {t.changePassword}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}