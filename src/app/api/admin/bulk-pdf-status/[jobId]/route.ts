import { NextRequest, NextResponse } from 'next/server';
import { withSupervisor } from '@/lib/api/withAuth';
import { pdfJobStore } from '@/lib/pdfJobStore';

async function getPDFJobStatusHandler(
  request: NextRequest & { user: any },
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = pdfJobStore.getJob(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Don't send the buffer in status response
    const { result, ...jobStatus } = job;
    
    return NextResponse.json({
      ...jobStatus,
      hasResult: !!result,
    });

  } catch (error) {
    console.error('PDF job status error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}

export const GET = withSupervisor(getPDFJobStatusHandler);