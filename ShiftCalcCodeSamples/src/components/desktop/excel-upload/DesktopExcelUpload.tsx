// src/components/desktop/excel-upload/DesktopExcelUpload.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemeStyles } from "@/hooks/useThemeStyles";
import { motion } from "framer-motion";
import { FileIcon, UploadIcon, CalendarIcon, AlertCircle, CheckCircle } from "lucide-react";
import MobileScheduleDisplay from "@/components/mobile/shared/MobileScheduleDisplay";

interface DesktopExcelUploadProps {
  onModeChange: (mode: any) => void;
  currentMode: any;
}

interface ExcelData {
  name: string;
  period: string;
  shifts: Array<{
    date: string;
    dayOfWeek: string;
    shiftCode: string;
    shiftTime: string;
    workCenter: string;
  }>;
}

// Define the wizard steps
const STEPS = [
  { id: 1, label: "Upload", icon: "📤", description: "Upload your Excel schedule file" },
  { id: 2, label: "Preview", icon: "👁️", description: "Review your schedule data" },
  { id: 3, label: "Download", icon: "📅", description: "Generate your iCal file" }
];

export default function DesktopExcelUpload({ onModeChange, currentMode }: DesktopExcelUploadProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel' ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setSelectedFile(null);
      }
    }
  }, []);

  const processExcelFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/excel-upload/parse', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process Excel file');
      }

      const data = await response.json();
      setExcelData(data);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the file');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const generateICalFile = async () => {
    if (!excelData) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/excel-upload/generate-ical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(excelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate iCal file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule_${excelData.name.replace(/\s+/g, '_')}.ics`;
      a.click();
      window.URL.revokeObjectURL(url);

      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the iCal file');
    } finally {
      setIsProcessing(false);
    }
  };


  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setExcelData(null);
    setError(null);
    setUploadProgress(0);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-lg ${styles.cardBg} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-center mb-6">
                <UploadIcon className={`mx-auto h-16 w-16 ${styles.textSecondary} mb-4`} />
                <h3 className={`text-2xl font-bold ${styles.textPrimary} mb-2`}>Upload Your Schedule</h3>
                <p className={`${styles.textSecondary}`}>
                  Upload your Excel schedule exported from ESS (Employee Self Service)
                </p>
              </div>

              <div className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
                selectedFile 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls"
                  className="hidden"
                  id="desktop-file-upload"
                />
                <label
                  htmlFor="desktop-file-upload"
                  className="cursor-pointer block"
                >
                  {selectedFile ? (
                    <div className="space-y-3">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                      <div>
                        <p className={`font-medium ${styles.textPrimary}`}>{selectedFile.name}</p>
                        <p className={`text-sm ${styles.textSecondary}`}>
                          {(selectedFile.size / 1024).toFixed(1)} KB • Ready to process
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <UploadIcon className={`mx-auto h-12 w-12 ${styles.textSecondary}`} />
                      <div>
                        <p className={`font-medium ${styles.textPrimary}`}>
                          Click to upload or drag and drop
                        </p>
                        <p className={`text-sm ${styles.textSecondary}`}>
                          Excel files only (.xlsx, .xls)
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {error && (
                <div className={`mt-4 p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-red-900/20 border border-red-600' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className={`text-sm ${theme === 'dark' ? 'text-red-200' : 'text-red-800'}`}>
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="mt-4 space-y-2">
                  <div className={`w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className={`text-sm ${styles.textSecondary} text-center`}>Processing file...</p>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <button
                  onClick={processExcelFile}
                  disabled={!selectedFile || isProcessing}
                  className={`px-8 py-3 rounded-lg font-medium transition-all ${
                    !selectedFile || isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Process File'}
                </button>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <button
                onClick={() => setCurrentStep(1)}
                className={`mb-4 text-lg ${styles.textAccent} hover:underline`}
              >
                ← Change File
              </button>
              <h3 className={`text-3xl font-bold ${styles.textPrimary} mb-2`}>Schedule Preview</h3>
              <p className={`text-lg ${styles.textSecondary}`}>
                Review your schedule for {excelData?.name} ({excelData?.period})
              </p>
            </div>

            {excelData && (
              <div className="space-y-6">
                {/* Use the same MobileScheduleDisplay component for consistency, with desktop styling */}
                <div className="desktop-excel-layout">
                  <MobileScheduleDisplay
                    scheduleData={excelData}
                    showDownloadButton={false}
                  />
                </div>

                {error && (
                  <div className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-red-900/20 border border-red-600' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className={`text-sm ${theme === 'dark' ? 'text-red-200' : 'text-red-800'}`}>
                        {error}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className={`px-6 py-3 rounded-lg font-medium border transition-all ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Back to Upload
                  </button>
                  <button
                    onClick={generateICalFile}
                    disabled={isProcessing}
                    className={`px-8 py-3 rounded-lg font-medium transition-all ${
                      isProcessing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                    }`}
                  >
                    {isProcessing ? 'Generating...' : 'Generate iCal File'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-lg ${styles.cardBg} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-center">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                  theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <CheckCircle className={`h-10 w-10 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h3 className={`text-2xl font-bold ${styles.textPrimary} mb-2`}>Success!</h3>
                <p className={`${styles.textSecondary} mb-6`}>
                  Your iCal file has been generated and downloaded successfully.
                </p>
                
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-blue-900/20 border border-blue-600' : 'bg-blue-50 border border-blue-200'
                } mb-6`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                    The iCal file contains all your work shifts from the uploaded Excel file. 
                    You can now import this file into any calendar application on your phone or computer.
                  </p>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={resetWizard}
                    className={`px-6 py-3 rounded-lg font-medium border transition-all ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Upload Another File
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all transform hover:scale-105"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${styles.bodyBg}`}>
      <style jsx>{`
        .desktop-excel-layout .space-y-4 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        .desktop-excel-layout .space-y-4 > * {
          margin: 0 !important;
        }
      `}</style>
      {/* Header */}
      <div className={`${styles.cardBg} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-10`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${styles.textPrimary}`}>Excel Schedule Upload</h1>
              <p className={`${styles.textSecondary} mt-1`}>
                Convert your ESS schedule export to iCal format
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className={`px-4 py-2 rounded-lg font-medium border transition-all ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Back to Home
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step.id <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  <span className="text-sm font-medium">{step.id}</span>
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    step.id <= currentStep ? styles.textPrimary : styles.textSecondary
                  }`}>
                    {step.label}
                  </div>
                  <div className={`text-xs ${styles.textMuted}`}>
                    {step.description}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`ml-8 w-16 h-px ${
                    step.id < currentStep ? 'bg-blue-600' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {renderStepContent()}
      </div>
    </div>
  );
}