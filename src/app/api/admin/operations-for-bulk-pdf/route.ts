import { NextRequest, NextResponse } from 'next/server';
import { withSupervisor } from '@/lib/api/withAuth';
import { getOperationsForBulkPDF } from '@/lib/bidLineQueries';

async function getOperationsForBulkPDFHandler(request: NextRequest & { user: any }) {
  try {
    // Get operations for bulk PDF generation
    const operations = await getOperationsForBulkPDF();
    
    return NextResponse.json(operations, { status: 200 });

  } catch (error) {
    console.error('Error fetching operations for bulk PDF:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operations' },
      { status: 500 }
    );
  }
}

export const GET = withSupervisor(getOperationsForBulkPDFHandler);