/**
 * WebSocket endpoint — NOT supported on Vercel serverless.
 *
 * Raw WebSocket upgrades require a persistent server (e.g. Node.js with socket.io).
 * Deploy socket-server.js separately on Railway/Render/Fly.io and set
 * NEXT_PUBLIC_WS_URL to point at it.
 *
 * This stub prevents build errors while clearly communicating the limitation.
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'WebSocket connections are not supported in this serverless deployment.',
      message: 'Please connect to the standalone socket server at NEXT_PUBLIC_WS_URL.',
    },
    { status: 501 }
  );
}

// Gamification event types — exported for other modules that import from here
export const GAMIFICATION_EVENTS = {
  ACHIEVEMENT_EARNED: 'ACHIEVEMENT_EARNED',
  LEVEL_UP: 'LEVEL_UP',
  CHALLENGE_COMPLETED: 'CHALLENGE_COMPLETED',
  STREAK_UPDATED: 'STREAK_UPDATED',
  PROGRESS_UPDATED: 'PROGRESS_UPDATED',
  LEADERBOARD_UPDATED: 'LEADERBOARD_UPDATED',
};

// No-op helpers — real implementation lives in socket-server.js
export const wss = null;
export function broadcast() {}
export function sendToUser() { return false; }
export function broadcastGamificationEvent() {}

export const gamificationEvents = {
  achievementEarned() {},
  levelUp() {},
  challengeCompleted() {},
  streakUpdated() {},
  progressUpdated() {},
  leaderboardUpdated() {},
};
