// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { hash } from "bcrypt";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// GET /api/admin/users - Get all users
export async function GET() {
  console.log("GET /api/admin/users - Starting request");
  
  try {
    // Get session
    console.log("Getting server session");
    const session = await getServerSession(authOptions);
    console.log("Session:", JSON.stringify(session, null, 2));
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (!session.user || !session.user.role) {
      console.log("Session user or role is missing:", session.user);
      return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }
    
    if (session.user.role !== "admin") {
      console.log("User is not admin:", session.user.role);
      return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 });
    }
    
    console.log("Fetching users from database using raw query");
    
    // Use raw SQL to avoid Prisma type conversion issues
    const users = await prisma.$queryRaw`
      SELECT id, username, full_name, role 
      FROM users 
      ORDER BY username ASC
    `;
    
    console.log(`Found ${Array.isArray(users) ? users.length : 0} users`);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error in /api/admin/users:", error);
    return NextResponse.json({ 
      error: "Failed to fetch users", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: Request) {
  console.log("POST /api/admin/users - Starting request");
  
  try {
    console.log("Getting server session");
    const session = await getServerSession(authOptions);
    console.log("Session:", JSON.stringify(session, null, 2));
    
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }
    
    if (!session.user || !session.user.role) {
      console.log("Session user or role is missing:", session.user);
      return NextResponse.json({ error: "Unauthorized - Invalid session" }, { status: 401 });
    }
    
    if (session.user.role !== "admin") {
      console.log("User is not admin:", session.user.role);
      return NextResponse.json({ error: "Unauthorized - Not admin" }, { status: 401 });
    }
    
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { username, full_name, password, role, must_reset_password } = body;
    
    // Validate input
    if (!username || !full_name || !password) {
      console.log("Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Check if username already exists using raw query
    console.log("Checking if username exists:", username);
    const existingUsers = await prisma.$queryRaw`
      SELECT id FROM users WHERE username = ${username}
    `;
    
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      console.log("Username already exists");
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    
    // Hash password
    console.log("Hashing password");
    const password_hash = await hash(password, 10);
    
    // User role
    const userRole = role || "user";
    
    console.log("Creating user with role:", userRole);
    
    // Create user with preferences containing reset flag
    const preferences = must_reset_password ? JSON.stringify({ mustResetPassword: true }) : null;
    
    await prisma.$executeRaw`
      INSERT INTO users (username, full_name, password_hash, role, preferences)
      VALUES (${username}, ${full_name}, ${password_hash}, ${userRole}, ${preferences})
    `;
    
    // Get the created user
    const newUsers = await prisma.$queryRaw`
      SELECT id, username, full_name, role 
      FROM users 
      WHERE username = ${username}
    `;
    
    if (!Array.isArray(newUsers) || newUsers.length === 0) {
      throw new Error("User was not created properly");
    }
    
    const newUser = newUsers[0];
    console.log("User created successfully:", newUser);
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ 
      error: "Failed to create user",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
