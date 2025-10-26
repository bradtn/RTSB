import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shiftCodes = await prisma.shiftCode.findMany({
      where: { isActive: true },
      orderBy: [
        { category: "asc" },
        { code: "asc" }
      ]
    });

    return NextResponse.json(shiftCodes);
  } catch (error) {
    console.error("Error fetching shift codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch shift codes" }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { code, beginTime, endTime, category, hoursLength } = data;

    if (!code || !beginTime || !endTime || !category || hoursLength === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

    const shiftCode = await prisma.shiftCode.create({
      data: {
        code: code.toUpperCase(),
        beginTime,
        endTime,
        category,
        hoursLength: parseFloat(hoursLength)
      }
    });

    return NextResponse.json(shiftCode, { status: 201 });
  } catch (error) {
    console.error("Error creating shift code:", error);
    return NextResponse.json(
      { error: "Failed to create shift code" }, 
      { status: 500 }
    );
  }
}