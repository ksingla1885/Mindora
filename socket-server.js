/**
 * Mindora — Socket.IO server with DDoS / abuse protection
 *
 * Protection layers implemented:
 *   1. Connection rate limiting  — max N new connections per IP per window
 *   2. Event rate limiting       — max M events per socket per second
 *   3. Payload size guard        — reject oversized event payloads
 *   4. CORS restriction          — production origin whitelist
 *   5. Connection cap            — hard limit on total simultaneous sockets
 *   6. Automatic disconnection   — abusive sockets are terminated immediately
 */

const { Server }       = require("socket.io");
const { createServer } = require("http");

// ─── Environment ──────────────────────────────────────────────────────────
const PORT        = parseInt(process.env.SOCKET_PORT || "3001", 10);
const NODE_ENV    = process.env.NODE_ENV || "development";
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── DDoS / Abuse protection constants ───────────────────────────────────
const MAX_TOTAL_CONNECTIONS     = 500;    // Hard cap on concurrent sockets
const CONN_RATE_WINDOW_MS       = 60_000; // 1 minute window
const MAX_CONNS_PER_IP_PER_WIN  = 30;    // Max new connections from one IP per window
const MAX_EVENTS_PER_SEC        = 20;    // Max events a single socket may emit/sec
const MAX_PAYLOAD_BYTES         = 64_000; // 64 KB max event payload
const CLEANUP_INTERVAL_MS       = 60_000; // How often to purge stale IP tracking data

// ─── CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins =
  NODE_ENV === "production"
    ? [APP_URL].filter(Boolean)
    : ["*"]; // Allow all in development

// ─── Connection rate-limit tracking (in-memory; per-process) ─────────────
// Map<ip, { count: number, windowStart: number }>
const ipConnections = new Map();

function isConnectionAllowed(ip) {
  const now  = Date.now();
  const data = ipConnections.get(ip) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - data.windowStart > CONN_RATE_WINDOW_MS) {
    data.count       = 0;
    data.windowStart = now;
  }

  data.count++;
  ipConnections.set(ip, data);

  return data.count <= MAX_CONNS_PER_IP_PER_WIN;
}

// Periodically remove entries whose windows have fully expired
setInterval(() => {
  const cutoff = Date.now() - CONN_RATE_WINDOW_MS;
  for (const [ip, data] of ipConnections.entries()) {
    if (data.windowStart < cutoff) ipConnections.delete(ip);
  }
}, CLEANUP_INTERVAL_MS);

// ─── Server setup ─────────────────────────────────────────────────────────
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin:  allowedOrigins,
    methods: ["GET", "POST"],
  },

  // ── Socket.IO transport-level protections ──────────────────────────────
  maxHttpBufferSize: MAX_PAYLOAD_BYTES, // Reject packets larger than 64 KB
  pingTimeout:       30_000,            // Disconnect unresponsive clients in 30 s
  pingInterval:      10_000,            // Heartbeat every 10 s
  connectTimeout:    10_000,            // Must complete handshake within 10 s
});

// ─── Global connection middleware (runs before any event handler) ─────────
io.use((socket, next) => {
  // 1. Enforce total connection cap
  if (io.engine.clientsCount >= MAX_TOTAL_CONNECTIONS) {
    console.warn(`[Socket] Connection cap reached (${MAX_TOTAL_CONNECTIONS}). Rejecting ${socket.id}`);
    return next(new Error("Server at capacity. Please try again later."));
  }

  // 2. Per-IP connection rate limiting
  const ip =
    socket.handshake.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    socket.handshake.address;

  if (!isConnectionAllowed(ip)) {
    console.warn(`[Socket] Rate-limited connection from ${ip}. Rejecting ${socket.id}`);
    return next(new Error("Too many connections from your IP. Please try again later."));
  }

  // Attach resolved IP to socket for later logging
  socket.clientIp = ip;
  next();
});

// ─── Per-socket event rate limiter ────────────────────────────────────────
function applyEventRateLimit(socket) {
  let eventCount    = 0;
  let windowStart   = Date.now();

  // Reset counter every second
  const resetTimer = setInterval(() => {
    eventCount  = 0;
    windowStart = Date.now();
  }, 1_000);

  // Clean up timer when socket disconnects
  socket.on("disconnect", () => clearInterval(resetTimer));

  // Middleware applied to every incoming event on this socket
  socket.use(([event, ...args], next) => {
    eventCount++;

    if (eventCount > MAX_EVENTS_PER_SEC) {
      console.warn(
        `[Socket] Event flood from ${socket.clientIp} (${socket.id}): ` +
        `${eventCount} events/s — disconnecting.`
      );
      socket.disconnect(true);
      return; // Do not call next()
    }

    next();
  });
}

// ─── Connection handler ───────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id} | IP: ${socket.clientIp}`);

  // Apply per-socket event rate limiting
  applyEventRateLimit(socket);

  // ── Join test room ───────────────────────────────────────────────────────
  socket.on("join-test", ({ testId, userId } = {}) => {
    if (!testId || !userId) return;

    // Sanitize inputs before using as room names
    const safeTestId = String(testId).replace(/[^a-zA-Z0-9_-]/g, "");
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");

    socket.join(`test-${safeTestId}`);
    console.log(`[Socket] User ${safeUserId} joined test ${safeTestId}`);

    socket.to(`test-${safeTestId}`).emit("user-joined", { userId: safeUserId });
  });

  // ── Answer update ────────────────────────────────────────────────────────
  socket.on("update-answer", (data) => {
    if (!data?.testId) return;

    const safeTestId = String(data.testId).replace(/[^a-zA-Z0-9_-]/g, "");
    socket.to(`test-${safeTestId}`).emit("test-update", data);
  });

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Client disconnected: ${socket.id} | Reason: ${reason}`);
  });

  // ── Error handler ────────────────────────────────────────────────────────
  socket.on("error", (err) => {
    console.error(`[Socket] Error on ${socket.id}:`, err?.message);
  });
});

// ─── Start server ─────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[Socket] Socket.IO server running on port ${PORT} (${NODE_ENV})`);
  console.log(`[Socket] CORS allowed origins:`, allowedOrigins);
  console.log(`[Socket] Limits — max connections: ${MAX_TOTAL_CONNECTIONS}, events/s per socket: ${MAX_EVENTS_PER_SEC}`);
});
