'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  locale: string;
  translations: {
    email: string;
    sendResetLink: string;
    backToLogin: string;
    resetLinkSent: string;
    emailRequired: string;
    invalidEmail: string;
    resetError: string;
    sending: string;
  };
}

export default function ForgotPasswordForm({ locale, translations }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
        toast.success(translations.resetLinkSent);
      } else {
        toast.error(result.error || translations.resetError);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(translations.resetError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Check your email
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We've sent a password reset link to <strong>{getValues('email')}</strong>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            If you don't see the email, check your spam folder. The link expires in 30 minutes.
          </p>
        </div>
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{translations.backToLogin}</span>
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email" className="sr-only">
          {translations.email}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder={translations.email}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
        )}
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
              {translations.sending}
            </>
          ) : (
            translations.sendResetLink
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