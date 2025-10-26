"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import Image from "next/image";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const styles = useThemeStyles();

  // Check for success message from password reset
  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMessage("Password reset successfully. Please log in with your new password.");
    }
  }, [searchParams]);

  // Animation sequence on load
  useEffect(() => {
    // First animate in the logo
    const logoTimer = setTimeout(() => {
      setLogoLoaded(true);
    }, 300);
    
    // Then animate in the content
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 700);
    
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(contentTimer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password");
        setIsLoading(false);
      } else {
        // Add a subtle animation before redirecting
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
          loginContainer.classList.add('fade-out');
        }
        setTimeout(() => {
          // Get the callback URL from the query params, default to '/'
          const params = new URLSearchParams(window.location.search);
          const callbackUrl = params.get('callbackUrl') || '/';
          router.push(callbackUrl);
          router.refresh();
        }, 400);
      }
    } catch (error) {
      setError("An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center mobile-full-height ${styles.pageBg} relative overflow-hidden safe-area-inset-bottom`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-96 ${theme === 'dark' ? 'bg-indigo-900/10' : 'bg-indigo-500/5'} rounded-full filter blur-3xl transform -translate-y-1/2 scale-150`}></div>
        <div className={`absolute bottom-0 right-0 w-full h-96 ${theme === 'dark' ? 'bg-purple-deep/30' : 'bg-blue-500/5'} rounded-full filter blur-3xl transform translate-y-1/3 scale-150`}></div>
      </div>
      
      {/* Main container with animation */}
      <div 
        className={`login-container w-full max-w-md space-y-6 rounded-lg ${styles.cardBg} shadow-xl mx-4 relative z-10
                    backdrop-blur-sm backdrop-filter 
                    ${theme === 'dark' ? 'bg-opacity-80' : 'bg-opacity-90'}
                    transition-all duration-500 transform
                    ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        {/* Floating logo effect */}
        <div className="flex justify-center pt-8 pb-4 relative">
          <div className={`relative w-64 h-28 transform transition-all duration-700 
                         ${logoLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
            {/* Animated logo with pulse glow effect */}
            <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-200'} rounded-full filter blur-xl opacity-20 
                            animate-pulse-slow`}>
            </div>
            
            {/* Logo - corrected path and removed text */}
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
        
        {/* Content with fade-in effect - title removed */}
        <div className={`px-8 pb-8 transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          {successMessage && (
            <div className={`mb-4 rounded-md ${theme === 'dark' ? 'bg-green-900/50 text-green-100' : 'bg-green-100 text-green-800'} 
                          border ${theme === 'dark' ? 'border-green-800' : 'border-green-300'} p-3`}>
              <p className="text-sm flex items-center">
                <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </p>
            </div>
          )}
          {error && (
            <div className={`mb-4 rounded-md ${theme === 'dark' ? 'bg-red-900/50 text-red-100' : 'bg-red-100 text-red-800'} 
                          border ${theme === 'dark' ? 'border-red-800' : 'border-red-300'} p-3`}
                          style={{animation: error ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none'}}>
              <p className="text-sm flex items-center">
                <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="group">
                <label htmlFor="username" className={`block text-sm font-medium ${styles.textSecondary} mb-1.5 transition-colors`}>Username</label>
                <div className="relative">
                  <div className={`absolute left-3 inset-y-0 flex items-center pointer-events-none ${styles.textMuted}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className={`pl-10 relative block w-full rounded-md border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-indigo-600 focus:ring-indigo-600' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500'
                    } p-2.5 text-sm transition-all focus:outline-none focus:ring-2 group-hover:border-indigo-400`}
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="group">
                <label htmlFor="password" className={`block text-sm font-medium ${styles.textSecondary} mb-1.5 transition-colors`}>Password</label>
                <div className="relative">
                  <div className={`absolute left-3 inset-y-0 flex items-center pointer-events-none ${styles.textMuted}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className={`pl-10 relative block w-full rounded-md border ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-indigo-600 focus:ring-indigo-600' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500'
                    } p-2.5 text-sm transition-all focus:outline-none focus:ring-2 group-hover:border-indigo-400`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative flex w-full justify-center rounded-md 
                          ${theme === 'dark' 
                            ? 'bg-gradient-to-r from-indigo-800 to-purple-deep text-white hover:from-indigo-700 hover:to-indigo-900' 
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700'
                          } 
                          px-4 py-3 text-sm font-medium transition-all duration-150
                          shadow-md hover:shadow-lg
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                          transform hover:-translate-y-0.5
                          ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg 
                    className={`h-5 w-5 ${theme === 'dark' ? 'text-indigo-300 group-hover:text-indigo-200' : 'text-indigo-200 group-hover:text-indigo-100'} transition-colors`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </span>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <span className="ml-3">Sign in</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}