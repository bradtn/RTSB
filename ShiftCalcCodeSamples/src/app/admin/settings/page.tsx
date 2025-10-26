"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { DEFAULT_SETTINGS, updateSettings } from "@/lib/settings";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<string>(DEFAULT_SETTINGS.startDate);
  const [numCycles, setNumCycles] = useState<number>(DEFAULT_SETTINGS.numCycles);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load settings from database
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        console.log("Settings loaded from DB:", data);
        if (data.startDate) setStartDate(data.startDate);
        if (data.numCycles) setNumCycles(parseInt(String(data.numCycles), 10));
        setIsLoading(false);
      })
      .catch(e => {
        console.error("Failed to load settings", e);
        setMessage("Error loading settings from database");
        setIsLoading(false);
      });
  }, []);

  const saveSettings = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Save to database
      await updateSettings({
        startDate,
        numCycles
      });
      
      setMessage("Settings saved successfully to database");
      
      // Navigate back to admin dashboard after a short delay
      setTimeout(() => {
        router.push("/admin");
      }, 1500);
    } catch (e) {
      setMessage("Error saving settings to database");
      console.error("Error saving settings", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">System Settings</h1>
        
        {message && (
          <div className={`${message.includes("Error") ? "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-600" : "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-600"} border-l-4 p-4 mb-6`}>
            {message}
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Schedule Configuration</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Schedule Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Cycles
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={numCycles}
              onChange={(e) => setNumCycles(parseInt(e.target.value))}
              className="block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Each cycle is 56 days. This setting affects weekend and block calculations.
            </p>
          </div>
          
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            type="button"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}