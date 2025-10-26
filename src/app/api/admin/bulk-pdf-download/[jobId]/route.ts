import { NextRequest, NextResponse } from 'next/server';
import { withSupervisor } from '@/lib/api/withAuth';
import { pdfJobStore } from '@/lib/pdfJobStore';

async function downloadPDFJobHandler(
  request: NextRequest & { user: any },
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = pdfJobStore.getJob(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Job not completed', 
        status: job.status 
      }, { status: 400 });
    }

    if (!job.result) {
      return NextResponse.json({ error: 'No result available' }, { status: 404 });
    }

    const { buffer, filename } = job.result;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'X-PDF-Generation-Summary': `${job.progress.successCount} successful, ${job.progress.failureCount} failed`,
      },
    });

  } catch (error) {
    console.error('PDF job download error:', error);
    return NextResponse.json(
      { error: 'Failed to download job result' },
      { status: 500 }
    );
  }
}

export const GET = withSupervisor(downloadPDFJobHandler);