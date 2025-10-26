import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { hash } from "bcrypt";
import prisma from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await hash(password, 10);

    // Get current user preferences
    const users = await prisma.$queryRaw`
      SELECT preferences FROM users WHERE id = ${parseInt(session.user.id)}
    `;
    
    let preferences = {};
    if (users[0]?.preferences) {
      try {
        preferences = typeof users[0].preferences === 'string' ? 
          JSON.parse(users[0].preferences) : users[0].preferences;
      } catch (e) {
        console.log("Error parsing existing preferences:", e);
      }
    }
    
    // Remove mustResetPassword flag
    delete preferences.mustResetPassword;
    
    // Update user's password and preferences
    const preferencesJson = Object.keys(preferences).length > 0 ? JSON.stringify(preferences) : null;
    
    await prisma.$executeRaw`
      UPDATE users 
      SET password_hash = ${passwordHash}, 
          preferences = ${preferencesJson},
          updated_at = NOW()
      WHERE id = ${parseInt(session.user.id)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ 
      error: "Failed to reset password",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}