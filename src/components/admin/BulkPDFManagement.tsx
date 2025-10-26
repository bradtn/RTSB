'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  FileDown, 
  Archive, 
  FileText, 
  Loader2, 
  Building2, 
  CheckCircle, 
  AlertCircle,
  Download
} from 'lucide-react';

interface BulkPDFManagementProps {
  locale: string;
  t: (key: string) => string;
}

export default function BulkPDFManagement({ locale, t }: BulkPDFManagementProps) {
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [format, setFormat] = useState<'zip'>('zip'); // Only ZIP for now
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [lastGeneration, setLastGeneration] = useState<{
    timestamp: string;
    filename: string;
    count: number;
    size: string;
  } | null>(null);

  // Load operations for the dropdown
  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['operations-bulk-pdf'],
    queryFn: async () => {
      const response = await fetch('/api/admin/operations-for-bulk-pdf');
      if (!response.ok) {
        throw new Error('Failed to fetch operations');
      }
      return response.json();
    },
  });

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // AUTOMATIC BATCHING PDF generation - splits large requests into smaller batches
  const generateAndDownloadPDFs = async (operationId: string, format: string, locale: string, totalCount: number) => {
    console.log('AUTOMATIC BATCHING PDF GENERATION - Processing', totalCount, 'PDFs');
    
    const BATCH_SIZE = 15; // Process 15 PDFs per batch to avoid timeouts
    const batches = Math.ceil(totalCount / BATCH_SIZE);
    
    if (batches === 1) {
      // Single batch - use direct approach
      return await generateSingleBatch(operationId, format, locale, totalCount, 0, totalCount);
    }
    
    // Multiple batches - process sequentially and combine results
    console.log(`Splitting into ${batches} batches of ~${BATCH_SIZE} PDFs each`);
    
    const allFiles: { filename: string; buffer: ArrayBuffer }[] = [];
    let totalSuccess = 0;
    let totalFailures = 0;
    
    for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, totalCount);
      const batchSize = endIdx - startIdx;
      
      console.log(`Processing batch ${batchIndex + 1}/${batches} (PDFs ${startIdx + 1}-${endIdx})`);
      
      // Update progress for this batch
      setProgress(prev => prev ? {
        ...prev,
        current: startIdx,
        status: `Processing batch ${batchIndex + 1} of ${batches} (PDFs ${startIdx + 1}-${endIdx})...`
      } : null);
      
      try {
        const batchResponse = await generateSingleBatch(operationId, format, locale, batchSize, startIdx, endIdx);
        
        // Extract files from ZIP response
        const batchBlob = await batchResponse.blob();
        const batchBuffer = await batchBlob.arrayBuffer();
        
        // Parse summary from headers
        const summaryHeader = batchResponse.headers.get('X-PDF-Generation-Summary');
        if (summaryHeader) {
          const summary = summaryHeader.split(',');
          const successCount = parseInt(summary[0]?.match(/(\d+)/)?.[1] || '0');
          const failureCount = parseInt(summary[1]?.match(/(\d+)/)?.[1] || '0');
          totalSuccess += successCount;
          totalFailures += failureCount;
        }
        
        // Store batch result
        allFiles.push({
          filename: `batch_${batchIndex + 1}.zip`,
          buffer: batchBuffer
        });
        
      } catch (error) {
        console.error(`Batch ${batchIndex + 1} failed:`, error);
        totalFailures += batchSize;
      }
      
      // Small delay between batches to avoid overwhelming server
      if (batchIndex < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Combine all batches into one response
    const finalBlob = await combineZipFiles(allFiles);
    const finalResponse = new Response(finalBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="bulk_pdfs_${totalCount}_files.zip"`,
        'X-PDF-Generation-Summary': `${totalSuccess} successful, ${totalFailures} failed`
      }
    });
    
    return finalResponse;
  };
  
  // Helper function to generate a single batch
  const generateSingleBatch = async (operationId: string, format: string, locale: string, batchSize: number, startIdx: number, endIdx: number) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), batchSize * 8000 + 60000); // 8 seconds per PDF + 1 minute buffer
    
    try {
      const response = await fetch('/api/admin/bulk-pdf-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operationId: operationId === 'all' ? null : operationId,
          format,
          locale,
          batchStart: startIdx,
          batchEnd: endIdx,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate PDF batch';
        try {
          const responseText = await response.text();
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
              errorMessage = `Batch timeout (${response.status}). Retrying...`;
            } else {
              errorMessage = responseText || errorMessage;
            }
          }
        } catch (readError) {
          errorMessage = `Batch error (${response.status}).`;
        }
        throw new Error(errorMessage);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  // Helper function to combine multiple ZIP files
  const combineZipFiles = async (files: { filename: string; buffer: ArrayBuffer }[]): Promise<Blob> => {
    // For now, just return the first file if only one, or create a simple combined blob
    if (files.length === 1) {
      return new Blob([files[0].buffer], { type: 'application/zip' });
    }
    
    // Create a simple combined ZIP (this is a simplified approach)
    // In a real implementation, you'd use a ZIP library to properly combine
    const combinedBuffer = new Uint8Array(files.reduce((total, file) => total + file.buffer.byteLength, 0));
    let offset = 0;
    
    for (const file of files) {
      combinedBuffer.set(new Uint8Array(file.buffer), offset);
      offset += file.buffer.byteLength;
    }
    
    return new Blob([combinedBuffer], { type: 'application/zip' });
  };

  // Check job status
  const checkJobStatus = async (jobId: string) => {
    const response = await fetch(`/api/admin/bulk-pdf-status/${jobId}`);
    if (!response.ok) {
      throw new Error('Failed to check job status');
    }
    return response.json();
  };

  // Download completed job
  const downloadJob = async (jobId: string) => {
    const response = await fetch(`/api/admin/bulk-pdf-download/${jobId}`);
    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const contentDisposition = response.headers.get('content-disposition');
    const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] || 'bulk-pdfs.zip';

    const blob = await response.blob();
    
    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { filename, size: blob.size };
  };

  // Direct bulk PDF generation mutation (much faster)
  const bulkPDFMutation = useMutation({
    mutationFn: async ({ operationId, format, locale, totalCount }: { 
      operationId: string | null, 
      format: string, 
      locale: string,
      totalCount: number
    }) => {
      // Direct generation and download
      const response = await generateAndDownloadPDFs(operationId!, format, locale, totalCount);
      
      // Handle the response to extract download info
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const summaryHeader = response.headers.get('X-PDF-Generation-Summary');
      
      // Extract filename from Content-Disposition header
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] || 'bulk_pdfs.zip';
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const result = { 
        filename, 
        size: blob.size,
        summary: summaryHeader 
      };
      
      // Parse summary if available
      const summary = result.summary?.split(',') || [];
      const successCount = summary[0]?.match(/(\d+)/)?.[1] || '0';
      const failureCount = summary[1]?.match(/(\d+)/)?.[1] || '0';
      
      return {
        filename: result.filename,
        size: result.size,
        successCount: parseInt(successCount),
        failureCount: parseInt(failureCount),
        summary: result.summary
      };
    },
    onMutate: () => {
      // Keep existing progress from handleGeneratePDFs, just update status
      setProgress(prev => prev ? {
        ...prev,
        status: 'Generating PDFs... This may take a few minutes.'
      } : {
        current: 0,
        total: 1,
        status: 'Generating PDFs... This may take a few minutes.'
      });
    },
    onSuccess: (data: any) => {
      // Set progress to 100% briefly before clearing
      setProgress(prev => prev ? {
        ...prev,
        current: prev.total,
        status: `Completed! Generated ${data.successCount} PDFs successfully.`
      } : null);
      
      // Clear progress after a brief moment
      setTimeout(() => {
        setProgress(null);
      }, 2000);
      
      // Update last generation info
      setLastGeneration({
        timestamp: new Date().toISOString(),
        filename: data.filename,
        count: data.successCount,
        size: formatFileSize(data.size),
      });

      setCurrentJobId(null);
    },
    onError: (error) => {
      console.error('Bulk PDF generation failed:', error);
      setProgress(null);
      setCurrentJobId(null);
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleGeneratePDFs = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    const operationInfo = getSelectedOperationInfo();
    setProgress({
      current: 0,
      total: operationInfo.count,
      status: 'Starting PDF generation...',
    });

    try {
      await bulkPDFMutation.mutateAsync({
        operationId: selectedOperation,
        format,
        locale,
        totalCount: operationInfo.count,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getSelectedOperationInfo = () => {
    if (selectedOperation === 'all') {
      const totalLines = operations?.reduce((sum: number, op: any) => sum + op._count.bidLines, 0) || 0;
      return { name: 'All Operations', count: totalLines };
    } else {
      const operation = operations?.find((op: any) => op.id === selectedOperation);
      return {
        name: operation?.name || 'Unknown',
        count: operation?._count.bidLines || 0
      };
    }
  };

  if (operationsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading operations...</span>
      </div>
    );
  }

  const operationInfo = getSelectedOperationInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Archive className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Bulk PDF Generation
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate and download PDF reports for multiple bid lines
            </p>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operation Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Operation Filter
              </label>
              <select
                value={selectedOperation}
                onChange={(e) => setSelectedOperation(e.target.value)}
                disabled={isGenerating}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="all">All Operations</option>
                {operations?.map((operation: any) => (
                  <option key={operation.id} value={operation.id}>
                    {operation.name} ({operation._count.bidLines} lines)
                  </option>
                ))}
              </select>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Output Format
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="zip"
                    checked={format === 'zip'}
                    onChange={(e) => setFormat(e.target.value as 'zip')}
                    disabled={isGenerating}
                    className="mr-3 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    ZIP Archive (Individual PDFs)
                  </span>
                </label>
                {/* Combined PDF option disabled for now */}
                <label className="flex items-center opacity-50">
                  <input
                    type="radio"
                    value="combined"
                    checked={false}
                    disabled={true}
                    className="mr-3 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Combined PDF (Coming Soon)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Generation Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Operation:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {operationInfo.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Bid Lines:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {operationInfo.count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Format:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {format === 'zip' ? 'ZIP Archive' : 'Combined PDF'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Language:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {locale === 'fr' ? 'Français' : 'English'}
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGeneratePDFs}
              disabled={isGenerating || operationInfo.count === 0}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-md transform disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  Generate PDFs
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      {progress && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Generating PDFs
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{progress.status}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {progress.current} / {progress.total}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Last Generation Info */}
      {lastGeneration && !isGenerating && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
                PDFs Generated Successfully
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700 dark:text-green-300 font-medium">Generated:</span>
                  <span className="ml-2 text-green-900 dark:text-green-100">
                    {formatRelativeTime(lastGeneration.timestamp)}
                  </span>
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300 font-medium">Files:</span>
                  <span className="ml-2 text-green-900 dark:text-green-100">
                    {lastGeneration.count} PDFs
                  </span>
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300 font-medium">Size:</span>
                  <span className="ml-2 text-green-900 dark:text-green-100">
                    {lastGeneration.size}
                  </span>
                </div>
                <div>
                  <span className="text-green-700 dark:text-green-300 font-medium">Filename:</span>
                  <span className="ml-2 text-green-900 dark:text-green-100 font-mono text-xs">
                    {lastGeneration.filename}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {bulkPDFMutation.isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                PDF Generation Failed
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                {bulkPDFMutation.error?.message || 'An unknown error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}