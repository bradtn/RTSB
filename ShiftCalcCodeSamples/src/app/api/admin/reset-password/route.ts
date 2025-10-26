// src/app/api/admin/reset-password/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { hash } from "bcrypt";

// POST /api/admin/reset-password
export async function POST(request: Request) {
  try {
    console.log("POST /api/admin/reset-password - Starting request");
    
    // Get session
    const session = await getServerSession(authOptions);
    console.log("Session:", JSON.stringify(session, null, 2));
    
    // Check admin role
    if (!session || !session.user || session.user.role !== "admin") {
      console.log("Unauthorized - Not admin or invalid session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const data = await request.json();
    console.log("Request data:", { ...data, password: "[REDACTED]" });
    
    const { userId, password = "Password123" } = data;
    
    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }
    
    const id = parseInt(userId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }
    
    // Hash the password
    console.log(`Hashing password for user ID ${id}`);
    const password_hash = await hash(password, 10);
    
    // Update the user password
    console.log(`Updating password for user ID ${id}`);
    const result = await prisma.user.update({
      where: { id },
      data: { password_hash },
      select: { id: true, username: true }
    });
    
    console.log(`Password updated successfully for user ${result.username}`);
    
    return NextResponse.json({
      success: true,
      message: `Password reset successful for ${result.username}`,
      userId: result.id
    });
    
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ 
      error: "Failed to reset password",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}