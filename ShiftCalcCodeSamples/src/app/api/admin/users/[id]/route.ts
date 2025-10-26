// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// GET /api/admin/users/[id] - Get a single user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("GET /api/admin/users/[id] - Starting request");
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the ID, ensuring it's a number as required by Prisma schema
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    
    console.log(`Retrieving user with ID: ${id} (${typeof id})`);
    
    // Get user without password hash using raw SQL to avoid Prisma type issues
    const users = await prisma.$queryRaw`
      SELECT id, username, full_name, role 
      FROM users 
      WHERE id = ${id}
    `;
    
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const user = users[0];
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ 
      error: "Failed to fetch user",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update a user
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("PATCH /api/admin/users/[id] - Starting request");
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the ID, ensuring it's a number as required by Prisma schema
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    
    console.log(`Processing update for user ID: ${id} (${typeof id})`);
    
    // Parse request body
    const body = await request.json();
    console.log("Request body:", body);
    
    // Check if user exists using raw query
    const existingUsers = await prisma.$queryRaw`
      SELECT id FROM users WHERE id = ${id}
    `;
    
    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Prepare update data with explicit typing - ONLY include full_name
    // This avoids any issues with unintended fields being included
    const updateData = {
      full_name: typeof body.full_name === 'string' ? body.full_name : undefined
    };
    
    // Filter out any undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
    }
    
    console.log("Update data:", updateData);
    
    try {
      // Extract the full_name to update
      const { full_name } = updateData;
      
      if (!full_name) {
        return NextResponse.json({ error: "No valid update fields provided" }, { status: 400 });
      }
      
      console.log(`Updating only the full_name field to: "${full_name}" using raw SQL`);
      
      // Update using raw SQL query to avoid Prisma type conversion issues
      await prisma.$executeRaw`
        UPDATE users 
        SET full_name = ${full_name}
        WHERE id = ${id}
      `;
      
      // Get the updated user with raw query
      const updatedUsers = await prisma.$queryRaw`
        SELECT id, username, full_name, role 
        FROM users 
        WHERE id = ${id}
      `;
      
      if (!Array.isArray(updatedUsers) || updatedUsers.length === 0) {
        throw new Error("Failed to retrieve updated user");
      }
      
      const updatedUser = updatedUsers[0];
      
      return NextResponse.json({
        success: true,
        user: updatedUser
      });
    } catch (innerError) {
      console.error("Prisma error during user update:", innerError);
      return NextResponse.json({ 
        error: "Failed to update user",
        details: innerError instanceof Error ? innerError.message : String(innerError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ 
      error: "Failed to update user",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("DELETE /api/admin/users/[id] - Starting request");
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse the ID, ensuring it's a number as required by Prisma schema
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }
    
    console.log(`Processing delete for user ID: ${id} (${typeof id})`);
    
    // Check if user exists using raw query
    const existingUsers = await prisma.$queryRaw`
      SELECT id, username FROM users WHERE id = ${id}
    `;
    
    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userToDelete = existingUsers[0];
    
    // Prevent admin from deleting themselves
    if (session.user.id === String(id)) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }
    
    // Delete user with raw SQL to avoid Prisma type issues
    await prisma.$executeRaw`
      DELETE FROM users WHERE id = ${id}
    `;
    
    console.log(`User ${userToDelete.username} deleted successfully`);
    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.username} deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ 
      error: "Failed to delete user",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}