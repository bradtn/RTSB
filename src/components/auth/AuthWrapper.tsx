'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import FirstTimeSetup from './FirstTimeSetup';

interface AuthWrapperProps {
  children: React.ReactNode;
  locale?: string;
}

export default function AuthWrapper({ children, locale = 'en' }: AuthWrapperProps) {
  const { data: session, status } = useSession();

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is logged in and must change password, show the first-time setup flow
  if (session?.user?.mustChangePassword) {
    return (
      <div>
        {children}
        <FirstTimeSetup locale={locale} />
      </div>
    );
  }

  // Normal flow
  return <>{children}</>;
}