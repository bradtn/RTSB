'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  locale: string;
  translations: {
    newPassword: string;
    confirmPassword: string;
    resetPasswordButton: string;
    backToLogin: string;
    passwordUpdated: string;
    passwordMismatch: string;
    passwordTooShort: string;
    resetError: string;
    invalidToken: string;
    resetting: string;
  };
}

export default function ResetPasswordForm({ locale, translations }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const result = await response.json();
        
        if (response.ok && result.valid) {
          setTokenValid(true);
          setEmail(result.email);
        } else {
          setTokenValid(false);
          toast.error(result.error || translations.invalidToken);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setTokenValid(false);
        toast.error(translations.invalidToken);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, translations.invalidToken]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
        toast.success(translations.passwordUpdated);
      } else {
        toast.error(result.error || translations.resetError);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(translations.resetError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Validating reset link...
        </p>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Invalid Reset Link
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This password reset link is invalid or has expired.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
            Please request a new password reset link.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Request New Link
          </Link>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{translations.backToLogin}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Password Updated
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your password has been successfully updated.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
            You can now log in with your new password.
          </p>
        </div>
        <Link
          href={`/${locale}/auth/login`}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Continue to Login
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {email && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Resetting password for: <strong>{email}</strong>
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="password" className="sr-only">
            {translations.newPassword}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder={translations.newPassword}
            />
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="sr-only">
            {translations.confirmPassword}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              {...register('confirmPassword')}
              type="password"
              autoComplete="new-password"
              className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder={translations.confirmPassword}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              {translations.resetting}
            </>
          ) : (
            translations.resetPasswordButton
          )}
        </button>
      </div>

      <div className="text-center">
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{translations.backToLogin}</span>
        </Link>
      </div>
    </form>
  );
}