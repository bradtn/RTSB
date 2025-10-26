'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const newLocale = currentLocale === 'en' ? 'fr' : 'en';
    startTransition(() => {
      const newPath = pathname.replace(/^\/[a-z]{2}/, `/${newLocale}`);
      router.push(newPath);
      router.refresh();
    });
  };

  return (
    <>
      {/* Mobile Design - Simple Icon Button */}
      <button
        onClick={toggleLanguage}
        className={`
          sm:hidden relative inline-flex items-center justify-center w-8 h-8
          rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 
          focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800
          ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
          ${currentLocale === 'en' 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-red-600 hover:bg-red-700'
          }
          shadow-sm
        `}
        disabled={isPending}
        title={`Switch to ${currentLocale === 'en' ? 'Français' : 'English'}`}
      >
        {/* Mobile: Show current language with icon */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-white">
            {currentLocale === 'en' ? '🍁' : '⚜️'}
          </span>
          <span className="text-xs font-bold text-white leading-none">
            {currentLocale.toUpperCase()}
          </span>
        </div>
      </button>

      {/* Desktop Design - Clean Toggle */}
      <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
        <button
          onClick={currentLocale === 'fr' ? toggleLanguage : undefined}
          className={`
            flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
            ${currentLocale === 'en' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }
            ${isPending ? 'opacity-50 cursor-not-allowed' : currentLocale === 'fr' ? 'cursor-pointer' : 'cursor-default'}
          `}
          disabled={isPending}
          title={currentLocale === 'en' ? 'Currently English' : 'Switch to English'}
        >
          <span>🍁</span>
          <span>EN</span>
        </button>
        
        <button
          onClick={currentLocale === 'en' ? toggleLanguage : undefined}
          className={`
            flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
            ${currentLocale === 'fr' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }
            ${isPending ? 'opacity-50 cursor-not-allowed' : currentLocale === 'en' ? 'cursor-pointer' : 'cursor-default'}
          `}
          disabled={isPending}
          title={currentLocale === 'fr' ? 'Currently French' : 'Switch to French'}
        >
          <span>⚜️</span>
          <span>FR</span>
        </button>
      </div>
    </>
  );
}