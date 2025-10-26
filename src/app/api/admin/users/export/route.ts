import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSupervisor } from '@/lib/api/withAuth';

async function exportUsers(request: NextRequest & { user: any }, params?: any) {
  try {
    // Fetch all users with their complete information
    const users = await prisma.user.findMany({
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
    });

    // Transform data for CSV export
    const csvData = users.map(user => ({
      'First Name': user.firstName,
      'Last Name': user.lastName,
      'Email': user.email,
      'Badge Number': user.badgeNumber || '',
      'Phone Number': user.phoneNumber || '',
      'Role': user.role,
      'Language': user.language || 'EN',
      'Notification Language': user.notificationLanguage || 'EN',
      'Created At': user.createdAt.toISOString().split('T')[0], // Just the date
    }));

    // Convert to CSV format
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Log the export action
    await prisma.activityLog.create({
      data: {
        userId: request.user.id,
        action: 'USER_DATA_EXPORT',
        details: {
          userCount: users.length,
          exportedBy: request.user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 });
  }
}

export const GET = withSupervisor(exportUsers);