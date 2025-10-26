"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

export default function ResetPasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.mustResetPassword) {
      router.push("/");
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Sign out and redirect to login
        await signOut({ redirect: false });
        // Add a small delay to ensure signOut completes
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || !session?.user?.mustResetPassword) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${styles.bodyBg}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen items-center justify-center p-4 ${styles.bodyBg}`}>
      <div className={`w-full max-w-md ${styles.cardBg} rounded-lg p-8 shadow-lg`}>
        <h1 className={`mb-6 text-center text-2xl font-bold ${styles.textPrimary}`}>
          Reset Your Password
        </h1>
        
        <p className={`mb-6 text-center text-sm ${styles.textSecondary}`}>
          You must set a new password before continuing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-md border ${
                  theme === 'dark' 
                    ? 'border-gray-700 bg-gray-800 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                } p-2 pr-10`}
                required
                minLength={6}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-2 top-2 ${styles.textSecondary}`}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } p-2`}
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full rounded-md py-2 px-4 font-medium text-white ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? "Resetting..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}