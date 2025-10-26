import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple in-memory cache for checking if user has requests
// This prevents repeated DB queries for the same check
const checkCache = new Map<string, { hasRequests: boolean; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const cacheKey = `check:${userId}`;
    
    // Check cache first
    const cached = checkCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ hasRequests: cached.hasRequests });
    }

    // Query database
    const dayOffRequest = await prisma.dayOffRequest.findUnique({
      where: { userId },
      select: { dates: true },
    });

    const hasRequests = !!(dayOffRequest && dayOffRequest.dates.length > 0);
    
    // Update cache
    checkCache.set(cacheKey, { hasRequests, timestamp: Date.now() });
    
    // Clean old cache entries periodically
    if (checkCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of checkCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          checkCache.delete(key);
        }
      }
    }

    return NextResponse.json({ hasRequests });
  } catch (error) {
    console.error('Error checking day-off requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}