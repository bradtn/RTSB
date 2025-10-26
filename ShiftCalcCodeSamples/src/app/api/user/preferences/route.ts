// src/app/api/user/preferences/route.ts - FULL IMPLEMENTATION
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";

// Add a simple mutex per user to prevent concurrent updates
const userMutexes = {};

function acquireLock(username) {
  if (userMutexes[username]) return false;
  userMutexes[username] = true;
  return true;
}

function releaseLock(username) {
  userMutexes[username] = false;
}

export async function GET() {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const username = session.user?.email;
    
    if (!username) {
      return NextResponse.json({ error: "Username not found in session" }, { status: 404 });
    }

    console.log(`GET preferences for user: ${username}`);
    
    const user = await prisma.user.findFirst({
      where: { username },
      select: { preferences: true }
    });

    if (!user) {
      console.log(`User ${username} not found in database`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`Retrieved preferences:`, user.preferences);
    return NextResponse.json(user.preferences || {});
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const username = session.user?.email;
    
    if (!username) {
      return NextResponse.json({ error: "Username not found in session" }, { status: 404 });
    }

    const url = new URL(request.url);
    const section = url.searchParams.get('section');
    
    if (!section) {
      return NextResponse.json({ error: "Section parameter is required" }, { status: 400 });
    }

    console.log(`PUT preferences for user: ${username}, section: ${section}`);

    // Attempt to acquire lock with retries
    let lockAcquired = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      lockAcquired = acquireLock(username);
      if (lockAcquired) break;
      // Wait between attempts
      await new Promise(r => setTimeout(r, 100));
    }
    
    if (!lockAcquired) {
      console.log(`Failed to acquire lock for user ${username}, too many concurrent requests`);
      return NextResponse.json({ 
        error: "Too many concurrent requests", 
        message: "Please try again in a moment" 
      }, { status: 429 });
    }

    try {
      const user = await prisma.user.findFirst({
        where: { username },
        select: { preferences: true, id: true }
      });

      if (!user) {
        console.log(`User ${username} not found in database`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const sectionData = await request.json();
      console.log(`Section data for ${section}:`, JSON.stringify(sectionData).substring(0, 100) + "...");
      
      // Prepare the updated preferences
      const currentPreferences = user.preferences || {};
      const updatedPreferences = {
        ...currentPreferences,
        [section]: sectionData
      };

      // Try using the raw update method
      try {
        await prisma.$executeRaw`
          UPDATE users 
          SET preferences = ${JSON.stringify(updatedPreferences)} 
          WHERE username = ${username}
        `;
        console.log(`Successfully updated preferences for user ${username}`);
      } catch (updateError) {
        console.error("Error during raw update:", updateError);
        
        // Try a different approach if the raw update fails
        try {
          console.log("Trying alternative update approach");
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              preferences: updatedPreferences 
            }
          });
          console.log("Alternative update succeeded");
        } catch (altError) {
          console.error("Alternative update also failed:", altError);
          throw altError;
        }
      }

      return NextResponse.json({ success: true });
    } finally {
      // Always release the lock when done
      releaseLock(username);
    }
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json({ 
      error: "Failed to update preferences", 
      message: error.message 
    }, { status: 500 });
  }
}