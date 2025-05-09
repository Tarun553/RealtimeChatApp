import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import UserRouter from "./routes/user.route.js";
import MessageRouter from "./routes/message.route.js";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: "http://localhost:5173"
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/user', UserRouter);
app.use('/api/message', MessageRouter);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('authenticate', ({ userId }) => {
        if (!userId) {
            socket.emit('authentication_error', 'No userId provided');
            return;
        }

        // Store user's socket connection
        socket.userId = userId;
        socket.emit('authentication_success');
        
        // Broadcast user's online status
        socket.broadcast.emit('user_status_change', { 
            userId, 
            status: 'online' 
        });
    });

    socket.on('join_chat', (chatId) => {
        if (!socket.userId) {
            socket.emit('error', 'Not authenticated');
            return;
        }
        socket.join(chatId);
        console.log(`User ${socket.userId} joined chat ${chatId}`);
    });

    socket.on('send_message', (messageData) => {
        if (!socket.userId) {
            socket.emit('error', 'Not authenticated');
            return;
        }
        console.log('Message received:', messageData);
        io.to(messageData.chatId).emit('receive_message', messageData);
    });

    socket.on('set_status', ({ status }) => {
        if (!socket.userId) {
            socket.emit('error', 'Not authenticated');
            return;
        }
        socket.broadcast.emit('user_status_change', {
            userId: socket.userId,
            status
        });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        if (socket.userId) {
            socket.broadcast.emit('user_status_change', {
                userId: socket.userId,
                status: 'offline'
            });
        }
    });
});

connectDb();

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
