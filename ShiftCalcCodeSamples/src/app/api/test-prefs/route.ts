// src/app/api/test-prefs/route.ts
import { NextResponse } from "next/server";

// Simple GET handler
export async function GET(request) {
  console.log("GET request received at /api/test-prefs");
  return NextResponse.json({ 
    message: "Test API is working", 
    timestamp: new Date().toISOString() 
  });
}

// Simple PUT handler
export async function PUT(request) {
  console.log("PUT request received at /api/test-prefs");
  try {
    const body = await request.json();
    return NextResponse.json({
      message: "PUT successful",
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in PUT handler:", error);
    return NextResponse.json({ 
      error: "Error processing request",
      details: error.message
    }, { status: 500 });
  }
}