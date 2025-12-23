import { WebSocketServer } from 'ws';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// In-memory store for active connections
const connections = new Set();
let metricsInterval;

// Function to broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  connections.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  });
}

// Mock function to generate system metrics
function generateMockMetrics() {
  return {
    type: 'metrics',
    data: {
      timestamp: Date.now(),
      cpu: {
        usage: Math.min(100, Math.max(0, 45 + (Math.random() * 10 - 5))),
        load: [
          Math.random() * 2 + 1,
          Math.random() * 2 + 1,
          Math.random() * 2 + 1
        ].map(n => parseFloat(n.toFixed(2))),
      },
      memory: {
        used: 9.8 + (Math.random() * 2 - 1),
        free: 6.2 - (Math.random() * 0.5),
        usage: 61.2 + (Math.random() * 5 - 2.5),
      },
      network: {
        in: (Math.random() * 5 + 10).toFixed(2),
        out: (Math.random() * 3 + 5).toFixed(2),
        connections: Math.floor(Math.random() * 50) + 100,
      },
      services: [
        { name: 'Web Server', status: 'up', responseTime: 45 + Math.random() * 10 },
        { name: 'Database', status: 'up', responseTime: 12 + Math.random() * 5 },
        { 
          name: 'Cache', 
          status: Math.random() > 0.2 ? 'up' : 'degraded', 
          responseTime: 8 + Math.random() * 3 
        },
        { name: 'Background Jobs', status: 'up', responseTime: 2 + Math.random() },
        { name: 'Search', status: Math.random() > 0.8 ? 'down' : 'up', responseTime: Math.random() > 0.8 ? 0 : 15 },
      ],
    },
  };
}

// Start broadcasting metrics if not already started
function startBroadcasting() {
  if (!metricsInterval) {
    metricsInterval = setInterval(() => {
      broadcast(generateMockMetrics());
    }, 5000); // Update every 5 seconds
  }
}

// Stop broadcasting when no clients are connected
function stopBroadcasting() {
  if (connections.size === 0 && metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

export default function handler(req, res) {
  // Check if WebSocket upgrade request
  if (req.headers.upgrade !== 'websocket') {
    return res.status(426).json({ error: 'Upgrade Required' });
  }

  // Get the session
  getServerSession(req, res, authOptions)
    .then(session => {
      // Check if user is admin
      if (!session || session.user.role !== 'ADMIN') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Proceed with WebSocket upgrade
      if (!res.socket.server.wss) {
        // Create WebSocket server if it doesn't exist
        const wss = new WebSocketServer({ noServer: true });
        
        wss.on('connection', (ws) => {
          // Add to connections set
          connections.add(ws);
          startBroadcasting();
          
          // Send initial data
          ws.send(JSON.stringify({
            type: 'connection',
            status: 'connected',
            message: 'Connected to system health service',
          }));
          
          // Handle messages from client
          ws.on('message', (message) => {
            try {
              const data = JSON.parse(message);
              
              if (data.type === 'request' && data.metric) {
                // Handle specific metric requests
                ws.send(JSON.stringify({
                  type: 'metrics',
                  metric: data.metric,
                  data: generateMockMetrics().data[data.metric],
                }));
              }
            } catch (error) {
              console.error('Error processing message:', error);
            }
          });
          
          // Handle client disconnection
          ws.on('close', () => {
            connections.delete(ws);
            stopBroadcasting();
          });
          
          // Handle errors
          ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            connections.delete(ws);
            stopBroadcasting();
          });
        });
        
        // Store WebSocket server instance
        res.socket.server.wss = wss;
      }
      
      // Handle the upgrade
      const { wss } = res.socket.server;
      
      wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
        wss.emit('connection', ws, req);
      });
    })
    .catch(error => {
      console.error('Error in WebSocket auth:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    });
}

// Configure Next.js to not parse the body
// This is important for WebSocket upgrade requests
export const config = {
  api: {
    bodyParser: false,
  },
};
