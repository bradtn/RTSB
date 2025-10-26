import { pdfJobStore } from './pdfJobStore';
import archiver from 'archiver';

export async function processPDFsInBackground(
  jobId: string,
  bidLines: any[],
  baseUrl: string,
  locale: string,
  operationId: string | null,
  authCookie: string
) {
  const job = pdfJobStore.getJob(jobId);
  if (!job) {
    console.error(`Job ${jobId} not found`);
    return;
  }

  pdfJobStore.updateJob(jobId, { status: 'processing' });

  try {
    // Create ZIP archive with memory-efficient streaming
    const archive = archiver('zip', {
      zlib: { level: 1 }, // Reduced compression to save memory
      store: true // Store mode to reduce CPU/memory usage
    });

    const chunks: Buffer[] = [];
    archive.on('data', (chunk) => {
      chunks.push(chunk);
      // Force garbage collection of old chunks periodically
      if (chunks.length > 50) {
        console.log(`Archive chunk count: ${chunks.length}, memory usage high`);
      }
    });
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      pdfJobStore.setError(jobId, err.message);
    });

    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    // Process in chunks - one at a time to avoid server overload
    const chunkSize = 1;
    
    for (let i = 0; i < bidLines.length; i += chunkSize) {
      const chunk = bidLines.slice(i, i + chunkSize);
      console.log(`Job ${jobId}: Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(bidLines.length/chunkSize)}`);
      
      // Process chunk in parallel
      const chunkPromises = chunk.map(async (bidLine) => {
        try {
          const pdfResponse = await fetch(`${baseUrl}/api/generate-pdf`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': authCookie,
            },
            body: JSON.stringify({
              bidLineId: bidLine.id,
              operationName: bidLine.operation?.name || 'Unknown',
              lineNumber: bidLine.lineNumber,
              locale: locale
            }),
            signal: AbortSignal.timeout(120000) // 120 second timeout per PDF
          });

          if (!pdfResponse.ok) {
            console.error(`PDF API error for line ${bidLine.lineNumber}: ${pdfResponse.status}`);
            return { success: false };
          }

          const contentType = pdfResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/pdf')) {
            console.error(`Invalid content type for line ${bidLine.lineNumber}`);
            return { success: false };
          }

          const pdfBuffer = await pdfResponse.arrayBuffer();
          if (pdfBuffer.byteLength === 0) {
            console.error(`Empty PDF buffer for line ${bidLine.lineNumber}`);
            return { success: false };
          }

          return { 
            success: true, 
            bidLine, 
            pdfBuffer 
          };

        } catch (error) {
          console.error(`Error generating PDF for line ${bidLine.lineNumber}:`, error);
          return { success: false };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      
      // Add successful PDFs to archive
      for (const result of chunkResults) {
        processedCount++;
        
        if (result.success && result.pdfBuffer) {
          const operationName = result.bidLine.operation?.name || 'Unknown';
          const filename = `${operationName.replace(/[^a-zA-Z0-9-_]/g, '_')}_Line_${result.bidLine.lineNumber}.pdf`;
          archive.append(Buffer.from(result.pdfBuffer), { name: filename });
          successCount++;
        } else {
          failureCount++;
        }
      }

      // Update progress
      pdfJobStore.updateProgress(jobId, processedCount, successCount, failureCount);
      
      // Longer delay between chunks to prevent server overload
      if (i + chunkSize < bidLines.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Finalize archive
    await archive.finalize();
    const zipBuffer = Buffer.concat(chunks);
    
    const operationFilter = operationId ? `_${bidLines[0]?.operation?.name || 'Operation'}` : '_All_Operations';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Bid_Line_Reports${operationFilter}_${timestamp}.zip`;

    // Store result
    pdfJobStore.setResult(jobId, zipBuffer, filename);
    
    console.log(`Job ${jobId} completed: ${successCount} successful, ${failureCount} failed`);

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    pdfJobStore.setError(jobId, error instanceof Error ? error.message : 'Unknown error');
  }
}