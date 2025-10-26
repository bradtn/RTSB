// src/components/layout/Navbar.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const styles = useThemeStyles();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const userInitial = session?.user?.name?.charAt(0) || 'A';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isMenuOpen]);

  return (
    <nav className={`${styles.cardBg} shadow-md border-b-0 transition-colors duration-200`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left area - Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Image 
                  src="/images/logo-dark.png"
                  alt="ShiftCalc Logo"
                  width={200}
                  height={50}
                  className="h-10 w-auto"
                  priority
                />
              ) : (
                <Image 
                  src="/images/logo.png"
                  alt="ShiftCalc Logo"
                  width={200}
                  height={50}
                  className="h-10 w-auto"
                  priority
                />
              )}
            </Link>
          </div>
          
          {/* Right area - Theme toggle and user avatar */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-gray-200'} transition-colors`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>

            {/* User avatar dropdown */}
            {session && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center focus:outline-none"
                  aria-label="User menu"
                  aria-expanded={isMenuOpen}
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {userInitial}
                  </div>
                  <svg 
                    className={`w-4 h-4 ml-2 ${styles.textMuted} transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {isMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 ${styles.cardBg} rounded-lg shadow-lg border ${styles.borderDefault} z-50`}>
                    <div className={`px-4 py-3 border-b ${styles.borderDefault}`}>
                      <div className={`font-medium ${styles.textPrimary} truncate`}>
                        {session.user?.name}
                      </div>
                      <div className={`text-sm ${styles.textMuted} truncate`}>
                        {session.user?.email}
                      </div>
                      <div className={`text-xs ${styles.textMuted} mt-1`}>
                        Role: {session.user?.role}
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <Link 
                        href="/profile" 
                        className={`block px-4 py-2 text-sm ${styles.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      
                      {session?.user?.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className={`block px-4 py-2 text-sm ${styles.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      
                      <Link 
                        href="/settings" 
                        className={`block px-4 py-2 text-sm ${styles.textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      
                      <div className={`border-t ${styles.borderDefault} my-1`}></div>
                      
                      <button 
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut();
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}