// src/components/mobile/MobileLandingPage.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { useSession } from "next-auth/react";
import MobileHeader from "./MobileHeader";
import Image from "next/image";

export default function MobileLandingPage() {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Animation sequence on load
  useEffect(() => {
    // Animate in the logo
    const logoTimer = setTimeout(() => {
      setLogoLoaded(true);
    }, 300);
    
    return () => {
      clearTimeout(logoTimer);
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Handle navigation to shift calculator
  const navigateToShiftCalculator = () => {
    router.push("/shift-calculator");
  };

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
      <main className="flex-1 p-4">
        {/* Logo section */}
        <div className="flex justify-center mb-8 pt-6">
          <div className={`relative w-64 h-28 transform transition-all duration-700 
                         ${logoLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
            {/* Animated logo with pulse glow effect */}
            <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-200'} rounded-full filter blur-xl opacity-20 
                            animate-pulse-slow`}>
            </div>
            
            {/* Logo */}
            <div className="relative h-full w-full">
              <Image 
                src={theme === 'dark' ? "/images/logo-dark.png" : "/images/logo.png"} 
                alt="Logo" 
                fill 
                className={`object-contain drop-shadow-md transition-transform duration-300 
                           hover:scale-105 filter ${theme === 'dark' ? 'brightness-110' : 'brightness-100'}`}
                priority
                onLoadingComplete={() => setLogoLoaded(true)}
              />
            </div>
          </div>
        </div>

        {/* Welcome text */}
        <div className="text-center mb-8">
          <h1 className={`text-2xl font-bold ${styles.textPrimary} mb-2`}>
            Welcome, {session?.user?.name || 'User'}!
          </h1>
          <p className={`${styles.textSecondary}`}>
            What would you like to do today?
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-4 mt-4">
          {/* Shift Calculator */}
          <button
            onClick={navigateToShiftCalculator}
            className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>Shift Calculator</h2>
              <p className={`text-sm ${styles.textMuted}`}>Find and filter shift schedules based on your preferences</p>
            </div>
            <div className="ml-auto self-center">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Shift Trade Finder - NEW Feature */}
          <button
            onClick={() => router.push("/mirrored-lines")}
            className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md border-2 border-indigo-500 dark:border-indigo-400`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>Shift Trade Finder</h2>
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full">NEW</span>
              </div>
              <p className={`text-sm ${styles.textMuted}`}>Find mirror lines with time differences perfect for trading</p>
            </div>
            <div className="ml-auto self-center">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* iCal Download - NEW Feature */}
          <button
            onClick={() => router.push("/ical-download")}
            className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>Download Schedule</h2>
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">NEW</span>
              </div>
              <p className={`text-sm ${styles.textMuted}`}>Export any schedule to your calendar app</p>
            </div>
            <div className="ml-auto self-center">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Day Off Finder - NEW Feature */}
          <button
            onClick={() => router.push("/day-off-finder")}
            className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>Day Off Finder</h2>
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 rounded-full">NEW</span>
              </div>
              <p className={`text-sm ${styles.textMuted}`}>Find schedules with your desired days off</p>
            </div>
            <div className="ml-auto self-center">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
          
          {/* Schedule Comparison */}
          <button
            onClick={() => router.push("/schedule-comparison")}
            className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>Schedule Comparison</h2>
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">NEW</span>
              </div>
              <p className={`text-sm ${styles.textMuted}`}>Compare two schedules side by side</p>
            </div>
            <div className="ml-auto self-center">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Excel Schedule Upload */}
          <button
            onClick={() => router.push("/excel-upload")}
            className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>Excel Schedule Upload</h2>
              <p className={`text-sm ${styles.textMuted}`}>Upload schedule extracts for officers with accommodations</p>
            </div>
            <div className="ml-auto self-center">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Who's Working Now - NEW Feature - Admin only */}
          {session?.user?.role === "admin" && (
            <button
              onClick={() => router.push("/whos-working")}
              className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>Who's Working?</h2>
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">NEW</span>
                </div>
                <p className={`text-sm ${styles.textMuted}`}>See who's on duty right now</p>
              </div>
              <div className="ml-auto self-center">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}

          {/* Settings - For admin users only */}
          {session?.user?.role === "admin" && (
            <button
              onClick={() => router.push("/admin/mobile")}
              className={`flex items-start gap-4 rounded-lg ${styles.cardBg} p-4 shadow transition-shadow hover:shadow-md`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className={`mb-1 text-lg font-semibold ${styles.textPrimary}`}>Admin Panel</h2>
                <p className={`text-sm ${styles.textMuted}`}>Manage users and system settings</p>
              </div>
              <div className="ml-auto self-center">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}
        </div>

        {/* Version info */}
        <div className="mt-auto pt-8 text-center">
          <p className={`text-xs ${styles.textMuted}`}>
            ShiftCalc v1.0
          </p>
        </div>
      </main>
    </div>
  );
}