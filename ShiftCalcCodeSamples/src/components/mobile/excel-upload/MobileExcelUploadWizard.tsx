'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileIcon, UploadIcon, CalendarIcon, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MobileScheduleDisplay from '@/components/mobile/shared/MobileScheduleDisplay';
import MobileHeader from '../MobileHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles';

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

export default function MobileExcelUploadWizard() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemeStyles();
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

  const getWorkDaysCount = () => {
    if (!excelData) return 0;
    return excelData.shifts.filter(shift => 
      shift.shiftCode !== 'OFF' && 
      shift.shiftCode !== '*' && 
      shift.shiftCode !== ''
    ).length;
  };

  const getDaysOffCount = () => {
    if (!excelData) return 0;
    return excelData.shifts.filter(shift => 
      shift.shiftCode === 'OFF' || 
      shift.shiftCode === '*' || 
      shift.shiftCode === ''
    ).length;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Upload Schedule Excel File</CardTitle>
              <CardDescription>
                Upload your schedule extract from the main system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This feature is for officers with schedule accommodations. 
                  Upload the Excel file extracted from the main scheduling system.
                </AlertDescription>
              </Alert>

              <div className={`border-2 border-dashed ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} rounded-lg p-6 text-center`}>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <UploadIcon className={`h-12 w-12 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                  <span className={`text-sm ${styles.textSecondary}`}>
                    Click to upload or drag and drop
                  </span>
                  <span className={`text-xs ${styles.textMuted}`}>
                    Excel files only (.xlsx, .xls)
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className={`flex items-center space-x-2 p-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
                  <FileIcon className={`h-5 w-5 ${styles.textSecondary}`} />
                  <span className={`text-sm ${styles.textPrimary} flex-1`}>{selectedFile.name}</span>
                  <span className={`text-xs ${styles.textMuted}`}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className={`text-sm ${styles.textSecondary} text-center`}>Processing file...</p>
                </div>
              )}

              <Button 
                onClick={processExcelFile}
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Process File'}
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className={`text-xl font-bold ${styles.textPrimary}`}>Schedule Preview</h2>
              <p className={`text-sm ${styles.textSecondary} mt-1`}>
                Review your schedule before generating the iCal file
              </p>
            </div>

            {excelData && (
              <div className="space-y-4">
                <MobileScheduleDisplay 
                  scheduleData={excelData}
                  showDownloadButton={true}
                  onDownload={generateICalFile}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="pb-20"> {/* Space for fixed button */}
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(1)}
                    className="w-full"
                  >
                    Back to Upload
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Success!</CardTitle>
              <CardDescription>
                Your iCal file has been generated and downloaded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className={`mx-auto w-16 h-16 ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'} rounded-full flex items-center justify-center mb-4`}>
                  <CalendarIcon className={`h-8 w-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <p className={styles.textSecondary}>
                  Your schedule has been successfully converted to an iCal file.
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  The iCal file contains all your work shifts from the uploaded Excel file. 
                  You can import this file into any calendar application.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedFile(null);
                    setExcelData(null);
                  }}
                  className="flex-1"
                >
                  Upload Another File
                </Button>
                <Button 
                  onClick={() => router.push('/')}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'}`}>
      <MobileHeader />
      <div className={`p-4 ${theme === 'dark' ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h1 className={`text-2xl font-bold ${styles.textPrimary}`}>Excel Schedule Upload</h1>
            <p className={`text-sm ${styles.textSecondary} mt-1`}>
              Convert your schedule extract to iCal format
            </p>
          </div>

        <div className="mb-6">
          <div className="flex items-center">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`flex-1 h-2 ${
                    step <= currentStep ? 'bg-blue-600' : (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')
                  } ${step === 1 ? 'rounded-l' : ''} ${
                    step === 3 ? 'rounded-r' : ''
                  }`}
                />
                {step < 3 && <div className="w-1" />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-xs ${styles.textSecondary}`}>Upload</span>
            <span className={`text-xs ${styles.textSecondary}`}>Preview</span>
            <span className={`text-xs ${styles.textSecondary}`}>Download</span>
          </div>
        </div>

          {renderStep()}
        </div>
      </div>
    </div>
  );
}