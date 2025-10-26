'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthWrapper from '@/components/auth/AuthWrapper';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <ThemeProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <AuthWrapper>
            {children}
          </AuthWrapper>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}