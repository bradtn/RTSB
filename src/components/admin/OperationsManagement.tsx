'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building, Plus, Edit2, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface OperationsManagementProps {
  locale: string;
}

export default function OperationsManagement({ locale }: OperationsManagementProps) {
  const queryClient = useQueryClient();
  const [showAddOperation, setShowAddOperation] = useState(false);
  const [editingOperation, setEditingOperation] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    nameFr: '',
    description: '',
    isActive: true,
  });

  // Fetch operations
  const { data: operations, isLoading } = useQuery({
    queryKey: ['operations'],
    queryFn: async () => {
      const res = await fetch('/api/operations');
      if (!res.ok) throw new Error('Failed to fetch operations');
      return res.json();
    },
  });

  // Create operation mutation
  const createOperationMutation = useMutation({
    mutationFn: async (operationData: any) => {
      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operationData),
      });
      if (!res.ok) throw new Error('Failed to create operation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Operation created successfully');
      setShowAddOperation(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create operation');
    },
  });

  // Update operation mutation
  const updateOperationMutation = useMutation({
    mutationFn: async ({ id, ...operationData }: any) => {
      const res = await fetch(`/api/operations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operationData),
      });
      if (!res.ok) throw new Error('Failed to update operation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Operation updated successfully');
      setEditingOperation(null);
      setShowAddOperation(false);
    },
    onError: () => {
      toast.error('Failed to update operation');
    },
  });

  // Delete operation mutation
  const deleteOperationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/operations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete operation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Operation deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete operation');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nameEn: '',
      nameFr: '',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOperation) {
      await updateOperationMutation.mutateAsync({ id: editingOperation.id, ...formData });
    } else {
      await createOperationMutation.mutateAsync(formData);
    }
  };

  const handleEdit = (operation: any) => {
    setEditingOperation(operation);
    setFormData({
      name: operation.name,
      nameEn: operation.nameEn,
      nameFr: operation.nameFr,
      description: operation.description || '',
      isActive: operation.isActive,
    });
    setShowAddOperation(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this operation? This will affect all related bid lines and schedules.')) {
      await deleteOperationMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Operations Management</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage operational divisions and departments
          </p>
        </div>
        <button
          onClick={() => {
            setEditingOperation(null);
            resetForm();
            setShowAddOperation(!showAddOperation);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Add Operation
        </button>
      </div>

      {/* Add/Edit Operation Form */}
      {showAddOperation && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl border border-blue-200 dark:border-gray-700 p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Building className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {editingOperation ? 'Edit Operation' : 'Add New Operation'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Operation Code *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., GHB, COMM"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                English Name *
              </label>
              <input
                type="text"
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="e.g., General Hospital, Communications"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                French Name *
              </label>
              <input
                type="text"
                required
                value={formData.nameFr}
                onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                placeholder="e.g., Hôpital Général, Communications"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Status
              </label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="active" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">Active</option>
                <option value="inactive" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">Inactive</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Optional description of this operation..."
              />
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowAddOperation(false);
                  setEditingOperation(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createOperationMutation.isPending || updateOperationMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createOperationMutation.isPending || updateOperationMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingOperation ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingOperation ? 'Update Operation' : 'Create Operation'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Operations Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operations?.map((operation: any) => (
            <div
              key={operation.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center shadow-lg">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {operation.name}
                    </h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      operation.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {operation.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(operation)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit operation"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(operation.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete operation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">English:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">{operation.nameEn}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">French:</span>
                  <span className="ml-2 text-gray-900 dark:text-gray-100">{operation.nameFr}</span>
                </div>
                {operation.description && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{operation.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>{operation._count?.users || 0} users</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {operation._count?.bidLines || 0} bid lines
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}