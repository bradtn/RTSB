// src/app/admin/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

type User = {
  id: number;
  username: string;
  full_name: string;
  role: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ username: "", full_name: "", password: "", role: "user" });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // State for editing user's full name
  const [newFullName, setNewFullName] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);
  
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

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}. Details: ${errorJson.error || errorJson.message || "Unknown error"}`);
        } catch (e) {
          throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}. Response: ${errorText}`);
        }
      }

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Invalid response format: Could not parse JSON");
      }

      if (!data) {
        setUsers([]);
        throw new Error("No data received from API");
      }

      if (Array.isArray(data)) {
        setUsers(data);
        setFilteredUsers(data);
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        setUsers([]);
        setFilteredUsers([]);
        throw new Error("Invalid response format: users data is not an array");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        setNewUser({ username: "", full_name: "", password: "", role: "user" });
        setIsAddModalOpen(false);
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(`Failed to add user: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user. Check the console for details.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      // Use the new reset password endpoint
      const res = await fetch(`/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: editingUser.id,
          password: newPassword 
        }),
      });

      if (res.ok) {
        setNewPassword("");
        setEditingUser(null);
        setIsEditModalOpen(false);
        alert("Password updated successfully");
      } else {
        const errorData = await res.json();
        alert(`Failed to update password: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Error updating password. Check the console for details.");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        credentials: "same-origin"
      });

      if (res.ok) {
        setUserToDelete(null);
        setIsDeleteModalOpen(false);
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert(`Failed to delete user: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user. Check the console for details.");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Add User
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="search"
              className="block w-full p-2.5 pl-10 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white dark:placeholder-gray-400"
              placeholder="Search users by name, username, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSearchQuery("")}
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
          
          {/* Display number of results when searching */}
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6 rounded">
            <p>Error: {error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{user.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin" 
                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" 
                            : "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setNewPassword("");
                            setNewFullName(user.full_name);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                        >
                          Edit User
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Add User Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Add New User</h2>
              <form onSubmit={handleAddUser}>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Username</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Role</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded mr-2 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    onClick={() => setIsAddModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Edit User: {editingUser.username}</h2>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">Reset Password</h3>
                <form onSubmit={handleUpdatePassword} className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave empty for default (Password123)"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors"
                    >
                      Reset Password
                    </button>
                  </div>
                </form>
                
                <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">Edit Profile</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  
                  if (!newFullName.trim()) {
                    alert("Full name is required");
                    return;
                  }
                  
                  // Make sure ID is a number as expected by Prisma
                  const userId = typeof editingUser.id === 'string' ? parseInt(editingUser.id) : editingUser.id;
                  
                  fetch(`/api/admin/users/${userId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ full_name: newFullName.trim() }),
                  })
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      // Update the user in the local state
                      setUsers(prevUsers => 
                        prevUsers.map(user => 
                          user.id === editingUser.id 
                            ? { ...user, full_name: newFullName.trim() } 
                            : user
                        )
                      );
                      
                      setIsEditModalOpen(false);
                      alert("User updated successfully");
                    } else {
                      alert(`Failed to update user: ${data.error || "Unknown error"}`);
                    }
                  })
                  .catch(error => {
                    console.error("Error updating user:", error);
                    alert("Error updating user. Check the console for details.");
                  });
                }}>
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder={editingUser.full_name}
                      required
                    />
                  </div>
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                      onClick={() => {
                        setEditingUser(null);
                        setIsEditModalOpen(false);
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {isDeleteModalOpen && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h2>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Are you sure you want to delete the user <strong>{userToDelete.username}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded mr-2 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  onClick={() => {
                    setUserToDelete(null);
                    setIsDeleteModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  onClick={handleDeleteUser}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
