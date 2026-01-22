const { Server } = require("socket.io");
const { createServer } = require("http");

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join test room
    socket.on("join-test", ({ testId, userId }) => {
        socket.join(`test-${testId}`);
        console.log(`User ${userId} joined test ${testId}`);

        // Notify others in room
        socket.to(`test-${testId}`).emit("user-joined", { userId });
    });

    // Handle answer updates
    socket.on("update-answer", (data) => {
        // Broadcast to others (proctors/admins)
        socket.to(`test-${data.testId}`).emit("test-update", data);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});
