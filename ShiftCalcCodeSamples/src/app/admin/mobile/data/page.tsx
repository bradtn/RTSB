"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileHeader from "@/components/mobile/MobileHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

export default function MobileAdminDataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    schedules: 0,
    shiftCodes: 0,
    users: 0
  });
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [shiftCodeFile, setShiftCodeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchStats = async () => {
    setIsRefreshing(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/admin/data-stats');
      
      if (!res.ok) {
        throw new Error("Failed to fetch data statistics");
      }
      
      const data = await res.json();
      setStats(data);
      setLastRefreshed(new Date().toLocaleTimeString());
      setMessage("Statistics refreshed successfully");
      setMessageType("success");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        if (message?.includes("refreshed")) {
          setMessage(null);
        }
      }, 3000);
    } catch (e) {
      console.error("Failed to load data stats", e);
      setMessage("Error loading data statistics");
      setMessageType("error");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

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
      
      // Fetch data stats
      fetchStats();
    }
  }, [status, session, router]);

  const clearSchedules = async () => {
    if (!confirm("Are you sure you want to clear all schedules? This action cannot be undone.")) {
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/admin/clear-schedules', {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setMessage("All schedules cleared successfully");
        setMessageType("success");
        // Update stats
        setStats(prev => ({...prev, schedules: 0}));
      } else {
        throw new Error("Failed to clear schedules");
      }
    } catch (e) {
      setMessage("Error clearing schedules");
      setMessageType("error");
      console.error("Error clearing schedules", e);
    } finally {
      setIsLoading(false);
    }
  };

  const clearShiftCodes = async () => {
    if (!confirm("Are you sure you want to clear all shift codes? This action cannot be undone.")) {
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/admin/clear-shift-codes', {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setMessage("All shift codes cleared successfully");
        setMessageType("success");
        // Update stats
        setStats(prev => ({...prev, shiftCodes: 0}));
      } else {
        throw new Error("Failed to clear shift codes");
      }
    } catch (e) {
      setMessage("Error clearing shift codes");
      setMessageType("error");
      console.error("Error clearing shift codes", e);
    } finally {
      setIsLoading(false);
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
          <h1 className={`text-2xl font-bold ${styles.textPrimary}`}>Data Management</h1>
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
        
        <div className={`mb-4 ${styles.cardBg} rounded-lg p-4 shadow-md`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-lg font-semibold ${styles.textPrimary}`}>Database Stats</h2>
            <button
              onClick={fetchStats}
              disabled={isRefreshing}
              className={`rounded-md ${isRefreshing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} px-3 py-1 text-sm font-medium text-white transition-colors`}
            >
              {isRefreshing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing
                </span>
              ) : (
                "Refresh"
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-1">
            <StatCard title="Users" value={stats.users} />
            <StatCard title="Schedules" value={stats.schedules} />
            <StatCard title="Shift Codes" value={stats.shiftCodes} />
          </div>
          
          {lastRefreshed && (
            <p className={`text-xs ${styles.textMuted} text-right`}>
              Last updated: {lastRefreshed}
            </p>
          )}
        </div>
        
        <div className={`mb-4 ${styles.cardBg} rounded-lg p-4 shadow-md`}>
          <h2 className={`mb-3 text-lg font-semibold ${styles.textPrimary}`}>Import Data</h2>
          <p className={`mb-3 text-sm ${styles.textMuted}`}>
            Upload shift codes or schedules from Excel files.
          </p>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
              Schedules Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setScheduleFile(e.target.files?.[0] || null)}
              className={`w-full rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } p-2`}
              disabled={isUploading}
            />
            {scheduleFile && (
              <p className={`mt-1 text-xs ${styles.textSecondary}`}>
                Selected: {scheduleFile.name}
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
              Shift Codes Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setShiftCodeFile(e.target.files?.[0] || null)}
              className={`w-full rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } p-2`}
              disabled={isUploading}
            />
            {shiftCodeFile && (
              <p className={`mt-1 text-xs ${styles.textSecondary}`}>
                Selected: {shiftCodeFile.name}
              </p>
            )}
          </div>
          
          <button
            onClick={async () => {
              if (!scheduleFile && !shiftCodeFile) {
                setMessage("Please select at least one file to upload");
                setMessageType("error");
                return;
              }
              
              setIsUploading(true);
              setMessage(null);
              
              const formData = new FormData();
              if (scheduleFile) formData.append("scheduleFile", scheduleFile);
              if (shiftCodeFile) formData.append("shiftCodeFile", shiftCodeFile);
              
              try {
                const res = await fetch("/api/admin/upload", {
                  method: "POST",
                  body: formData
                });
                
                if (res.ok) {
                  const data = await res.json();
                  setMessage("Files uploaded successfully!");
                  setMessageType("success");
                  setScheduleFile(null);
                  setShiftCodeFile(null);
                  // Refresh stats
                  fetchStats();
                } else {
                  throw new Error("Upload failed");
                }
              } catch (error) {
                console.error("Error uploading files:", error);
                setMessage("Error uploading files");
                setMessageType("error");
              } finally {
                setIsUploading(false);
              }
            }}
            disabled={isUploading || (!scheduleFile && !shiftCodeFile)}
            className={`w-full rounded-md py-2 px-4 font-medium text-white ${
              isUploading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : (!scheduleFile && !shiftCodeFile)
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload Files"
            )}
          </button>
        </div>
        
        <div className={`mb-4 ${styles.cardBg} rounded-lg p-4 shadow-md`}>
          <h2 className={`mb-3 text-lg font-semibold ${styles.textPrimary}`}>Export Data</h2>
          <p className={`mb-3 text-sm ${styles.textMuted}`}>
            Export shift codes or schedules to CSV files.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.location.href = '/api/admin/export-shift-codes'}
              className="rounded-md bg-green-600 py-2 px-4 font-medium text-white hover:bg-green-700"
              disabled={stats.shiftCodes === 0}
            >
              Export Shift Codes
            </button>
            <button
              onClick={() => window.location.href = '/api/admin/export-schedules'}
              className="rounded-md bg-green-600 py-2 px-4 font-medium text-white hover:bg-green-700"
              disabled={stats.schedules === 0}
            >
              Export Schedules
            </button>
          </div>
        </div>
        
        <div className={`${styles.cardBg} rounded-lg p-4 shadow-md`}>
          <h2 className={`mb-3 text-lg font-semibold text-red-600 dark:text-red-400`}>Danger Zone</h2>
          <p className={`mb-3 text-sm ${styles.textMuted}`}>
            These actions cannot be undone. Please be certain.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={clearShiftCodes}
              className="rounded-md border border-red-600 bg-transparent py-2 px-4 font-medium text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/20"
              disabled={stats.shiftCodes === 0 || isLoading}
            >
              Clear Shift Codes
            </button>
            <button
              onClick={clearSchedules}
              className="rounded-md border border-red-600 bg-transparent py-2 px-4 font-medium text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/20"
              disabled={stats.schedules === 0 || isLoading}
            >
              Clear Schedules
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  const styles = useThemeStyles();
  
  return (
    <div className={`flex flex-col items-center justify-center rounded-md border ${styles.borderColor} p-2 text-center`}>
      <p className={`text-xs font-medium ${styles.textMuted}`}>{title}</p>
      <p className={`text-xl font-bold ${styles.textPrimary}`}>{value}</p>
    </div>
  );
}