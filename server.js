const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Helper to parse cookies from headers
    function parseCookies(cookieHeader) {
        const list = {};
        if (!cookieHeader) return list;
        cookieHeader.split(";").forEach((cookie) => {
            const parts = cookie.split("=");
            list[parts.shift().trim()] = decodeURIComponent(parts.join("="));
        });
        return list;
    }

    let decodeJWT;
    async function decodeToken(token, secret) {
        if (!decodeJWT) {
            const { decode } = await import("next-auth/jwt");
            decodeJWT = decode;
        }
        return await decodeJWT({ token, secret });
    }

    // Initialize Socket.IO
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Authenticate User using NextAuth cookie / JWT
    io.use(async (socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie || "");
            const token = cookies["next-auth.session-token"] || cookies["__Secure-next-auth.session-token"];

            if (!token) {
                console.warn(`[Socket Dev] Connection rejected: No session token cookie found for socket ${socket.id}`);
                return next(new Error("Authentication required"));
            }

            const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
            const decoded = await decodeToken(token, secret);

            if (!decoded) {
                console.warn(`[Socket Dev] Connection rejected: Invalid JWT token for socket ${socket.id}`);
                return next(new Error("Invalid session"));
            }

            socket.user = decoded; // Attach user payload to socket
            next();
        } catch (err) {
            console.error(`[Socket Dev] Authentication error for socket ${socket.id}:`, err.message);
            return next(new Error("Authentication failed"));
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join test room
        socket.on('join-test', ({ testId, userId }) => {
            if (!testId || !userId) return;

            // Sanitize inputs before using as room names
            const safeTestId = String(testId).replace(/[^a-zA-Z0-9_-]/g, "");
            const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");

            // Access control check: Only ADMIN, TEACHER or the owner of the user account is allowed to join this test room
            const userRole = socket.user?.role?.toUpperCase();
            if (
                userRole !== "ADMIN" &&
                userRole !== "TEACHER" &&
                safeUserId !== socket.user?.id &&
                safeUserId !== socket.user?.sub
            ) {
                console.warn(`[Socket Dev] Blocked room join: User ${socket.user?.id || socket.user?.sub} tried to join as ${safeUserId}`);
                return;
            }

            socket.join(`test-${safeTestId}`);
            console.log(`User ${safeUserId} joined test ${safeTestId}`);

            // Notify others in room
            socket.to(`test-${safeTestId}`).emit('user-joined', { userId: safeUserId });
        });

        // Handle answer updates
        socket.on('update-answer', (data) => {
            if (!data?.testId) return;
            const safeTestId = String(data.testId).replace(/[^a-zA-Z0-9_-]/g, "");
            // Broadcast to proctors or admins monitoring the test
            socket.to(`test-${safeTestId}`).emit('test-update', data);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> WebSocket server running on http://${hostname}:${port}`);
    });
});
