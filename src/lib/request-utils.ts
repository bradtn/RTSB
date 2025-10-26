import { NextRequest } from 'next/server';

/**
 * Extract the real IP address from a Next.js request
 * Handles various proxy configurations and headers
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers that proxies/load balancers might set
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // For Vercel/deployment platforms
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) {
    return vercelForwarded.split(',')[0].trim();
  }

  // Fallback to connection info if available
  // Note: In Edge runtime, this might not be available
  return '127.0.0.1'; // Default fallback for local development
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent');
}