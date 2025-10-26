import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import { withSupervisor } from '@/lib/api/withAuth';
import bcrypt from 'bcryptjs';

async function importUsers(request: NextRequest & { user: any }, params?: any) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const updateExisting = formData.get('updateExisting') === 'true';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file content
    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer).toString('utf-8');
    
    // Parse CSV with proper typing
    interface CSVRecord {
      'First Name'?: string;
      'Last Name'?: string;
      'Email'?: string;
      'Badge Number'?: string;
      'Phone Number'?: string;
      'Role'?: string;
      'Language'?: string;
      'Notification Language'?: string;
    }
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVRecord[];

    // Validate and process records
    const userEntries = [];
    const errors = [];
    const updates = [];
    const created = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNum = i + 1;
      
      // Required fields validation
      if (!record['First Name']?.trim()) {
        errors.push(`Row ${rowNum}: First Name is required`);
        continue;
      }
      
      if (!record['Last Name']?.trim()) {
        errors.push(`Row ${rowNum}: Last Name is required`);
        continue;
      }
      
      if (!record['Email']?.trim()) {
        errors.push(`Row ${rowNum}: Email is required`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(record['Email'].trim())) {
        errors.push(`Row ${rowNum}: Invalid email format`);
        continue;
      }
      
      // Validate role
      const validRoles = ['OFFICER', 'SUPERVISOR', 'SUPER_ADMIN'];
      const role = record['Role']?.toUpperCase() || 'OFFICER';
      if (!validRoles.includes(role)) {
        errors.push(`Row ${rowNum}: Invalid role. Must be one of: ${validRoles.join(', ')}`);
        continue;
      }
      
      // Validate languages
      const language = record['Language']?.toUpperCase() || 'EN';
      const notificationLanguage = record['Notification Language']?.toUpperCase() || 'EN';
      
      if (!['EN', 'FR', 'ENGLISH', 'FRENCH'].includes(language)) {
        errors.push(`Row ${rowNum}: Invalid language. Use EN/FR or English/French`);
        continue;
      }
      
      if (!['EN', 'FR', 'ENGLISH', 'FRENCH'].includes(notificationLanguage)) {
        errors.push(`Row ${rowNum}: Invalid notification language. Use EN/FR or English/French`);
        continue;
      }
      
      // Normalize languages
      const normalizedLanguage = (language === 'FRENCH' || language === 'FR') ? 'FR' : 'EN';
      const normalizedNotificationLanguage = (notificationLanguage === 'FRENCH' || notificationLanguage === 'FR') ? 'FR' : 'EN';
      
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: record['Email'].trim().toLowerCase() },
            { badgeNumber: record['Badge Number']?.trim() || undefined }
          ].filter(Boolean)
        }
      });
      
      const userData = {
        firstName: record['First Name'].trim(),
        lastName: record['Last Name'].trim(),
        email: record['Email'].trim().toLowerCase(),
        badgeNumber: record['Badge Number']?.trim() || null,
        phoneNumber: record['Phone Number']?.trim() || null,
        role: role as 'OFFICER' | 'SUPERVISOR' | 'SUPER_ADMIN',
        language: normalizedLanguage as 'EN' | 'FR',
        notificationLanguage: normalizedNotificationLanguage as 'EN' | 'FR',
      };
      
      if (existingUser) {
        if (updateExisting) {
          // Update existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: userData,
          });
          updates.push(`Updated user: ${userData.email}`);
        } else {
          errors.push(`Row ${rowNum}: User with email ${userData.email} already exists`);
          continue;
        }
      } else {
        // Create new user with default password
        const hashedPassword = await bcrypt.hash('TempPass123!', 12);
        
        await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
            mustChangePassword: true,
          },
        });
        created.push(`Created user: ${userData.email}`);
      }
      
      userEntries.push(userData);
    }
    
    // If there are errors and no successful entries, return errors
    if (errors.length > 0 && userEntries.length === 0) {
      return NextResponse.json({
        success: false,
        errors,
        processed: 0,
        created: 0,
        updated: 0,
      }, { status: 400 });
    }
    
    // Log the import
    await prisma.activityLog.create({
      data: {
        userId: request.user.id,
        action: 'USER_DATA_IMPORT',
        details: {
          totalRows: records.length,
          processed: userEntries.length,
          created: created.length,
          updated: updates.length,
          errors: errors.length,
          importedBy: request.user.email,
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully processed ${userEntries.length} users`,
      processed: userEntries.length,
      created: created.length,
      updated: updates.length,
      errors: errors.length > 0 ? errors : undefined,
      details: {
        created,
        updated: updates,
      },
    });
    
  } catch (error) {
    console.error('Error importing users:', error);
    return NextResponse.json({ error: 'Failed to import users' }, { status: 500 });
  }
}

export const POST = withSupervisor(importUsers);