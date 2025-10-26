"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileHeader from "@/components/mobile/MobileHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

export default function MobileAddUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    full_name: "",
    password: "",
    role: "user",
    must_reset_password: false
  });
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
      setIsLoading(false);
    }
  }, [status, session, router]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newUser.username || !newUser.full_name || !newUser.password) {
      setMessage("All fields are required");
      setMessageType("error");
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      
      if (res.ok) {
        setMessage("User created successfully");
        setMessageType("success");
        
        // Reset form
        setNewUser({
          username: "",
          full_name: "",
          password: "",
          role: "user",
          must_reset_password: false
        });
        
        // Redirect to users list after a short delay
        setTimeout(() => {
          router.push("/admin/mobile/users");
        }, 1500);
      } else {
        const errorData = await res.json();
        throw new Error(`Failed to add user: ${errorData.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Error adding user:", e);
      setMessage(`Error adding user: ${e instanceof Error ? e.message : String(e)}`);
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
          <Link href="/admin/mobile/users" className="mr-3">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className={`text-2xl font-bold ${styles.textPrimary}`}>Add New User</h1>
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
        
        <form onSubmit={handleAddUser} className={`${styles.cardBg} rounded-lg p-4 shadow-md`}>
          <div className="mb-4">
            <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
              Username
            </label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              className={`w-full rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } p-2`}
              disabled={isSaving}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
              Full Name
            </label>
            <input
              type="text"
              value={newUser.full_name}
              onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
              className={`w-full rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } p-2`}
              disabled={isSaving}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
              Password
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              className={`w-full rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } p-2`}
              disabled={isSaving}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className={`block text-sm font-medium ${styles.textSecondary} mb-1`}>
              Role
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className={`w-full rounded-md border ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              } p-2`}
              disabled={isSaving}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newUser.must_reset_password}
                onChange={(e) => setNewUser({...newUser, must_reset_password: e.target.checked})}
                className={`mr-2 h-4 w-4 rounded border ${
                  theme === 'dark' 
                    ? 'border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500' 
                    : 'border-gray-300 bg-white text-blue-600 focus:ring-blue-500'
                }`}
                disabled={isSaving}
              />
              <span className={`text-sm ${styles.textSecondary}`}>
                User must reset password on first login
              </span>
            </label>
            <p className={`mt-1 text-xs ${styles.textMuted}`}>
              When enabled, the user will be prompted to set a new password when they first log in
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full rounded-md py-2 px-4 font-medium text-white ${
              isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : "Add User"}
          </button>
        </form>
      </main>
    </div>
  );
}