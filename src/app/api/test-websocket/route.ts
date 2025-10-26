import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Public endpoint for WebSocket testing - no auth required
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const isHttps = protocol === 'https';
  
  // Determine WebSocket URL that clients should use
  const wsProtocol = isHttps ? 'wss' : 'ws';
  const wsHost = host.split(':')[0]; // Remove port from host
  const wsPort = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || '8001';
  const websocketUrl = `${wsProtocol}://${wsHost}:${wsPort}`;
  
  // Test connectivity to WebSocket server
  let serverHealth = null;
  try {
    const healthResponse = await fetch(`http://127.0.0.1:${wsPort}/health`);
    serverHealth = await healthResponse.json();
  } catch (error) {
    serverHealth = { error: 'Cannot reach WebSocket server' };
  }
  
  return NextResponse.json({
    clientInfo: {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      host: host,
      protocol: protocol,
    },
    websocketConfig: {
      recommendedUrl: websocketUrl,
      serverHost: wsHost,
      serverPort: wsPort,
      isSecure: isHttps,
    },
    serverHealth,
    instructions: {
      forDevelopment: `To test WebSocket from external devices, use: ${websocketUrl}`,
      environmentVariable: `Set NEXT_PUBLIC_WEBSOCKET_URL=${websocketUrl} in .env.local`,
    }
  });
}