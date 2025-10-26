import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get unique groups using raw SQL
    const groups = await prisma.$queryRaw`
      SELECT DISTINCT \`GROUP\` FROM schedules
      WHERE \`GROUP\` IS NOT NULL
      ORDER BY \`GROUP\`
    `;
    
    // Extract group values from the array of objects
    const groupValues = Array.isArray(groups) 
      ? groups.map(g => g.GROUP) 
      : [];
    
    return NextResponse.json(groupValues);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}