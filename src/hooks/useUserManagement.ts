import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'SUPERVISOR' | 'OFFICER';
  badgeNumber?: string;
  language: 'EN' | 'FR';
  emailVerified?: string;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  badgeNumber?: string;
  language: User['language'];
  generatePassword?: boolean;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: User['role'];
  badgeNumber?: string;
  language?: User['language'];
}

interface UseUserManagementOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useUserManagement(options: UseUserManagementOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  const { data: session, update: updateSession } = useSession();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new user
  const createUser = useCallback(async (userData: CreateUserData): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }
      
      toast.success('User created successfully!');
      await fetchUsers(); // Refresh the list
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(message);
      console.error('Error creating user:', err);
      return false;
    }
  }, [fetchUsers]);

  // Update an existing user
  const updateUser = useCallback(async (userId: string, userData: UpdateUserData): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }
      
      toast.success('User updated successfully!');
      
      // If the current user changed their own language, reload page to apply new language
      if (session?.user?.id === userId && userData.language && userData.language !== session.user.language) {
        toast.success('Language changed! Redirecting to apply new language...');
        
        // Update the session first
        await updateSession({
          ...session,
          user: {
            ...session.user,
            language: userData.language
          }
        });
        
        // Then reload the page to apply the new language
        setTimeout(() => {
          window.location.href = `/${userData.language!.toLowerCase()}${window.location.pathname.substring(3)}`;
        }, 1500);
      }
      
      await fetchUsers(); // Refresh the list
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      toast.error(message);
      console.error('Error updating user:', err);
      return false;
    }
  }, [fetchUsers, session, updateSession]);

  // Delete a user
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }
      
      toast.success('User deleted successfully!');
      await fetchUsers(); // Refresh the list
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(message);
      console.error('Error deleting user:', err);
      return false;
    }
  }, [fetchUsers]);

  // Reset user password
  const resetPassword = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }
      
      toast.success(`Password reset! New password: ${result.newPassword}`);
      await fetchUsers(); // Refresh the list
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      toast.error(message);
      console.error('Error resetting password:', err);
      return false;
    }
  }, [fetchUsers]);

  // Bulk operations
  const deleteMultipleUsers = useCallback(async (userIds: string[]): Promise<boolean> => {
    try {
      const results = await Promise.allSettled(
        userIds.map(id => deleteUser(id))
      );
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;
      
      if (failed === 0) {
        toast.success(`Successfully deleted ${successful} users`);
      } else {
        toast.error(`Deleted ${successful} users, ${failed} failed`);
      }
      
      return failed === 0;
    } catch (err) {
      toast.error('Failed to delete users');
      return false;
    }
  }, [deleteUser]);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchUsers, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchUsers]);

  // Statistics
  const statistics = {
    total: users.length,
    admins: users.filter(u => u.role === 'SUPER_ADMIN').length,
    supervisors: users.filter(u => u.role === 'SUPERVISOR').length,
    officers: users.filter(u => u.role === 'OFFICER').length,
    unverified: users.filter(u => !u.emailVerified).length,
    mustChangePassword: users.filter(u => u.mustChangePassword).length,
  };

  return {
    users,
    loading,
    error,
    statistics,
    
    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    deleteMultipleUsers,
  };
}