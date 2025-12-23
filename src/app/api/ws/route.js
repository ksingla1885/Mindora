import { WebSocketServer } from 'ws';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { verify } from 'jsonwebtoken';

// This is a placeholder for the WebSocket server instance
let wss = null;

// Store connected clients by user ID
const clients = new Map();

// Store active subscriptions by user ID and event type
const subscriptions = new Map();

// Gamification event types
const GAMIFICATION_EVENTS = {
  ACHIEVEMENT_EARNED: 'ACHIEVEMENT_EARNED',
  LEVEL_UP: 'LEVEL_UP',
  CHALLENGE_COMPLETED: 'CHALLENGE_COMPLETED',
  STREAK_UPDATED: 'STREAK_UPDATED',
  PROGRESS_UPDATED: 'PROGRESS_UPDATED',
  LEADERBOARD_UPDATED: 'LEADERBOARD_UPDATED'
};

// Helper to verify JWT token
async function verifyToken(token) {
  try {
    return verify(token, process.env.NEXTAUTH_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function GET(request) {
  if (!wss) {
    // This will be called only once when the first WebSocket connection is established
    wss = new WebSocketServer({ noServer: true });

    // Handle new WebSocket connections
    wss.on('connection', (ws, request) => {
      const session = request.session;
      
      // Store the WebSocket connection with the user ID as the key
      if (session?.user?.id) {
        const userId = session.user.id;
        if (!clients.has(userId)) {
          clients.set(userId, new Set());
        }
        clients.get(userId).add(ws);

        // Handle messages from the client
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            
            // Handle authentication
            if (data.type === 'AUTH') {
              const decoded = await verifyToken(data.token);
              if (decoded && decoded.sub) {
                ws.userId = decoded.sub;
                ws.send(JSON.stringify({ 
                  type: 'AUTH_SUCCESS',
                  data: { userId: decoded.sub }
                }));
                
                // Initialize user's subscriptions if not exists
                if (!subscriptions.has(decoded.sub)) {
                  subscriptions.set(decoded.sub, new Set());
                }
                
                // Subscribe to default gamification events
                Object.values(GAMIFICATION_EVENTS).forEach(event => {
                  subscriptions.get(decoded.sub).add(event);
                });
                
                return;
              } else {
                ws.close(1008, 'Invalid token');
                return;
              }
            }
            
            // Only process other messages if authenticated
            if (!ws.userId) {
              ws.close(1008, 'Not authenticated');
              return;
            }
            
            // Handle subscription management
            if (data.type === 'SUBSCRIBE' && data.events) {
              const userSubs = subscriptions.get(ws.userId) || new Set();
              data.events.forEach(event => userSubs.add(event));
              subscriptions.set(ws.userId, userSubs);
              return;
            }
            
            if (data.type === 'UNSUBSCRIBE' && data.events) {
              const userSubs = subscriptions.get(ws.userId);
              if (userSubs) {
                data.events.forEach(event => userSubs.delete(event));
              }
              return;
            }
            
          } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
              type: 'ERROR',
              error: 'Invalid message format'
            }));
          }
        });

        // Handle client disconnection
        ws.on('close', () => {
          if (ws.userId && clients.has(ws.userId)) {
            clients.get(ws.userId).delete(ws);
            if (clients.get(ws.userId).size === 0) {
              clients.delete(ws.userId);
            }
          }
        });
      } else {
        // Close connection if not authenticated
        ws.close(1008, 'Unauthorized');
      }
    });
  }

  // Get the session
  const session = await getServerSession(authOptions);
  
  // This is a WebSocket upgrade request, so we need to handle it with the WebSocket server
  if (request.headers.get('upgrade') === 'websocket') {
    // Store the session with the request for later use
    request.session = session;
    
    // Handle the WebSocket upgrade
    const { 0: response, 1: socket, 2: head } = new Response(null, {
      webSocket: null,
    });
    
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
    
    return response;
  }

  // Return 404 for non-WebSocket requests
  return new NextResponse('Not found', { status: 404 });
}

/**
 * Broadcast a message to all connected clients
 * @param {string} type - Event type
 * @param {object} data - Event data
 * @param {boolean} [includeSelf=false] - Whether to include the sender
 */
function broadcast(type, data, includeSelf = false) {
  if (!wss) return;
  
  const message = JSON.stringify({ type, data });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && (includeSelf || client !== this)) {
      client.send(message);
    }
  });
}

/**
 * Send a message to a specific user
 * @param {string} userId - Target user ID
 * @param {string} type - Event type
 * @param {object} data - Event data
 * @returns {boolean} Whether the message was sent to at least one client
 */
function sendToUser(userId, type, data) {
  if (!wss || !clients.has(userId)) return false;
  
  const message = JSON.stringify({ type, data });
  let sent = false;
  
  for (const client of clients.get(userId)) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent = true;
    }
  }
  
  return sent;
}

/**
 * Broadcast a gamification event to all subscribed users
 * @param {string} eventType - Type of gamification event
 * @param {object} data - Event data
 * @param {string|string[]} [targetUserIds] - Specific user IDs to target (optional)
 */
function broadcastGamificationEvent(eventType, data, targetUserIds = null) {
  if (!wss) return;
  
  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
  
  const targetUsers = targetUserIds 
    ? Array.isArray(targetUserIds) ? targetUserIds : [targetUserIds]
    : Array.from(subscriptions.keys());
  
  targetUsers.forEach(userId => {
    const userSubs = subscriptions.get(userId);
    if (userSubs && userSubs.has(eventType)) {
      sendToUser(userId, eventType, data);
    }
  });
}

// Helper function to send a message to a specific user
function sendToUser(userId, type, data) {
  if (!wss || !clients.has(userId)) return false;
  
  const message = JSON.stringify({ type, data });
  let sent = false;
  
  clients.get(userId).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent = true;
    }
  });
  
  return sent;
}

// Export the WebSocket server instance and helper functions
export { 
  wss, 
  broadcast, 
  sendToUser, 
  broadcastGamificationEvent,
  GAMIFICATION_EVENTS 
};

// Export gamification event emitters
export const gamificationEvents = {
  achievementEarned(userId, badge) {
    broadcastGamificationEvent(
      GAMIFICATION_EVENTS.ACHIEVEMENT_EARNED, 
      { badge, userId },
      userId
    );
  },
  
  levelUp(userId, { newLevel, xpEarned, totalXp }) {
    broadcastGamificationEvent(
      GAMIFICATION_EVENTS.LEVEL_UP,
      { newLevel, xpEarned, totalXp, userId },
      userId
    );
  },
  
  challengeCompleted(userId, { challenge, reward }) {
    broadcastGamificationEvent(
      GAMIFICATION_EVENTS.CHALLENGE_COMPLETED,
      { challenge, reward, userId },
      userId
    );
  },
  
  streakUpdated(userId, { currentStreak, previousStreak }) {
    broadcastGamificationEvent(
      GAMIFICATION_EVENTS.STREAK_UPDATED,
      { currentStreak, previousStreak, userId },
      userId
    );
  },
  
  progressUpdated(userId, progressData) {
    broadcastGamificationEvent(
      GAMIFICATION_EVENTS.PROGRESS_UPDATED,
      { ...progressData, userId },
      userId
    );
  },
  
  leaderboardUpdated(leaderboardData) {
    broadcastGamificationEvent(
      GAMIFICATION_EVENTS.LEADERBOARD_UPDATED,
      { leaderboard: leaderboardData, updatedAt: new Date().toISOString() }
    );
  }
};
