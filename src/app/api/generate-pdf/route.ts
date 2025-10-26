import { NextRequest, NextResponse } from 'next/server';
import { withSupervisor } from '@/lib/api/withAuth';
import puppeteer from 'puppeteer';

async function generatePDFHandler(request: NextRequest & { user: any }) {
  try {
    const body = await request.json();
    const { bidLineId, operationName, lineNumber, locale = 'en' } = body;

    if (!bidLineId) {
      return NextResponse.json({ error: 'Bid line ID is required' }, { status: 400 });
    }

    console.log('Starting PDF generation for bid line:', bidLineId);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });

    // Get the current origin from the request
    // Use the actual server port, not NEXTAUTH_URL which might be different
    const origin = 'http://localhost:3004';
    
    // Navigate directly to the PDF-specific page
    const pdfUrl = `${origin}/${locale}/pdf/bid-line-metrics/${bidLineId}`;
    
    console.log('Navigating to PDF page:', pdfUrl);
    
    await page.goto(pdfUrl, { 
      waitUntil: 'networkidle0',
      timeout: 120000 
    });

    console.log('Page loaded, waiting for content...');

    // Wait for the PDF content to be rendered
    await page.waitForSelector('[data-pdf-content]', { timeout: 60000 });

    console.log('PDF content found, generating PDF...');

    // Wait a bit more for content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    await browser.close();

    // Format: Operation-Line-Number-Metrics.pdf
    const cleanOperationName = (operationName || 'Unknown').replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${cleanOperationName}-Line-${lineNumber || bidLineId}-Metrics.pdf`;

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' }, 
      { status: 500 }
    );
  }
}

export const POST = withSupervisor(generatePDFHandler);