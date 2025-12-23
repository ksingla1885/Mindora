import { Server } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import { initTestSession } from '@/lib/websocket/testSession';

// This prevents the route from being bundled with the client
const isDev = process.env.NODE_ENV !== 'production';
const isServer = typeof window === 'undefined';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Initializing Socket.io');
  
  // Create HTTP server and attach Socket.io
  const httpServer = res.socket.server;
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: isDev ? '*' : process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Initialize test session manager
  initTestSession(io);

  // Store the io instance in the server
  res.socket.server.io = io;
  
  // Handle connection events
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket.io initialized');
  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default isServer ? SocketHandler : (req, res) => {
  res.status(405).json({ message: 'Method not allowed' });
};
