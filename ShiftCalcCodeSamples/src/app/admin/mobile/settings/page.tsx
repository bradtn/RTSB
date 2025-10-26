"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileHeader from "@/components/mobile/MobileHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { DEFAULT_SETTINGS, updateSettings } from "@/lib/settings";

export default function MobileAdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [startDate, setStartDate] = useState<string>(DEFAULT_SETTINGS.startDate);
  const [numCycles, setNumCycles] = useState<number>(DEFAULT_SETTINGS.numCycles);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated") {
      if (session?.user?.role !== "admin") {
        router.push("/");
        return;
      }
      
      // Load settings
      fetch('/api/admin/settings')
        .then(res => res.json())
        .then(data => {
          if (data.startDate) setStartDate(data.startDate);
          if (data.numCycles) setNumCycles(parseInt(String(data.numCycles), 10));
          setIsLoading(false);
        })
        .catch(e => {
          console.error("Failed to load settings", e);
          setMessage("Error loading settings");
          setMessageType("error");
          setIsLoading(false);
        });
    }
  }, [status, session, router]);

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      await updateSettings({
        startDate,
        numCycles
      });
      
      setMessage("Settings saved successfully");
      setMessageType("success");
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.push("/admin/mobile");
      }, 1500);
    } catch (e) {
      setMessage("Error saving settings");
      setMessageType("error");
      console.error("Error saving settings", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className={`flex min-h-screen flex-col ${styles.bodyBg}`}>
        <MobileHeader isLoading={true} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!session || session?.user?.role !== "admin") {
    return null;
  }

  return (
    <div className={`flex min-h-screen flex-col ${styles.bodyBg}`}>
      <MobileHeader />
      <main className="flex-1 p-4">
        <div className="mb-4 flex items-center">
          <Link href="/admin/mobile" className="mr-3">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className={`text-2xl font-bold ${styles.textPrimary}`}>System Settings</h1>
        </div>
        
        {message && (
          <div className={`mb-4 rounded-md p-3 ${
            messageType === "success" 
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" 
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
          }`}>
            {message}
          </div>
        )}
        
        <div className={`rounded-lg ${styles.cardBg} p-4 shadow-md`}>
          <h2 className={`mb-4 text-lg font-semibold ${styles.textPrimary}`}>Schedule Configuration</h2>
          
          <div className="mb-4">
            <label className={`mb-1 block text-sm font-medium ${styles.textSecondary}`}>
              Schedule Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full rounded-md border p-2 ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
              disabled={isSaving}
            />
          </div>
          
          <div className="mb-6">
            <label className={`mb-1 block text-sm font-medium ${styles.textSecondary}`}>
              Number of Cycles
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={numCycles}
              onChange={(e) => setNumCycles(parseInt(e.target.value))}
              className={`w-full rounded-md border p-2 ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
              disabled={isSaving}
            />
            <p className={`mt-1 text-xs ${styles.textMuted}`}>
              Each cycle is 56 days. This affects weekend and block calculations.
            </p>
          </div>
          
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className={`w-full rounded-md bg-blue-600 py-2 px-4 font-medium text-white ${
              isSaving ? 'opacity-70' : 'hover:bg-blue-700'
            }`}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </main>
    </div>
  );
}