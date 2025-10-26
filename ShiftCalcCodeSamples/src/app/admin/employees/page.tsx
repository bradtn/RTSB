"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { useTheme } from "@/contexts/ThemeContext";

export default function AdminEmployeesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-employees', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/upload-employees');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_assignment_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Assignments</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Back to Admin
          </button>
        </div>

        {/* Upload Section */}
        <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h2 className="text-xl font-semibold mb-4">Upload Employee Assignments</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Upload an Excel file with columns: Operation, Line, Name
              </p>
              <button
                onClick={downloadTemplate}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Download Template Excel File
              </button>
            </div>

            <div>
              <input
                id="fileInput"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className={`block w-full text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                } file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${
                  theme === 'dark' 
                    ? 'file:bg-blue-900 file:text-blue-200 hover:file:bg-blue-800' 
                    : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                }`}
              />
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="text-sm">{file.name}</span>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className={`px-4 py-2 rounded text-white font-medium ${
                    isUploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
                {error}
              </div>
            )}

            {uploadResult && (
              <div className="space-y-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                  {uploadResult.message}
                </div>
                
                {uploadResult.stats.details.length > 0 && (
                  <details className="cursor-pointer">
                    <summary className="font-medium">Upload Details</summary>
                    <div className="mt-2 max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Row</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Operation</th>
                            <th className="text-left p-2">Line</th>
                            <th className="text-left p-2">Employee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadResult.stats.details.map((detail: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{detail.row}</td>
                              <td className={`p-2 ${
                                detail.status === 'Updated' ? 'text-green-600' : 
                                detail.error ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {detail.status || detail.error}
                              </td>
                              <td className="p-2">{detail.operation || '-'}</td>
                              <td className="p-2">{detail.line || '-'}</td>
                              <td className="p-2">{detail.employee || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <h3 className="font-semibold mb-2">Excel File Format</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Your Excel file should have the following columns:
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Column Name</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-mono">Operation</td>
                <td className="p-2">The operation/group name</td>
                <td className="p-2">Yard, Shop, etc.</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-mono">Line</td>
                <td className="p-2">The line number</td>
                <td className="p-2">1, 2, 3, etc.</td>
              </tr>
              <tr className="border-b">
                <td className="p-2 font-mono">Name</td>
                <td className="p-2">Employee name</td>
                <td className="p-2">John Smith</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}