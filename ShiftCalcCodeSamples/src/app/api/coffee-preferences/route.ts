import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeName = searchParams.get('employee');
    const operation = searchParams.get('operation');
    const line = searchParams.get('line');
    
    if (!employeeName || !operation || !line) {
      return NextResponse.json({ error: "Employee name, operation, and line required" }, { status: 400 });
    }

    console.log('Fetching coffee preferences for:', { employeeName, operation, line });

    // Get coffee preferences for the employee
    const result = await prisma.$queryRaw`
      SELECT coffee_preferences 
      FROM schedules 
      WHERE employee_name = ${employeeName}
      AND \`GROUP\` = ${operation}
      AND LINE = ${line}
      LIMIT 1
    ` as any[];

    console.log('Query result:', result);
    
    let preferences = result[0]?.coffee_preferences || null;
    
    // Parse JSON string if needed
    if (preferences && typeof preferences === 'string') {
      try {
        preferences = JSON.parse(preferences);
      } catch (e) {
        console.error('Failed to parse preferences JSON:', e);
      }
    }
    
    console.log('Returning preferences:', preferences);

    return NextResponse.json({ preferences });

  } catch (error) {
    console.error('Error fetching coffee preferences:', error);
    return NextResponse.json({ 
      error: "Failed to fetch coffee preferences"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeName, operation, line, preferences } = body;
    
    if (!employeeName || !operation || !line) {
      return NextResponse.json({ error: "Employee name, operation, and line required" }, { status: 400 });
    }

    console.log('Saving coffee preferences:', {
      employeeName,
      operation,
      line,
      preferences: JSON.stringify(preferences, null, 2)
    });

    // Update coffee preferences for the employee
    const result = await prisma.$executeRaw`
      UPDATE schedules 
      SET coffee_preferences = ${JSON.stringify(preferences)}
      WHERE employee_name = ${employeeName}
      AND \`GROUP\` = ${operation}
      AND LINE = ${line}
    `;

    console.log('Update result - rows affected:', result);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving coffee preferences:', error);
    return NextResponse.json({ 
      error: "Failed to save coffee preferences"
    }, { status: 500 });
  }
}