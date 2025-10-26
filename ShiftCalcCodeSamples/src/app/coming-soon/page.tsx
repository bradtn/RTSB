// src/app/coming-soon/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import MobileHeader from "@/components/mobile/MobileHeader";

export default function ComingSoonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [countdown, setCountdown] = useState(5);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Handle countdown and auto-navigate back
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      router.push("/");
    }
  }, [countdown, router]);

  // Show loading spinner while checking auth
  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col">
        <MobileHeader isLoading={true} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // Don't show content if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className={`flex min-h-screen flex-col ${styles.bodyBg}`}>
      <MobileHeader />
      <main className="flex-1 p-4 flex flex-col items-center justify-center text-center">
        <div className={`flex h-24 w-24 items-center justify-center rounded-full mb-6 ${
          theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
        }`}>
          <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        
        <h1 className={`text-2xl font-bold ${styles.textPrimary} mb-4`}>
          Coming Soon
        </h1>
        
        <p className={`${styles.textSecondary} max-w-md mb-8`}>
          We're working hard to bring you this feature. Please check back later!
        </p>
        
        <div className={`rounded-full w-16 h-16 ${styles.cardBg} flex items-center justify-center mb-8 ${
          theme === 'dark' ? 'border border-gray-700' : 'border border-gray-200'
        }`}>
          <span className={`text-xl font-bold ${styles.textPrimary}`}>{countdown}</span>
        </div>
        
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>
      </main>
    </div>
  );
}