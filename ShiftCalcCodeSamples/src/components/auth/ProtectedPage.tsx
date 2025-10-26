'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Simple check for login status - using localStorage for simplicity
// In production, this would use proper authentication
export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('isAuthenticated') === 'true';
  }
  return false;
};

// Set login status
export const login = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('isAuthenticated', 'true');
  }
};

// Clear login status
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isAuthenticated');
  }
};

// Component to protect pages from unauthenticated access
export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip protection on login page
    if (pathname === '/login') {
      return;
    }
    
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [pathname, router]);

  return <>{children}</>;
}