const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://100.99.29.70:3004',
      // Allow any local network access for development
      /^http:\/\/(\d{1,3}\.){3}\d{1,3}:\d+$/,
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const userSockets = new Map();

// HTTP endpoints for health check and server-side emissions
httpServer.on('request', (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      connectedClients: io.engine.clientsCount 
    }));
  } else if (url.pathname === '/emit-update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { event, data } = JSON.parse(body);
        
        if (event === 'bidLineUpdate') {
          // Emit to all connected clients
          io.emit('bidLineUpdate', data);
          console.log('Server emitted bid line update:', data);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid event type' }));
        }
      } catch (error) {
        console.error('Error processing emit request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('subscribeToNotifications', (userId) => {
    userSockets.set(userId, socket.id);
    socket.join(`user-${userId}`);
    console.log(`User ${userId} subscribed to notifications`);
  });

  socket.on('bidLineUpdate', async (data) => {
    // Broadcast bid line updates to all connected clients
    socket.broadcast.emit('bidLineUpdate', data);

    // If a line was claimed, notify users who favorited it
    if (data.status === 'TAKEN' && data.bidLineId) {
      try {
        const favorites = await prisma.favoriteLine.findMany({
          where: { bidLineId: data.bidLineId },
          include: { 
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                language: true,
                phoneNumber: true,
                emailNotifications: true,
                smsNotifications: true
              }
            },
            bidLine: {
              include: {
                operation: true
              }
            }
          },
        });

        for (const favorite of favorites) {
          if (favorite.userId !== data.claimedBy) {
            // Get remaining favorite lines for this user with details
            const remainingFavoriteLines = await prisma.favoriteLine.findMany({
              where: {
                userId: favorite.userId,
                bidLine: {
                  status: 'AVAILABLE'
                }
              },
              include: {
                bidLine: {
                  include: {
                    operation: true
                  }
                }
              }
            });

            // Create enhanced notification message
            const operationName = data.operationName || favorite.bidLine.operation?.name;
            const isFrench = favorite.user.language === 'FR';
            
            const baseMessage = isFrench
              ? `${operationName} - Ligne ${data.lineNumber} a été prise`
              : `${operationName} - Line ${data.lineNumber} has been taken`;
            
            let remainingMessage = '';
            if (remainingFavoriteLines.length > 0) {
              const availableLines = remainingFavoriteLines
                .map(fl => `${fl.bidLine.operation.name} - ${isFrench ? 'Ligne' : 'Line'} ${fl.bidLine.lineNumber}`)
                .join(', ');
              
              remainingMessage = isFrench 
                ? `. Favorites disponibles: ${availableLines}`
                : `. Available favorites: ${availableLines}`;
            } else {
              remainingMessage = isFrench ? ' (aucune favorite restante)' : ' (no favorites remaining)';
            }

            const fullMessage = baseMessage + remainingMessage;

            const notification = {
              type: 'LINE_TAKEN',
              title: isFrench 
                ? 'Ligne favorite prise' 
                : 'Favorite Line Taken',
              message: fullMessage,
              bidLineId: data.bidLineId,
              timestamp: new Date().toISOString(),
              remainingFavorites,
            };

            // Send WebSocket notification
            io.to(`user-${favorite.userId}`).emit('notification', notification);

            // Store notification in database
            await prisma.notification.create({
              data: {
                userId: favorite.userId,
                type: 'LINE_TAKEN',
                title: notification.title,
                message: notification.message,
                data: { 
                  bidLineId: data.bidLineId,
                  operationName,
                  remainingFavorites 
                },
              },
            });

            // Send email notification if enabled
            if (favorite.user.emailNotifications && favorite.user.email) {
              try {
                await fetch(`http://localhost:${process.env.PORT || 3000}/api/admin/notifications/send-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'email',
                    recipient: favorite.user.email,
                    subject: notification.title,
                    message: fullMessage,
                    language: favorite.user.language
                  })
                });
              } catch (emailError) {
                console.error('Failed to send email notification:', emailError);
              }
            }

            // Send SMS notification if enabled and phone number exists
            if (favorite.user.smsNotifications && favorite.user.phoneNumber) {
              try {
                await fetch(`http://localhost:${process.env.PORT || 3000}/api/admin/notifications/send-notification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'sms',
                    recipient: favorite.user.phoneNumber,
                    message: fullMessage,
                    language: favorite.user.language
                  })
                });
              } catch (smsError) {
                console.error('Failed to send SMS notification:', smsError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error sending notifications:', error);
      }
    }
  });

  socket.on('disconnect', () => {
    // Remove user from userSockets map
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

const PORT = process.env.WEBSOCKET_PORT || 3001;
const HOST = process.env.WEBSOCKET_HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`WebSocket server running on ${HOST}:${PORT}`);
  console.log(`Health check available at http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  httpServer.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  httpServer.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});