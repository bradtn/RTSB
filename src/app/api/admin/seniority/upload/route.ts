import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { withSupervisor } from '@/lib/api/withAuth';

async function uploadSeniority(request: NextRequest & { user: any }, params?: any) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file content
    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer).toString('utf-8');
    
    // Parse CSV with proper typing
    interface CSVRecord {
      'Badge Number'?: string;
      'Personal Email'?: string;
      'Work Email'?: string;
      'Personal Phone'?: string;
      'Work Phone'?: string;
      'Preferred Contact'?: string;
      'Notification Language'?: string;
    }
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVRecord[];

    // Validate and process records
    const seniorityEntries = [];
    const errors = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rank = i + 1; // Seniority rank based on order in CSV
      
      // Required fields
      if (!record['Badge Number']) {
        errors.push(`Row ${rank}: Badge Number is required`);
        continue;
      }
      
      // Find user by badge number
      const user = await prisma.user.findUnique({
        where: { badgeNumber: record['Badge Number'].toString() },
      });
      
      if (!user) {
        errors.push(`Row ${rank}: User with badge ${record['Badge Number']} not found`);
        continue;
      }
      
      // Parse and validate notification language
      let notificationLanguage: 'EN' | 'FR' = 'EN'; // Default to English
      if (record['Notification Language']) {
        const lang = record['Notification Language'].toUpperCase();
        if (lang === 'EN' || lang === 'FR' || lang === 'ENGLISH' || lang === 'FRENCH') {
          notificationLanguage = (lang === 'FRENCH' || lang === 'FR') ? 'FR' : 'EN';
        } else {
          errors.push(`Row ${rank}: Invalid notification language "${record['Notification Language']}". Use EN/FR or English/French`);
          continue;
        }
      }
      
      // Update user's notification language preference if provided
      if (record['Notification Language']) {
        await prisma.user.update({
          where: { id: user.id },
          data: { notificationLanguage },
        });
      }
      
      // Prepare seniority entry
      seniorityEntries.push({
        userId: user.id,
        seniorityRank: rank,
        personalEmail: record['Personal Email'] || null,
        workEmail: record['Work Email'] || null,
        personalPhone: record['Personal Phone'] || null,
        workPhone: record['Work Phone'] || null,
        preferredContact: record['Preferred Contact'] || 'email',
        currentBiddingStatus: rank === 1 ? 'up_next' : rank === 2 ? 'next_in_line' : 'waiting',
      });
    }
    
    // If there are errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        processed: seniorityEntries.length,
      }, { status: 400 });
    }
    
    // Clear existing seniority list
    await prisma.seniorityList.deleteMany({});
    
    // Insert new seniority list
    await prisma.seniorityList.createMany({
      data: seniorityEntries,
    });
    
    // Log the upload
    await prisma.activityLog.create({
      data: {
        userId: request.user.id,
        action: 'SENIORITY_LIST_UPLOAD',
        details: {
          recordCount: seniorityEntries.length,
          uploadedBy: request.user.email,
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${seniorityEntries.length} officers`,
      processed: seniorityEntries.length,
    });
    
  } catch (error) {
    console.error('Error uploading seniority list:', error);
    return NextResponse.json({ error: 'Failed to upload seniority list' }, { status: 500 });
  }
}

// GET endpoint to fetch current seniority list
async function getSeniorityList(request: NextRequest & { user: any }, params?: any) {
  try {
    const seniorityList = await prisma.seniorityList.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNumber: true,
            email: true,
            phoneNumber: true,
            notificationLanguage: true,
          },
        },
      },
      orderBy: {
        seniorityRank: 'asc',
      },
    });

    return NextResponse.json(seniorityList);
  } catch (error) {
    console.error('Error fetching seniority list:', error);
    return NextResponse.json({ error: 'Failed to fetch seniority list' }, { status: 500 });
  }
}

export const POST = withSupervisor(uploadSeniority);
export const GET = withSupervisor(getSeniorityList);
