// src/app/api/schedules/[id]/test/route.js
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;
  
  return new NextResponse(JSON.stringify({ 
    status: "OK", 
    message: "API endpoint is working",
    scheduleId: id,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}