import { BidLineUpdateData } from './socket';

/**
 * Server-side WebSocket utility for emitting updates from API routes
 * This sends HTTP requests to the WebSocket server to trigger broadcasts
 */

// Auto-detect WebSocket server URL based on environment
const getWebSocketServerUrl = (): string => {
  if (process.env.WEBSOCKET_SERVER_URL) {
    return process.env.WEBSOCKET_SERVER_URL;
  }
  
  // In production, assume we're running on the same host with HTTPS
  if (process.env.NODE_ENV === 'production') {
    const host = process.env.WEBSOCKET_HOST || process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'localhost';
    const port = process.env.WEBSOCKET_PORT || '8001';
    return `https://${host}:${port}`;
  }
  
  // Development fallback - use IPv4 to avoid connection issues
  return 'http://127.0.0.1:8001';
};

const WEBSOCKET_SERVER_URL = getWebSocketServerUrl();

export const emitBidLineUpdateFromServer = async (data: BidLineUpdateData): Promise<void> => {
  try {
    // Send update to WebSocket server via HTTP (for server-to-server communication)
    const response = await fetch(`${WEBSOCKET_SERVER_URL}/emit-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'bidLineUpdate',
        data,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to emit WebSocket update from server:', response.statusText);
    }
  } catch (error) {
    console.error('Error emitting WebSocket update from server:', error);
    // Don't throw - this is a non-critical operation
  }
};