/**
 * @/lib/websocket/events
 * Stub for server-side gamification event broadcasting.
 * Real implementation lives in socket-server.js (standalone process).
 */

export function broadcastGamificationEvent(eventType, data, targetUserIds = null) {
  // No-op in serverless — real broadcasts happen via the standalone socket server
  console.log(`[WS Events] ${eventType}`, data);
}

export function sendToUser(userId, type, data) {
  return false;
}
