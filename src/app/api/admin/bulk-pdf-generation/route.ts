import { NextRequest, NextResponse } from 'next/server';
import { withSupervisor } from '@/lib/api/withAuth';
import { getAllBidLinesWithMetrics } from '@/lib/bidLineQueries';
import archiver from 'archiver';

async function handleLargeBatch(bidLines: any[], request: NextRequest & { user: any }, locale: string, operationId: string | null) {
  console.log(`Large batch detected (${bidLines.length} lines), implementing chunked processing`);
  
  // Get the base URL for PDF generation
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host');
  const baseUrl = `${protocol}://${host}`;
  
  // Create ZIP file with individual PDFs
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  // Create a readable stream for the response
  const chunks: Buffer[] = [];
  archive.on('data', (chunk) => chunks.push(chunk));
  archive.on('error', (err) => { throw err; });

  let processedCount = 0;
  let successCount = 0;
  let failureCount = 0;
  
  // Process in larger chunks for speed
  const chunkSize = 20; // Process 20 PDFs in parallel for better speed
  const startTime = Date.now();
  const maxProcessingTime = 600000; // Max 10 minutes total processing time
  
  for (let i = 0; i < bidLines.length; i += chunkSize) {
    // Check if we've exceeded max processing time
    if (Date.now() - startTime > maxProcessingTime) {
      console.log(`Reached max processing time limit, stopping at ${i} of ${bidLines.length} lines`);
      break;
    }
    
    const chunk = bidLines.slice(i, i + chunkSize);
    console.log(`Processing chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(bidLines.length/chunkSize)} (${chunk.length} lines)`);
    
    // Process chunk in parallel for better performance
    const chunkPromises = chunk.map(async (bidLine) => {
      const currentCount = i + chunk.indexOf(bidLine) + 1;
      console.log(`Processing bid line ${bidLine.lineNumber} (${currentCount}/${bidLines.length})`);
      
      try {
        // Call the PDF generation API with authentication headers
        const pdfResponse = await fetch(`${baseUrl}/api/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            bidLineId: bidLine.id,
            operationName: bidLine.operation?.name || 'Unknown',
            lineNumber: bidLine.lineNumber,
            locale: locale
          }),
          signal: AbortSignal.timeout(180000) // 180 second timeout per PDF
        });

        if (!pdfResponse.ok) {
          const errorText = await pdfResponse.text();
          console.error(`PDF API error for line ${bidLine.lineNumber} (${pdfResponse.status}):`, errorText);
          return { success: false, bidLine };
        }

        // Check if response is actually a PDF
        const contentType = pdfResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
          console.error(`Invalid content type for line ${bidLine.lineNumber}: ${contentType}`);
          return { success: false, bidLine };
        }

        // Get PDF buffer from response
        const pdfBuffer = await pdfResponse.arrayBuffer();

        if (pdfBuffer.byteLength === 0) {
          console.error(`Empty PDF buffer for line ${bidLine.lineNumber}`);
          return { success: false, bidLine };
        }

        return { success: true, bidLine, pdfBuffer };

      } catch (pdfError) {
        console.error(`Error generating PDF for line ${bidLine.lineNumber}:`, pdfError);
        return { success: false, bidLine };
      }
    });
    
    // Wait for chunk to complete
    const chunkResults = await Promise.all(chunkPromises);
    
    // Add successful PDFs to archive
    for (const result of chunkResults) {
      if (result.success && result.pdfBuffer) {
        const operationName = result.bidLine.operation?.name || 'Unknown';
        const filename = `${operationName.replace(/[^a-zA-Z0-9-_]/g, '_')}_Line_${result.bidLine.lineNumber}.pdf`;
        archive.append(Buffer.from(result.pdfBuffer), { name: filename });
        successCount++;
      } else {
        failureCount++;
      }
    }
    
    // No delay between chunks for maximum speed
  }
  
  console.log(`Large batch PDF generation completed: ${successCount} successful, ${failureCount} failed`);

  // Finalize the archive
  await archive.finalize();
  
  // Wait for all chunks to be collected
  const zipBuffer = Buffer.concat(chunks);
  
  const operationFilter = operationId ? `_${bidLines[0]?.operation?.name || 'Operation'}` : '_All_Operations';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Bid_Line_Reports${operationFilter}_${timestamp}.zip`;

  // Add summary to response headers
  const summaryHeader = `${successCount} successful, ${failureCount} failed`;
  
  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.length.toString(),
      'X-PDF-Generation-Summary': summaryHeader,
    },
  });
}

async function bulkPDFGenerationHandler(request: NextRequest & { user: any }) {
  try {

    const body = await request.json();
    const { operationId, format = 'zip', locale = 'en', batchStart, batchEnd } = body;

    console.log(`Admin ${request.user.email} requesting bulk PDF generation:`, { operationId, format, locale });

    // Get bid lines based on filter
    let bidLines = await getAllBidLinesWithMetrics(operationId || undefined);
    
    if (bidLines.length === 0) {
      return NextResponse.json({ error: 'No bid lines found' }, { status: 404 });
    }

    // Apply batch filtering if parameters provided
    if (typeof batchStart === 'number' && typeof batchEnd === 'number') {
      console.log(`Applying batch filter: ${batchStart} to ${batchEnd} of ${bidLines.length} total lines`);
      bidLines = bidLines.slice(batchStart, batchEnd);
      
      if (bidLines.length === 0) {
        return NextResponse.json({ error: 'No bid lines in specified batch range' }, { status: 404 });
      }
    }

    console.log(`Generating PDFs for ${bidLines.length} bid lines ${batchStart !== undefined ? `(batch ${batchStart}-${batchEnd})` : ''}`);

    // For large batches (>50), implement a timeout-friendly approach with smaller chunks
    if (bidLines.length > 50) {
      return await handleLargeBatch(bidLines, request, locale, operationId);
    }

    // Get the base URL for PDF generation
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    if (format === 'zip') {
      // Create ZIP file with individual PDFs
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Create a readable stream for the response
      const chunks: Buffer[] = [];
      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('error', (err) => { throw err; });

      let processedCount = 0;
      
      try {
        // Generate individual PDFs using the PDF API endpoint
        let successCount = 0;
        let failureCount = 0;
        
        for (const bidLine of bidLines) {
          processedCount++;
          console.log(`Processing bid line ${bidLine.lineNumber} (${processedCount}/${bidLines.length})`);
          
          try {
            // Call the PDF generation API with authentication headers
            const pdfResponse = await fetch(`${baseUrl}/api/generate-pdf`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('Cookie') || '', // Forward authentication cookies
              },
              body: JSON.stringify({
                bidLineId: bidLine.id,
                operationName: bidLine.operation?.name || 'Unknown',
                lineNumber: bidLine.lineNumber,
                locale: locale
              }),
              signal: AbortSignal.timeout(180000) // 180 second timeout per PDF
            });

            if (!pdfResponse.ok) {
              const errorText = await pdfResponse.text();
              console.error(`PDF API error for line ${bidLine.lineNumber} (${pdfResponse.status}):`, errorText);
              failureCount++;
              continue;
            }

            // Check if response is actually a PDF (content-type check)
            const contentType = pdfResponse.headers.get('content-type');
            if (!contentType || !contentType.includes('application/pdf')) {
              console.error(`Invalid content type for line ${bidLine.lineNumber}: ${contentType}`);
              failureCount++;
              continue;
            }

            // Get PDF buffer from response
            const pdfBuffer = await pdfResponse.arrayBuffer();

            if (pdfBuffer.byteLength === 0) {
              console.error(`Empty PDF buffer for line ${bidLine.lineNumber}`);
              failureCount++;
              continue;
            }

            // Add PDF to ZIP with a meaningful filename
            const operationName = bidLine.operation?.name || 'Unknown';
            const filename = `${operationName.replace(/[^a-zA-Z0-9-_]/g, '_')}_Line_${bidLine.lineNumber}.pdf`;
            archive.append(Buffer.from(pdfBuffer), { name: filename });
            successCount++;

          } catch (pdfError) {
            console.error(`Error generating PDF for line ${bidLine.lineNumber}:`, pdfError);
            failureCount++;
          }

          // No delays for maximum speed
        }
        
        console.log(`PDF generation completed: ${successCount} successful, ${failureCount} failed`);

        // Finalize the archive
        await archive.finalize();
        
        // Wait for all chunks to be collected
        const zipBuffer = Buffer.concat(chunks);
        
        const operationFilter = operationId ? `_${bidLines[0]?.operation?.name || 'Operation'}` : '_All_Operations';
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `Bid_Line_Reports${operationFilter}_${timestamp}.zip`;

        // Add summary to response headers
        const summaryHeader = `${successCount} successful, ${failureCount} failed`;
        
        return new NextResponse(zipBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': zipBuffer.length.toString(),
            'X-PDF-Generation-Summary': summaryHeader,
          },
        });

      } catch (error) {
        console.error('Error creating ZIP archive:', error);
        throw error;
      }
      
    } else {
      // For combined PDF, we'll need to create a custom page that includes all bid lines
      // This is more complex and might be better as a separate endpoint
      return NextResponse.json({ error: 'Combined PDF format not yet implemented' }, { status: 501 });
    }

  } catch (error) {
    console.error('Bulk PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bulk PDFs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const POST = withSupervisor(bulkPDFGenerationHandler);