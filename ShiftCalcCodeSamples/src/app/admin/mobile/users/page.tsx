"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileHeader from "@/components/mobile/MobileHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";

type User = {
  id: number | string;
  username: string;
  full_name: string;
  role: string;
};

export default function MobileAdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  
  // Password reset state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string, username: string} | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  // Edit user state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newFullName, setNewFullName] = useState("");
  
  // Delete user state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
      
      // Fetch users
      fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => {
          setUsers(data);
          setFilteredUsers(data);
          setIsLoading(false);
        })
        .catch(e => {
          console.error("Failed to load users", e);
          setMessage("Error loading users");
          setMessageType("error");
          setIsLoading(false);
        });
    }
  }, [status, session, router]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(query) || 
      user.full_name.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const openResetModal = (userId: string, username: string) => {
    setCurrentUser({ id: userId, username });
    setNewPassword("");
    setIsResetModalOpen(true);
  };
  
  const resetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      console.log(`Resetting password for user ID: ${currentUser.id}`);
      
      const password = newPassword.trim() || "Password123"; // Use default if empty
      
      // Using a simplified API approach
      const res = await fetch(`/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: currentUser.id,
          password: password 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log("Password reset successful:", data);
        setMessage(`Password reset for ${currentUser.username}`);
        setMessageType("success");
        setIsResetModalOpen(false);
      } else {
        console.error("Server returned error:", data);
        throw new Error(`Failed to reset password: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Error resetting password:", e);
      setMessage(`Error resetting password: ${e instanceof Error ? e.message : String(e)}`);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditModal = (user: User) => {
    // Convert id to number to match Prisma schema
    const userWithNumberId = {
      ...user,
      id: parseInt(user.id)
    };
    setEditingUser(userWithNumberId);
    setNewFullName(user.full_name);
    setIsEditModalOpen(true);
  };
  
  const updateUserFullName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser || !newFullName.trim()) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      console.log(`Updating full name for user ID: ${editingUser.id}`);
      
      // Convert ID to number if it's a string
      const userId = typeof editingUser.id === 'string' ? parseInt(editingUser.id) : editingUser.id;
      
      console.log(`Sending PATCH request to /api/admin/users/${userId} with full_name: ${newFullName.trim()}`);
      
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          full_name: newFullName.trim()
          // Important: Do not send role or other fields
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log("User updated successfully:", data);
        
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === editingUser.id 
              ? { ...user, full_name: newFullName.trim() } 
              : user
          )
        );
        
        setMessage(`User ${editingUser.username} updated successfully`);
        setMessageType("success");
        setIsEditModalOpen(false);
      } else {
        console.error("Server returned error:", data);
        throw new Error(`Failed to update user: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Error updating user:", e);
      setMessage(`Error updating user: ${e instanceof Error ? e.message : String(e)}`);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteUser = async () => {
    if (!userToDelete) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      console.log(`Deleting user ID: ${userToDelete.id}`);
      
      // Convert ID to number if it's a string
      const userId = typeof userToDelete.id === 'string' ? parseInt(userToDelete.id) : userToDelete.id;
      
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log("User deleted successfully:", data);
        
        // Remove the user from the local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
        
        setMessage(`User ${userToDelete.username} deleted successfully`);
        setMessageType("success");
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } else {
        console.error("Server returned error:", data);
        throw new Error(`Failed to delete user: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Error deleting user:", e);
      setMessage(`Error deleting user: ${e instanceof Error ? e.message : String(e)}`);
      setMessageType("error");
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
          <h1 className={`text-2xl font-bold ${styles.textPrimary}`}>User Management</h1>
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
        
        <div className="mb-4">
          <Link 
            href="/admin/mobile/users/add"
            className="block w-full rounded-md bg-blue-600 py-2 px-4 text-center font-medium text-white hover:bg-blue-700"
          >
            Add New User
          </Link>
        </div>
        
        {/* Search input */}
        <div className={`${styles.cardBg} rounded-lg shadow-md mb-4`}>
          <div className="p-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="search"
                className={`block w-full p-2 pl-10 text-sm border rounded-md ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setSearchQuery("")}
                >
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className={`mt-2 text-xs ${styles.textMuted}`}>
                Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        
        <div className={`${styles.cardBg} rounded-lg shadow-md`}>
          <div className="p-4">
            <h2 className={`mb-3 text-lg font-semibold ${styles.textPrimary}`}>
              Users ({filteredUsers.length})
            </h2>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className={`p-4 text-center ${styles.textMuted}`}>
                {users.length === 0 ? "No users found" : "No users match your search"}
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <li key={user.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-medium ${styles.textPrimary}`}>{user.full_name}</h3>
                        <p className={`text-sm ${styles.textMuted}`}>{user.username}</p>
                        <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {user.role}
                        </p>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => openResetModal(user.id, user.username)}
                          className="rounded-md bg-amber-600 py-1 px-2 text-xs font-medium text-white hover:bg-amber-700"
                          disabled={isLoading}
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="rounded-md bg-blue-600 py-1 px-2 text-xs font-medium text-white hover:bg-blue-700"
                          disabled={isLoading}
                        >
                          Edit User
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                          }}
                          className="rounded-md bg-red-600 py-1 px-2 text-xs font-medium text-white hover:bg-red-700"
                          disabled={isLoading || user.username === session?.user?.email}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Password Reset Modal */}
        {isResetModalOpen && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`w-full max-w-sm rounded-lg ${styles.cardBg} p-4 shadow-xl`}>
              <h2 className={`mb-4 text-lg font-semibold ${styles.textPrimary}`}>
                Reset Password for {currentUser.username}
              </h2>
              
              <form onSubmit={resetUserPassword}>
                <div className="mb-4">
                  <label className={`mb-1 block text-sm font-medium ${styles.textSecondary}`}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave empty for default (Password123)"
                    className={`w-full rounded-md border p-2 ${
                      theme === 'dark' 
                        ? 'border-gray-700 bg-gray-800 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className={`rounded-md border ${styles.borderColor} px-4 py-2 ${styles.textPrimary}`}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Edit User Modal */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`w-full max-w-sm rounded-lg ${styles.cardBg} p-4 shadow-xl`}>
              <h2 className={`mb-4 text-lg font-semibold ${styles.textPrimary}`}>
                Edit User: {editingUser.username}
              </h2>
              
              <form onSubmit={updateUserFullName}>
                <div className="mb-4">
                  <label className={`mb-1 block text-sm font-medium ${styles.textSecondary}`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className={`w-full rounded-md border p-2 ${
                      theme === 'dark' 
                        ? 'border-gray-700 bg-gray-800 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className={`rounded-md border ${styles.borderColor} px-4 py-2 ${styles.textPrimary}`}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    disabled={isLoading || !newFullName.trim()}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Delete User Modal */}
        {isDeleteModalOpen && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className={`w-full max-w-sm rounded-lg ${styles.cardBg} p-4 shadow-xl`}>
              <h2 className={`mb-4 text-lg font-semibold ${styles.textPrimary}`}>
                Delete User
              </h2>
              
              <p className={`mb-4 ${styles.textSecondary}`}>
                Are you sure you want to delete user <strong>{userToDelete.username}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className={`rounded-md border ${styles.borderColor} px-4 py-2 ${styles.textPrimary}`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteUser}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}