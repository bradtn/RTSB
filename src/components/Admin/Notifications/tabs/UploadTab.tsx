'use client';

import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { notificationService } from '@/services/NotificationService';

interface UploadTabProps {
  locale: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  processed?: number;
  errors?: string[];
}

export function UploadTab({ locale }: UploadTabProps) {
  const { t } = useTranslation(locale);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (file: File | null) => {
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setUploadResults(null);
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

  // Upload file
  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadResults(null);

    const result = await notificationService.uploadSeniorityList(selectedFile);
    setUploadResults(result);

    if (result.success) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    setIsUploading(false);
  };

  // Clear file selection
  const clearFile = () => {
    setSelectedFile(null);
    setUploadResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = `Badge Number,Personal Email,Work Email,Personal Phone,Preferred Contact,Notification Language
12345,john.doe@personal.com,john.doe@work.com,555-1234,email,EN
67890,jane.smith@personal.com,jane.smith@work.com,555-9876,sms,FR
11111,bob.jones@personal.com,bob.jones@work.com,555-1111,both,English
22222,alice.williams@personal.com,alice.williams@work.com,555-3333,email,French`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seniority_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Upload Seniority List
        </h3>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Template
        </button>
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
                  onClick={uploadFile}
                  disabled={isUploading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
                <button
                  onClick={clearFile}
                  disabled={isUploading}
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

      {/* Upload Results */}
      {uploadResults && (
        <div className={`p-4 rounded-lg mb-4 ${
          uploadResults.success
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <div className={`font-medium mb-2 ${
            uploadResults.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
          }`}>
            {uploadResults.success ? '✅ Upload Successful' : '❌ Upload Failed'}
          </div>
          <p className={`text-sm ${
            uploadResults.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {uploadResults.message}
          </p>

          {uploadResults.errors && uploadResults.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Errors:</p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                {uploadResults.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CSV Format Help */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <p className="mb-2 font-medium">CSV Format Requirements:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Badge Number</strong> (required) - Must match existing user accounts</li>
          <li><strong>Personal Email</strong> - Officer's personal email address</li>
          <li><strong>Work Email</strong> - Officer's work email address</li>
          <li><strong>Personal Phone</strong> - Officer's personal phone number</li>
          <li><strong>Preferred Contact</strong> - Choose: email, sms, or both</li>
          <li><strong>Notification Language</strong> - Choose: EN/English or FR/French (defaults to EN)</li>
        </ul>
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
          <strong>Note:</strong> Officers are ranked by their order in the CSV file (first row = rank 1).
          The upload will replace the entire seniority list. Notification language preferences will update each user's account.
        </div>
      </div>
    </div>
  );
}