"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function DataManagement() {
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCalculatingHolidays, setIsCalculatingHolidays] = useState(false);
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [shiftCodeFile, setShiftCodeFile] = useState<File | null>(null);
  const [stats, setStats] = useState({ schedules: 0, shiftCodes: 0 });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/data-stats", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setStats(data);
      setLastRefreshed(new Date().toLocaleTimeString());
      setMessage({ type: "success", text: "Statistics refreshed successfully" });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        if (message.type === "success") {
          setMessage({ type: "", text: "" });
        }
      }, 3000);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to refresh statistics" 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculateHolidays = async () => {
    setIsCalculatingHolidays(true);
    setMessage({ type: "", text: "" });
    
    try {
      const res = await fetch("/api/admin/calculate-holidays", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned non-JSON response. This might be a proxy error.");
      }
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ 
          type: "success", 
          text: data.message || "Holiday calculation completed successfully" 
        });
      } else {
        setMessage({ 
          type: "error", 
          text: data.error || "Failed to calculate holidays" 
        });
      }
    } catch (error) {
      console.error("Error calculating holidays:", error);
      setMessage({ 
        type: "error", 
        text: "Error calculating holidays. Please check the console for details." 
      });
    } finally {
      setIsCalculatingHolidays(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleFile && !shiftCodeFile) {
      setMessage({ type: "error", text: "Please select at least one file to upload" });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });
    setUploadResult(null);

    const formData = new FormData();
    if (scheduleFile) formData.append("scheduleFile", scheduleFile);
    if (shiftCodeFile) formData.append("shiftCodeFile", shiftCodeFile);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData
      });

      const data = await res.json();
      
      if (res.ok) {
        // Save the detailed results
        setUploadResult(data.results);
        
        // Create a detailed success message
        let successMsg = data.message || "Files uploaded successfully";
        
        // Add summary if there are results
        if (data.results) {
          const scheduleStats = data.results.schedules || { processed: 0, inserted: 0, skipped: 0, errors: 0 };
          const shiftCodeStats = data.results.shiftCodes || { processed: 0, inserted: 0, skipped: 0, errors: 0 };
          
          // Add to message if there were any inserts or skips
          if (scheduleStats.inserted > 0 || shiftCodeStats.inserted > 0 || 
              scheduleStats.skipped > 0 || shiftCodeStats.skipped > 0) {
            successMsg += "\n\nSummary:";
            
            if (scheduleStats.processed > 0) {
              successMsg += `\nSchedules: ${scheduleStats.inserted} added, ${scheduleStats.skipped} skipped (duplicates)`;
              if (scheduleStats.errors > 0) {
                successMsg += `, ${scheduleStats.errors} errors`;
              }
            }
            
            if (shiftCodeStats.processed > 0) {
              successMsg += `\nShift Codes: ${shiftCodeStats.inserted} added, ${shiftCodeStats.skipped} skipped (duplicates)`;
              if (shiftCodeStats.errors > 0) {
                successMsg += `, ${shiftCodeStats.errors} errors`;
              }
            }
          }
        }
        
        setMessage({ type: "success", text: successMsg });
        setScheduleFile(null);
        setShiftCodeFile(null);
        
        // Refresh stats to show new counts
        fetchStats();
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Error uploading files" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Data Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Database Summary</h2>
            <p className="mb-1 text-gray-700 dark:text-gray-300">
              Schedules: <span className="font-semibold">{stats.schedules}</span> records
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Shift Codes: <span className="font-semibold">{stats.shiftCodes}</span> records
            </p>
            {lastRefreshed && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Last refreshed: {lastRefreshed}
              </p>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Quick Actions</h2>
            <div className="space-y-2">
              <button 
                className={`w-full py-2 px-4 rounded text-white transition-colors flex items-center justify-center ${
                  isRefreshing 
                    ? "bg-blue-500 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={fetchStats}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  "Refresh Stats"
                )}
              </button>
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
                onClick={() => window.location.href = "/api/admin/export-schedules"}
              >
                Export Schedules
              </button>
              <button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors"
                onClick={() => window.location.href = "/api/admin/export-shift-codes"}
              >
                Export Shift Codes
              </button>
            </div>
          </div>
        </div>
        
        {message.text && (
          <div className={`mb-6 p-4 rounded-md whitespace-pre-line ${
            message.type === "error" 
              ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-l-4 border-red-500" 
              : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-l-4 border-green-500"
          }`}>
            {message.text}
          </div>
        )}
        
        {uploadResult && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 rounded-md">
            <h3 className="font-bold mb-2">Upload Results:</h3>
            
            {uploadResult.schedules && uploadResult.schedules.processed > 0 && (
              <div className="mb-2">
                <h4 className="font-semibold">Schedules:</h4>
                <ul className="list-disc list-inside">
                  <li>Processed: {uploadResult.schedules.processed}</li>
                  <li>Added: {uploadResult.schedules.inserted}</li>
                  <li>Skipped (duplicates): {uploadResult.schedules.skipped}</li>
                  {uploadResult.schedules.errors > 0 && (
                    <li className="text-red-600 dark:text-red-400">Errors: {uploadResult.schedules.errors}</li>
                  )}
                </ul>
              </div>
            )}
            
            {uploadResult.shiftCodes && uploadResult.shiftCodes.processed > 0 && (
              <div>
                <h4 className="font-semibold">Shift Codes:</h4>
                <ul className="list-disc list-inside">
                  <li>Processed: {uploadResult.shiftCodes.processed}</li>
                  <li>Added: {uploadResult.shiftCodes.inserted}</li>
                  <li>Skipped (duplicates): {uploadResult.shiftCodes.skipped}</li>
                  {uploadResult.shiftCodes.errors > 0 && (
                    <li className="text-red-600 dark:text-red-400">Errors: {uploadResult.shiftCodes.errors}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Upload Data</h2>
          
          <form onSubmit={handleUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedules Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setScheduleFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              />
              {scheduleFile && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  Selected: {scheduleFile.name}
                </p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Shift Codes Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setShiftCodeFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              />
              {shiftCodeFile && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  Selected: {shiftCodeFile.name}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isUploading || (!scheduleFile && !shiftCodeFile)}
              className={`w-full py-2 px-4 rounded text-white transition-colors flex items-center justify-center ${
                isUploading 
                  ? "bg-blue-500 cursor-not-allowed" 
                  : (!scheduleFile && !shiftCodeFile)
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                "Upload Files"
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Data Maintenance</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Calculate Holidays</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Calculate holiday counts for all schedules based on shift patterns
              </p>
              <button 
                className={`py-2 px-4 rounded text-white transition-colors flex items-center ${
                  isCalculatingHolidays 
                    ? "bg-purple-500 cursor-not-allowed" 
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
                onClick={calculateHolidays}
                disabled={isCalculatingHolidays}
              >
                {isCalculatingHolidays ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating...
                  </>
                ) : (
                  "Calculate Holidays"
                )}
              </button>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Backup Database</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Create a full backup of the current database
              </p>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                onClick={() => window.location.href = "/api/admin/backup"}
              >
                Generate Backup
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-2 text-red-600 dark:text-red-400">Danger Zone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                These actions cannot be undone. Be careful!
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all schedules? This cannot be undone!")) {
                      fetch("/api/admin/clear-schedules", { 
                        method: "DELETE",
                        credentials: "same-origin"
                      })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            setMessage({ type: "success", text: "Schedules cleared successfully" });
                            fetchStats();
                          } else {
                            setMessage({ type: "error", text: data.error || "Failed to clear schedules" });
                          }
                        })
                        .catch(error => {
                          console.error("Error clearing schedules:", error);
                          setMessage({ type: "error", text: "Error clearing schedules" });
                        });
                    }
                  }}
                >
                  Clear Schedules
                </button>
                <button 
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all shift codes? This cannot be undone!")) {
                      fetch("/api/admin/clear-shift-codes", { 
                        method: "DELETE",
                        credentials: "same-origin"
                      })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            setMessage({ type: "success", text: "Shift codes cleared successfully" });
                            fetchStats();
                          } else {
                            setMessage({ type: "error", text: data.error || "Failed to clear shift codes" });
                          }
                        })
                        .catch(error => {
                          console.error("Error clearing shift codes:", error);
                          setMessage({ type: "error", text: "Error clearing shift codes" });
                        });
                    }
                  }}
                >
                  Clear Shift Codes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
