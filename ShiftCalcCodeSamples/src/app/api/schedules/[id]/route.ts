import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params object before accessing properties
    const { id: paramId } = await params;
    
    const id = parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Fetch schedule by ID
    const schedules = await prisma.$queryRaw`
      SELECT * FROM schedules WHERE id = ${id}
    `;
    
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json(schedules[0]);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}