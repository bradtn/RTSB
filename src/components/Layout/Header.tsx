'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, LogOut, Home, Calendar, Shield, Settings } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ThemeToggle';
import LogoWithTheme from '../common/LogoWithTheme';

interface HeaderProps {
  locale: string;
  translations: {
    appTitle: string;
    navHome: string;
    navBidLines: string;
    navAdmin: string;
    navLogin: string;
    navLogout: string;
  };
}

export default function Header({ locale, translations }: HeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Function to get user initials from name
  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const navigation = [
    { name: translations.navHome, href: `/${locale}/bid-lines`, icon: Home },
  ];

  if (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'SUPERVISOR') {
    navigation.push({ name: translations.navAdmin, href: `/${locale}/admin`, icon: Shield });
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link href={`/${locale}/bid-lines`} className="flex flex-shrink-0 items-center">
              <LogoWithTheme className="h-10 w-auto object-contain" />
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 border-b-2 px-1 pt-1 text-sm font-medium ${
                      pathname === item.href
                        ? 'border-blue-500 text-gray-900 dark:text-gray-100'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <LanguageToggle currentLocale={locale} />
            <ThemeToggle />
            
            {/* Live connection indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">LIVE</span>
            </div>
            
            {session ? (
              <>
                <div className="relative ml-3">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="h-8 w-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors"
                    title={session.user.name || ''}
                  >
                    {getUserInitials(session.user.name || undefined)}
                  </button>
                  
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                          <p className="font-medium">{session.user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.email}</p>
                        </div>
                        <Link
                          href={`/${locale}/profile`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Settings className="h-4 w-4" />
                          Profile
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut();
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          {translations.navLogout}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {translations.navLogin}
              </Link>
            )}
          </div>
          
          {/* Mobile controls */}
          <div className="flex items-center gap-0.5 sm:hidden">
            <LanguageToggle currentLocale={locale} />
            <ThemeToggle />
            
            {session ? (
              <div className="relative ml-0.5">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-400 transition-colors sm:h-8 sm:w-8 sm:text-sm sm:font-medium"
                  title={session.user.name || ''}
                >
                  {getUserInitials(session.user.name || undefined)}
                </button>
                
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-medium">{session.user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.email}</p>
                      </div>
                      <Link
                        href={`/${locale}/profile`}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        {translations.navLogout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

    </header>
  );
}