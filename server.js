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

    // Initialize Socket.IO
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join test room
        socket.on('join-test', ({ testId, userId }) => {
            socket.join(`test-${testId}`);
            console.log(`User ${userId} joined test ${testId}`);

            // Notify others in room
            socket.to(`test-${testId}`).emit('user-joined', { userId });
        });

        // Handle answer updates
        socket.on('update-answer', (data) => {
            // Broadcast to proctors or admins monitoring the test
            // For now, we just broadcast to the room (which might include proctors)
            socket.to(`test-${data.testId}`).emit('test-update', data);
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
