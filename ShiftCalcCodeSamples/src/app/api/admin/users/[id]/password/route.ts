import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { hash } from "bcrypt";

// Common handler for password reset - works for both methods
async function handlePasswordReset(
  request: Request,
  params: { id: string }
) {
  console.log("Handling password reset for user ID:", params.id);
  
  const session = await getServerSession(authOptions);
  console.log("Session:", JSON.stringify(session, null, 2));
  
  // More permissive role check for debugging
  const userRole = session?.user?.role || 
                  session?.user?.['role'] || 
                  session?.user?.['Role'] ||
                  session?.user?.['userRole'] ||
                  session?.user?.['type'];
                  
  console.log("Detected user role:", userRole);
  
  if (!session) {
    console.log("No session found - Unauthorized");
    return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
  }
  
  if (userRole !== "admin") {
    console.log("User is not admin:", userRole);
    return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 });
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    let password = "Password123"; // Default password
    
    // Try to get password from request body if provided
    try {
      const body = await request.json();
      if (body.password) {
        password = body.password;
      }
    } catch (e) {
      // If parsing fails, use default password
      console.log("Using default password for reset");
    }
    
    const password_hash = await hash(password, 10);
    
    await prisma.user.update({
      where: { id },
      data: { password_hash }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}

// PUT method for password reset
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handlePasswordReset(request, params);
}

// POST method for password reset
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handlePasswordReset(request, params);
}