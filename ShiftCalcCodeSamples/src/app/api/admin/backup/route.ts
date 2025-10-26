// src/app/api/admin/backup/route.ts
// Modified to fix the $queryRaw usage error
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import * as XLSX from 'xlsx';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  console.log("GET /api/admin/backup - Starting backup request");

  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
      console.log("Unauthorized backup attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Authenticated as admin, proceeding with backup");

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Fetch shift codes
    console.log("Fetching shift codes...");
    try {
      // First check what columns exist in the shift_codes table
      const shiftCodesColumns = await prisma.$queryRaw`SHOW COLUMNS FROM shift_codes`;
      const shiftCodesColumnNames = shiftCodesColumns.map(col => col.Field);
      console.log("Available shift_codes columns:", shiftCodesColumnNames);
      
      // Now use the correct tag function syntax
      let shiftCodes;
      if (shiftCodesColumnNames.includes("updated_at")) {
        shiftCodes = await prisma.$queryRaw`
          SELECT
            id,
            code as CODE,
            TIME_FORMAT(begin, '%H:%i') as BEGIN,
            TIME_FORMAT(end, '%H:%i') as END,
            description as DESCRIPTION,
            created_at,
            updated_at
          FROM
            shift_codes
        `;
      } else if (shiftCodesColumnNames.includes("created_at")) {
        shiftCodes = await prisma.$queryRaw`
          SELECT
            id,
            code as CODE,
            TIME_FORMAT(begin, '%H:%i') as BEGIN,
            TIME_FORMAT(end, '%H:%i') as END,
            description as DESCRIPTION,
            created_at
          FROM
            shift_codes
        `;
      } else {
        shiftCodes = await prisma.$queryRaw`
          SELECT
            id,
            code as CODE,
            TIME_FORMAT(begin, '%H:%i') as BEGIN,
            TIME_FORMAT(end, '%H:%i') as END,
            description as DESCRIPTION
          FROM
            shift_codes
        `;
      }

      if (Array.isArray(shiftCodes) && shiftCodes.length > 0) {
        console.log(`Found ${shiftCodes.length} shift codes for backup`);

        // Format dates for better Excel display
        const formattedShiftCodes = shiftCodes.map(code => {
          const result = {
            id: code.id,
            CODE: code.CODE,
            BEGIN: code.BEGIN,
            END: code.END,
            DESCRIPTION: code.DESCRIPTION || ""
          };
          
          if (code.created_at) {
            result.created_at = new Date(code.created_at).toLocaleDateString();
          }
          
          if (code.updated_at) {
            result.updated_at = new Date(code.updated_at).toLocaleDateString();
          }
          
          return result;
        });

        // Add shift codes sheet
        const shiftCodesSheet = XLSX.utils.json_to_sheet(formattedShiftCodes);
        XLSX.utils.book_append_sheet(workbook, shiftCodesSheet, "Shift Codes");
      } else {
        console.log("No shift codes found for backup");
      }
    } catch (error) {
      console.error("Error fetching shift codes:", error);
      // Continue with the rest of the backup even if one part fails
    }

    // Fetch schedules
    console.log("Fetching schedules...");
    try {
      const schedulesColumns = await prisma.$queryRaw`SHOW COLUMNS FROM schedules`;
      const schedulesColumnNames = schedulesColumns.map(col => col.Field);
      console.log("Available schedules columns:", schedulesColumnNames);
      
      // Use proper tag function syntax
      const schedules = await prisma.$queryRaw`SELECT * FROM schedules`;

      if (Array.isArray(schedules) && schedules.length > 0) {
        console.log(`Found ${schedules.length} schedules for backup`);

        // Format dates for better Excel display
        const formattedSchedules = schedules.map(schedule => {
          const result = {};

          // Process each field in the schedule
          for (const [key, value] of Object.entries(schedule)) {
            if ((key === 'created_at' || key === 'updated_at') && value) {
              result[key] = new Date(value).toLocaleDateString();
            } else {
              result[key] = value;
            }
          }

          return result;
        });

        // Add schedules sheet
        const schedulesSheet = XLSX.utils.json_to_sheet(formattedSchedules);
        XLSX.utils.book_append_sheet(workbook, schedulesSheet, "Schedules");
      } else {
        console.log("No schedules found for backup");
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      // Continue with the rest of the backup even if one part fails
    }

    // Fetch users
    console.log("Fetching users...");
    try {
      const usersColumns = await prisma.$queryRaw`SHOW COLUMNS FROM users`;
      const usersColumnNames = usersColumns.map(col => col.Field);
      console.log("Available users columns:", usersColumnNames);
      
      // Build a query based on available columns using proper tag function syntax
      let users;
      if (usersColumnNames.includes("updated_at")) {
        users = await prisma.$queryRaw`
          SELECT id, username, full_name, role, created_at, updated_at
          FROM users
        `;
      } else if (usersColumnNames.includes("created_at")) {
        users = await prisma.$queryRaw`
          SELECT id, username, full_name, role, created_at
          FROM users
        `;
      } else {
        users = await prisma.$queryRaw`
          SELECT id, username, full_name, role
          FROM users
        `;
      }

      if (Array.isArray(users) && users.length > 0) {
        console.log(`Found ${users.length} users for backup`);

        // Format dates for better Excel display
        const formattedUsers = users.map(user => {
          const result = {
            id: user.id
          };
          
          if (user.username !== undefined) result.username = user.username;
          if (user.full_name !== undefined) result.full_name = user.full_name;
          if (user.role !== undefined) result.role = user.role;
          
          if (user.created_at) {
            result.created_at = new Date(user.created_at).toLocaleDateString();
          }
          
          if (user.updated_at) {
            result.updated_at = new Date(user.updated_at).toLocaleDateString();
          }
          
          return result;
        });

        // Add users sheet
        const usersSheet = XLSX.utils.json_to_sheet(formattedUsers);
        XLSX.utils.book_append_sheet(workbook, usersSheet, "Users");
      } else {
        console.log("No users found for backup");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Continue with the rest of the backup even if one part fails
    }

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `shiftbid_backup_${timestamp}.xlsx`;

    console.log(`Creating Excel file: ${filename}`);

    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx"
    });

    // Set headers for file download
    const headers = new Headers();
    headers.append("Content-Disposition", `attachment; filename="${filename}"`);
    headers.append("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    console.log("Backup complete, returning file");

    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json({
      error: "Failed to create backup",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
