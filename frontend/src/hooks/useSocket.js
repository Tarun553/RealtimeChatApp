import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { addMessage } from '../redux/messageSlice';
import { setChats } from '../redux/userSlice';

const SOCKET_URL = 'http://localhost:3000';

export const useSocket = (userId) => {
    const dispatch = useDispatch();
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const pendingChatRef = useRef(null);
    const authTimeoutRef = useRef(null);

    // Log userId changes
    useEffect(() => {
        console.log('useSocket hook received userId:', userId);
    }, [userId]);

    useEffect(() => {
        // Clear any existing timeout
        if (authTimeoutRef.current) {
            clearTimeout(authTimeoutRef.current);
            authTimeoutRef.current = null;
        }

        // Cleanup existing socket if any
        if (socketRef.current) {
            console.log('Cleaning up existing socket connection');
            if (isAuthenticated) {
                socketRef.current.emit('set_status', { status: 'offline' });
            }
            socketRef.current.disconnect();
            setIsConnected(false);
            setIsAuthenticated(false);
        }

        if (!userId) {
            console.log('No userId provided, waiting...');
            return;
        }

        console.log('Creating socket connection with userId:', userId);
        
        // Create socket connection
        socketRef.current = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        // Once connected, authenticate with userId
        socketRef.current.on('connect', () => {
            console.log('Socket connected:', socketRef.current.id);
            setIsConnected(true);
            setIsAuthenticated(false); // Reset authentication state on new connection
            
            console.log('Sending authentication with userId:', userId);
            socketRef.current.emit('authenticate', { userId });

            // Set a timeout for authentication
            authTimeoutRef.current = setTimeout(() => {
                if (!isAuthenticated) {
                    console.log('Authentication timed out, reconnecting...');
                    socketRef.current.disconnect();
                    socketRef.current.connect();
                }
            }, 5000); // 5 second timeout
        });

        socketRef.current.on('authentication_error', (error) => {
            console.error('Authentication error:', error);
            setIsAuthenticated(false);
            setIsConnected(false);
        });

        socketRef.current.on('authentication_success', () => {
            console.log('Successfully authenticated with userId:', userId);
            if (authTimeoutRef.current) {
                clearTimeout(authTimeoutRef.current);
                authTimeoutRef.current = null;
            }
            setIsAuthenticated(true);
            socketRef.current.emit('set_status', { status: 'online' });
            
            // Join pending chat room if any
            if (pendingChatRef.current) {
                console.log('Joining pending chat room:', pendingChatRef.current);
                socketRef.current.emit('join_chat', pendingChatRef.current);
                pendingChatRef.current = null;
            }
        });

        socketRef.current.on('receive_message', (message) => {
            console.log('Received message:', message);
            dispatch(addMessage({
                chatId: message.chatId,
                message: {
                    id: message.id || Date.now(),
                    content: message.content,
                    sender: message.sender,
                    timestamp: message.timestamp || new Date().toISOString(),
                    type: message.type || 'text'
                }
            }));
        });

        socketRef.current.on('user_status_change', ({ userId, status }) => {
            console.log('User status change:', userId, status);
            dispatch(setChats(prevChats => 
                prevChats.map(chat => 
                    chat.id === userId 
                        ? { ...chat, online: status === 'online' }
                        : chat
                )
            ));
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected, isAuthenticated:', isAuthenticated);
            setIsConnected(false);
            setIsAuthenticated(false);
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
            setIsAuthenticated(false);
        });

        // Cleanup on unmount or userId change
        return () => {
            console.log('Cleaning up socket connection for userId:', userId);
            if (authTimeoutRef.current) {
                clearTimeout(authTimeoutRef.current);
                authTimeoutRef.current = null;
            }
            if (socketRef.current) {
                if (isAuthenticated) {
                    socketRef.current.emit('set_status', { status: 'offline' });
                }
                socketRef.current.disconnect();
                setIsConnected(false);
                setIsAuthenticated(false);
            }
        };
    }, [dispatch, userId, isAuthenticated]); // Only recreate socket when userId changes

    // Join chat room
    const joinChat = useCallback((chatId) => {
        console.log('Join chat called with:', { chatId, isAuthenticated, userId });
        if (!socketRef.current) {
            console.error('Cannot join chat: Socket not initialized');
            return;
        }

        if (!isAuthenticated) {
            console.log('Not authenticated yet, storing chat room for later:', chatId);
            pendingChatRef.current = chatId;
            return;
        }

        console.log('Joining chat room immediately:', chatId);
        socketRef.current.emit('join_chat', chatId);
    }, [isAuthenticated, userId]);

    // Send message
    const sendMessage = useCallback(async (chatId, content, type = 'text') => {
        if (!socketRef.current || !isConnected) {
            throw new Error('Socket not connected');
        }

        if (!isAuthenticated) {
            console.error('Not authenticated. Current state:', { userId, isConnected, isAuthenticated });
            throw new Error('User not authenticated');
        }

        const messageData = {
            chatId,
            content,
            type,
            sender: userId,
            timestamp: new Date().toISOString()
        };
        
        console.log('Sending message:', messageData);
        socketRef.current.emit('send_message', messageData);
    }, [isConnected, isAuthenticated, userId]);

    return { 
        sendMessage, 
        joinChat, 
        socket: socketRef.current, 
        isConnected,
        isAuthenticated 
    };
};
