import { io, Socket } from 'socket.io-client';

// WebSocket message types with strict TypeScript compliance
export interface BidLineUpdateData {
  bidLineId: string;
  lineNumber: string;
  status: 'AVAILABLE' | 'TAKEN' | 'BLACKED_OUT';
  takenBy?: string;
  takenAt?: string;
  claimedBy?: string;
  operationName?: string;
}

export interface NotificationData {
  type: 'LINE_TAKEN' | 'LINE_AVAILABLE' | 'LINE_ASSIGNED';
  title: string;
  message: string;
  bidLineId?: string;
  timestamp: string;
}

export interface WebSocketEvents {
  connect: () => void;
  disconnect: () => void;
  bidLineUpdate: (data: BidLineUpdateData) => void;
  notification: (data: NotificationData) => void;
}

export interface WebSocketEmitEvents {
  subscribeToNotifications: (userId: string) => void;
  bidLineUpdate: (data: BidLineUpdateData) => void;
}

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    // Determine the correct WebSocket URL based on the current environment
    let socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    
    if (!socketUrl) {
      // Auto-detect based on current page
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      
      // For production/domain access, try to use the same port as the main app
      // with polling fallback when WebSocket port isn't exposed
      // Use the WebSocket port for all connections, but use the current hostname
      const wsPort = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || '8001';
      socketUrl = isHttps ? `wss://${host}:${wsPort}` : `ws://${host}:${wsPort}`;
      
      console.log('WebSocket connecting to:', socketUrl);
    }

    const isDomain = typeof window !== 'undefined' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1';

    socket = io(socketUrl, {
      // For domain access, prioritize polling since WebSocket ports may not be exposed
      transports: isDomain ? ['polling', 'websocket'] : ['websocket', 'polling'],
      secure: socketUrl.startsWith('wss://'),
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      // Add timeout and retry options for domain connections
      timeout: isDomain ? 10000 : 5000,
      reconnection: true,
      reconnectionAttempts: isDomain ? 3 : 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server at:', socketUrl);
      console.log('Socket ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from WebSocket server. Reason:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('🚨 WebSocket connection error:', error);
      console.log('Attempted to connect to:', socketUrl);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to WebSocket server after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('🔄❌ WebSocket reconnection failed:', error);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const subscribeToLineUpdates = (callback: (data: BidLineUpdateData) => void) => {
  const socket = getSocket();
  socket.on('bidLineUpdate', callback);
  
  return () => {
    socket.off('bidLineUpdate', callback);
  };
};

export const subscribeToNotifications = (userId: string, callback: (data: NotificationData) => void) => {
  const socket = getSocket();
  socket.emit('subscribeToNotifications', userId);
  socket.on('notification', callback);
  
  return () => {
    socket.off('notification', callback);
  };
};

export const emitLineUpdate = (data: BidLineUpdateData) => {
  const socket = getSocket();
  socket.emit('bidLineUpdate', data);
};