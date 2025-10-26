'use client';

import React, { useState } from 'react';
import { DataTable, TableColumn, TableAction } from '@/components/shared/DataTable';
import { useUserManagement, User } from '@/hooks/useUserManagement';
import { usePagination } from '@/hooks/usePagination';
import { useSearchAndFilter, createOfficerSearchFunction } from '@/hooks/useSearchAndFilter';
import { Plus, Edit, Trash2, RefreshCw, Key, Download, Upload, X } from 'lucide-react';

interface UserManagementProps {
  variant?: 'full' | 'simple' | 'enhanced';
  allowCreate?: boolean;
  allowDelete?: boolean;
  allowEdit?: boolean;
  allowPasswordReset?: boolean;
  showStatistics?: boolean;
  showBulkActions?: boolean;
  locale?: string;
}

export default function UserManagement({
  variant = 'enhanced',
  allowCreate = true,
  allowDelete = true,
  allowEdit = true,
  allowPasswordReset = true,
  showStatistics = true,
  showBulkActions = true,
  locale = 'en',
}: UserManagementProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'OFFICER',
    badgeNumber: '',
    language: 'EN',
  });

  // User management hook
  const {
    users,
    loading,
    error,
    statistics,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    deleteMultipleUsers,
  } = useUserManagement({ autoRefresh: true });

  // Search functionality
  const searchFunction = (user: User, searchTerm: string) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchTerm) ||
           user.email.toLowerCase().includes(searchTerm) ||
           (user.badgeNumber && user.badgeNumber.toLowerCase().includes(searchTerm)) ||
           user.role.toLowerCase().includes(searchTerm);
  };

  const { searchTerm, setSearchTerm, filteredItems } = useSearchAndFilter(
    users,
    searchFunction
  );

  // Pagination
  const pagination = usePagination(filteredItems, 10, [searchTerm]);

  // Table columns configuration based on variant
  const getColumns = (): TableColumn<User>[] => {
    const baseColumns: TableColumn<User>[] = [
      {
        key: 'firstName',
        header: 'Name',
        render: (_, user) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (role) => (
          <span className={`px-2 py-1 text-xs rounded-full ${
            role === 'SUPER_ADMIN' 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : role === 'SUPERVISOR'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {role.replace('_', ' ')}
          </span>
        ),
      },
    ];

    if (variant === 'enhanced' || variant === 'full') {
      baseColumns.push(
        {
          key: 'badgeNumber',
          header: 'Badge',
          render: (badge) => (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {badge || 'N/A'}
            </span>
          ),
        },
        {
          key: 'language',
          header: 'Language',
          render: (lang) => (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {lang === 'FR' ? '⚜️ FR' : '🍁 EN'}
            </span>
          ),
        }
      );
    }

    if (variant === 'full') {
      baseColumns.push(
        {
          key: 'emailVerified',
          header: 'Status',
          render: (verified, user) => (
            <div className="space-y-1">
              {verified ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Unverified
                </span>
              )}
              {user.mustChangePassword && (
                <span className="block px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  Must Change Password
                </span>
              )}
            </div>
          ),
        },
        {
          key: 'createdAt',
          header: 'Created',
          render: (date) => new Date(date).toLocaleDateString(),
        }
      );
    }

    return baseColumns;
  };

  // Table actions based on permissions
  const getActions = (): TableAction<User>[] => {
    const actions: TableAction<User>[] = [];

    if (allowEdit) {
      actions.push({
        label: 'Edit',
        onClick: (user) => handleEdit(user),
        icon: <Edit className="w-3 h-3" />,
        variant: 'secondary',
      });
    }

    if (allowPasswordReset) {
      actions.push({
        label: 'Reset Password',
        onClick: (user) => {
          if (confirm(`Reset password for ${user.firstName} ${user.lastName}?`)) {
            resetPassword(user.id);
          }
        },
        icon: <Key className="w-3 h-3" />,
        variant: 'primary',
      });
    }

    if (allowDelete) {
      actions.push({
        label: 'Delete',
        onClick: (user) => {
          if (confirm(`Delete user ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
            deleteUser(user.id);
          }
        },
        icon: <Trash2 className="w-3 h-3" />,
        variant: 'danger',
        disabled: (user) => user.role === 'SUPER_ADMIN', // Prevent deleting super admin
      });
    }

    return actions;
  };

  // Form handling
  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'OFFICER',
      badgeNumber: '',
      language: 'EN',
    });
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    setIsSubmitting(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        closeModal();
        fetchUsers();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to save user'}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      role: user.role,
      badgeNumber: user.badgeNumber || '',
      language: user.language,
    });
    setIsCreateModalOpen(true);
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    const userNames = selectedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ');
    if (confirm(`Delete ${selectedUsers.length} users (${userNames})? This action cannot be undone.`)) {
      const userIds = selectedUsers.map(u => u.id);
      const success = await deleteMultipleUsers(userIds);
      if (success) {
        setSelectedUsers([]);
      }
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">Error Loading Users</h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {showStatistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statistics.total}</div>
            <div className="text-sm text-gray-700 dark:text-gray-400">Total Users</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.admins}</div>
            <div className="text-sm text-gray-700 dark:text-gray-400">Admins</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{statistics.supervisors}</div>
            <div className="text-sm text-gray-700 dark:text-gray-400">Supervisors</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.officers}</div>
            <div className="text-sm text-gray-700 dark:text-gray-400">Officers</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statistics.unverified}</div>
            <div className="text-sm text-gray-700 dark:text-gray-400">Unverified</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name, email, badge, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {allowCreate && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            )}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && selectedUsers.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 dark:text-blue-300">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                {allowDelete && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Selected
                  </button>
                )}
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-700 dark:text-gray-300">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800"></div>
            <span className="text-gray-700 dark:text-gray-400">Must change password</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        data={pagination.paginatedItems}
        columns={getColumns()}
        actions={getActions()}
        loading={loading}
        emptyMessage="No users found"
        selectable={showBulkActions}
        selectedItems={selectedUsers}
        onSelectionChange={setSelectedUsers}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalItems,
          startIndex: pagination.startIndex,
          endIndex: pagination.endIndex,
          onPageChange: pagination.setCurrentPage,
          onNext: pagination.goToNextPage,
          onPrevious: pagination.goToPreviousPage,
          pageNumbers: pagination.pageNumbers,
          itemsPerPage: 10,
        }}
        highlightCondition={(user) => user.mustChangePassword}
      />

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingUser) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Badge Number
                  </label>
                  <input
                    type="text"
                    value={formData.badgeNumber}
                    onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="OFFICER">Officer</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language *
                  </label>
                  <select
                    required
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EN">English</option>
                    <option value="FR">French</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (editingUser ? 'Save' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}