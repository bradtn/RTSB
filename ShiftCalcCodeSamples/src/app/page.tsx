'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('LandingPage render:', { 
      mounted, 
      status, 
      isMobile, 
      sessionExists: !!session,
      pathname: window.location.pathname 
    });
  }, [mounted, status, isMobile, session]);

  useEffect(() => {
    setMounted(true);
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // No redirect needed - we'll show different content based on device

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/');
    }
  }, [status, router]);

  const modules = [
    {
      title: 'Shift Calculator',
      description: 'Find your perfect schedule based on preferences',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      href: '/shift-calculator',
      color: 'blue',
      available: true
    },
    {
      title: 'Shift Trade Finder',
      description: 'Find officers with matching days for easy shift swaps',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      href: '/mirrored-lines',
      color: 'purple',
      available: true
    },
    {
      title: 'Download Schedule',
      description: 'Get your schedule in your calendar app',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/ical-download',
      color: 'emerald',
      available: true
    },
    {
      title: 'Day Off Finder',
      description: 'Find who\'s off when you need coverage',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/day-off-finder',
      color: 'amber',
      available: true
    },
    {
      title: 'Schedule Comparison',
      description: 'Compare schedules side by side',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/schedule-comparison',
      color: 'indigo',
      available: true
    },
    {
      title: 'Excel Schedule Upload',
      description: 'Upload schedule extracts for officers with accommodations',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      href: '/excel-upload',
      color: 'rose',
      available: true
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50',
        border: theme === 'dark' ? 'border-blue-500' : 'border-blue-400',
        text: theme === 'dark' ? 'text-blue-300' : 'text-blue-700',
        hover: theme === 'dark' ? 'hover:bg-blue-900/30' : 'hover:bg-blue-100',
        icon: theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
      },
      purple: {
        bg: theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50',
        border: theme === 'dark' ? 'border-purple-500' : 'border-purple-400',
        text: theme === 'dark' ? 'text-purple-300' : 'text-purple-700',
        hover: theme === 'dark' ? 'hover:bg-purple-900/30' : 'hover:bg-purple-100',
        icon: theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
      },
      emerald: {
        bg: theme === 'dark' ? 'bg-emerald-900/20' : 'bg-emerald-50',
        border: theme === 'dark' ? 'border-emerald-500' : 'border-emerald-400',
        text: theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700',
        hover: theme === 'dark' ? 'hover:bg-emerald-900/30' : 'hover:bg-emerald-100',
        icon: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
      },
      amber: {
        bg: theme === 'dark' ? 'bg-amber-900/20' : 'bg-amber-50',
        border: theme === 'dark' ? 'border-amber-500' : 'border-amber-400',
        text: theme === 'dark' ? 'text-amber-300' : 'text-amber-700',
        hover: theme === 'dark' ? 'hover:bg-amber-900/30' : 'hover:bg-amber-100',
        icon: theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
      },
      indigo: {
        bg: theme === 'dark' ? 'bg-indigo-900/20' : 'bg-indigo-50',
        border: theme === 'dark' ? 'border-indigo-500' : 'border-indigo-400',
        text: theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700',
        hover: theme === 'dark' ? 'hover:bg-indigo-900/30' : 'hover:bg-indigo-100',
        icon: theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
      },
      cyan: {
        bg: theme === 'dark' ? 'bg-cyan-900/20' : 'bg-cyan-50',
        border: theme === 'dark' ? 'border-cyan-500' : 'border-cyan-400',
        text: theme === 'dark' ? 'text-cyan-300' : 'text-cyan-700',
        hover: theme === 'dark' ? 'hover:bg-cyan-900/30' : 'hover:bg-cyan-100',
        icon: theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
      },
      rose: {
        bg: theme === 'dark' ? 'bg-rose-900/20' : 'bg-rose-50',
        border: theme === 'dark' ? 'border-rose-500' : 'border-rose-400',
        text: theme === 'dark' ? 'text-rose-300' : 'text-rose-700',
        hover: theme === 'dark' ? 'hover:bg-rose-900/30' : 'hover:bg-rose-100',
        icon: theme === 'dark' ? 'text-rose-400' : 'text-rose-600'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  // Show loading state while checking device type and authentication
  if (!mounted || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show content if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Mobile view - show mobile landing page
  if (isMobile) {
    const MobileLandingPage = require('@/components/mobile/MobileLandingPage').default;
    return <MobileLandingPage />;
  }

  return (
    <div className={`min-h-screen ${styles.bodyBg}`}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className={`text-4xl font-bold mb-4 ${styles.textPrimary}`}>
            Welcome to ShiftCalc
          </h1>
          <p className={`text-xl ${styles.textSecondary}`}>
            Your comprehensive shift management toolkit
          </p>
        </motion.div>

        {/* Modules Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {modules.map((module) => {
            const colors = getColorClasses(module.color);
            
            return (
              <motion.div
                key={module.title}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={module.href}>
                  <div className={`
                    ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} 
                    rounded-lg shadow-md p-6 h-full cursor-pointer
                    border-2 ${colors.border} ${colors.hover}
                    transition-all duration-200
                  `}>
                    <div className="flex items-start space-x-4">
                      <div className={`
                        ${colors.bg} p-3 rounded-lg
                        ${colors.icon}
                      `}>
                        {module.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-2 ${styles.textPrimary}`}>
                          {module.title}
                        </h3>
                        <p className={`text-sm ${styles.textSecondary}`}>
                          {module.description}
                        </p>
                      </div>
                    </div>
                    
                    {!module.available && (
                      <div className={`
                        mt-4 text-xs px-2 py-1 rounded-full inline-block
                        ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                        Coming Soon
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Tips Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`
            mt-12 p-6 rounded-lg
            ${theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'}
            border-l-4 ${theme === 'dark' ? 'border-blue-500' : 'border-blue-400'}
          `}
        >
          <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
            Getting Started
          </h4>
          <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'} text-sm space-y-1`}>
            <li>Use the Shift Calculator to find schedules that match your lifestyle</li>
            <li>The Trade Finder helps you swap shift types while keeping your days off</li>
            <li>Download your schedule to any calendar app for easy reference</li>
            <li>Check Who's Working to see today's on-duty officers</li>
          </ul>
        </motion.div>
      </main>
    </div>
  );
}