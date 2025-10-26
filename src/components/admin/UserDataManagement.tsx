'use client';

import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, Users, AlertCircle } from 'lucide-react';

interface ImportResult {
  success: boolean;
  message: string;
  processed?: number;
  created?: number;
  updated?: number;
  errors?: string[];
  details?: {
    created: string[];
    updated: string[];
  };
}

export function UserDataManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (file: File | null) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setImportResults(null);
    } else if (file) {
      console.error('Please select a CSV file');
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Export users
  const exportUsers = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/users/export');
      
      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'users_export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Import users
  const importUsers = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('updateExisting', updateExisting.toString());

      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResults(result);

      if (result.success) {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({
        success: false,
        message: 'Import failed due to network error',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Clear file selection
  const clearFile = () => {
    setSelectedFile(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = `First Name,Last Name,Email,Badge Number,Phone Number,Role,Language,Notification Language
John,Doe,john.doe@email.com,12345,555-1234,OFFICER,EN,EN
Jane,Smith,jane.smith@email.com,67890,555-5678,SUPERVISOR,FR,FR
Bob,Jones,bob.jones@email.com,11111,555-9999,OFFICER,English,French`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            User Data Management
          </h2>
        </div>
        
        {/* Export Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
            Export Users
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download all user data as a CSV file for backup or external processing.
          </p>
          <button
            onClick={exportUsers}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export All Users'}
          </button>
        </div>

        <hr className="border-gray-200 dark:border-gray-700 my-6" />

        {/* Import Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Import Users
            </h3>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Download Template
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload a CSV file to create or update user accounts in bulk.
          </p>

          {/* Update Existing Toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Update existing users (instead of creating duplicates)
              </span>
            </label>
          </div>

          {/* File Upload Area */}
          <div className="mb-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className={`h-12 w-12 mx-auto mb-3 ${dragActive ? 'text-blue-400' : 'text-gray-400'}`} />

              {selectedFile ? (
                <div className="text-center">
                  <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">
                    Selected: {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Size: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={importUsers}
                      disabled={isImporting}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isImporting ? 'Importing...' : 'Import Users'}
                    </button>
                    <button
                      onClick={clearFile}
                      disabled={isImporting}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileInputChange}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Choose File
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Import Results */}
          {importResults && (
            <div className={`p-4 rounded-lg mb-4 ${
              importResults.success
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className={`font-medium mb-2 ${
                importResults.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
              }`}>
                {importResults.success ? '✅ Import Successful' : '❌ Import Failed'}
              </div>
              <p className={`text-sm ${
                importResults.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {importResults.message}
              </p>

              {importResults.success && (
                <div className="mt-3 text-sm text-green-700 dark:text-green-300">
                  <p>📊 Summary:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Total processed: {importResults.processed || 0}</li>
                    <li>New users created: {importResults.created || 0}</li>
                    <li>Existing users updated: {importResults.updated || 0}</li>
                  </ul>
                </div>
              )}

              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Errors:</p>
                  <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto">
                    {importResults.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {importResults.details && (
                <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                  {importResults.details.created.length > 0 && (
                    <div className="mb-2">
                      <p className="font-medium">Created:</p>
                      <ul className="list-disc list-inside ml-2">
                        {importResults.details.created.map((user, index) => (
                          <li key={index}>{user}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {importResults.details.updated.length > 0 && (
                    <div>
                      <p className="font-medium">Updated:</p>
                      <ul className="list-disc list-inside ml-2">
                        {importResults.details.updated.map((user, index) => (
                          <li key={index}>{user}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CSV Format Help */}
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="font-medium">CSV Format Requirements:</p>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-6">
              <li><strong>First Name</strong> (required) - User's first name</li>
              <li><strong>Last Name</strong> (required) - User's last name</li>
              <li><strong>Email</strong> (required) - Must be unique, valid email format</li>
              <li><strong>Badge Number</strong> - Officer badge number (unique if provided)</li>
              <li><strong>Phone Number</strong> - Contact phone number</li>
              <li><strong>Role</strong> - OFFICER, SUPERVISOR, or SUPER_ADMIN (defaults to OFFICER)</li>
              <li><strong>Language</strong> - EN/FR or English/French (defaults to EN)</li>
              <li><strong>Notification Language</strong> - EN/FR or English/French (defaults to EN)</li>
            </ul>
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
              <strong>Note:</strong> New users will be created with password "TempPass123!" and must change it on first login.
              Existing users can be updated if "Update existing users" is checked.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}