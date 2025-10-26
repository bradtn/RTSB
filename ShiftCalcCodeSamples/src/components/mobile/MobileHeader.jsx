// src/components/mobile/MobileHeader.jsx
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { createPortal } from 'react-dom';

// Dropdown component that will be rendered in a portal
const UserMenuDropdown = ({ isOpen, onClose, position, theme, styles, session }) => {
  if (!isOpen) return null;
  
  // Only run on the client side
  if (typeof document === 'undefined') return null;
  
  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 9998
        }}
      />
      
      {/* Dropdown menu */}
      <div 
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: '12rem', // w-48
          backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
          borderRadius: '0.375rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          border: '1px solid',
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
        }}
      >
        {session ? (
          <>
            <div style={{
              padding: '0.5rem 1rem',
              borderBottom: '1px solid',
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
              fontSize: '0.875rem',
              color: theme === 'dark' ? '#d1d5db' : '#4b5563'
            }}>
              <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.user?.email}
              </div>
            </div>
            {session?.user?.role === 'admin' && (
              <a 
                href="/admin/mobile" 
                style={{
                  display: 'block',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Admin Panel
              </a>
            )}
            <button 
              onClick={() => signOut()}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: theme === 'dark' ? '#f87171' : '#dc2626',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                border: 'none'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <a 
              href="/login" 
              style={{
                display: 'block',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: theme === 'dark' ? '#d1d5db' : '#4b5563',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Sign in
            </a>
          </>
        )}
      </div>
    </>,
    document.body // Render directly into body, guaranteed to be on top
  );
};

export default function MobileHeader({ isSyncing = false, isLoading = false }) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const styles = useThemeStyles();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  
  const userInitial = session?.user?.name?.charAt(0) || 'A';
  
  // Toggle menu and set position
  const toggleMenu = () => {
    if (!isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 10, // 10px below the button
        left: window.innerWidth - 200, // 200px from right edge
      });
    }
    
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isMenuOpen]);
  
  return (
    <header className={`${styles.cardBg} shadow-md border-b-0 transition-colors duration-200 relative z-10`}>
      <div className="flex items-center justify-between px-3 py-2.5">
        {/* Left area - Logo with app name */}
        <a href="/" className="flex items-center gap-2 cursor-pointer">
          {/* Updated to use theme-specific logo */}
          {theme === 'dark' ? (
            <img 
              src="/images/logo-dark.png"
              alt="ShiftCalc Logo - Dark Mode" 
              className="h-9 w-auto"
            />
          ) : (
            <img 
              src="/images/logo.png"
              alt="ShiftCalc Logo - Light Mode" 
              className="h-9 w-auto"
            />
          )}
          <span className="text-xl font-semibold hidden sm:inline-block">
            <span className="text-blue-400">Shift</span>
            <span className="text-slate-800 dark:text-white">Calc</span>
          </span>
        </a>
        
        {/* Right area - Combined elements */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Theme toggle */}
          <div className="relative">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'light' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-gray-200'}`}
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
          </div>
          
          {/* Sync indicator */}
          <div className="flex items-center bg-opacity-75 px-2 py-1 rounded-full sm:bg-opacity-100 sm:px-3">
            <div className={`w-2 h-2 ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'} rounded-full mr-1.5`}></div>
            <span className={`text-xs ${isSyncing ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') : (theme === 'dark' ? 'text-green-400' : 'text-green-600')} hidden xs:inline-block`}>
              {isSyncing ? 'Syncing' : 'Synced'}
            </span>
          </div>
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          
          {/* User avatar dropdown */}
          <div className="relative">
            <button 
              ref={buttonRef}
              onClick={toggleMenu}
              className="flex items-center focus:outline-none"
              aria-label="User menu"
              aria-expanded={isMenuOpen}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                {userInitial}
              </div>
              <svg 
                className={`w-4 h-4 ml-1 ${styles.textMuted} transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''} hidden xs:block`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Portal-based dropdown that renders outside the DOM hierarchy */}
            <UserMenuDropdown 
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              position={dropdownPosition}
              theme={theme}
              styles={styles}
              session={session}
            />
          </div>
        </div>
      </div>
    </header>
  );
}