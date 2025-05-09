// send message controller
import { cloudinary } from '../config/cloudinary.js';
import Message from '../models/message.model.js';
import Conversation from '../models/convo.model.js';
import mongoose from 'mongoose';

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        // Upload to cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "chat_images",
        });

        res.status(200).json({ 
            url: result.secure_url,
            message: "Image uploaded successfully" 
        });
    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ message: "Error uploading image" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { receiverId, content, type = 'text' } = req.body;
        const senderId = req.user.userId;

        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                lastMessage: type === 'image' ? '📷 Image' : content,
                lastMessageTime: new Date()
            });
        }

        // Create message
        const message = await Message.create({
            conversationId: conversation._id,
            sender: senderId,
            content,
            type
        });

        // Update conversation
        conversation.lastMessage = type === 'image' ? '📷 Image' : content;
        conversation.lastMessageTime = new Date();
        await conversation.save();

        res.status(201).json({ message });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Error sending message" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.userId;

        let conversation;

        // Check if chatId is a conversation ID or a user ID
        if (mongoose.Types.ObjectId.isValid(chatId)) {
            // First try to find by conversation ID
            conversation = await Conversation.findOne({
                _id: chatId,
                participants: userId
            });

            // If not found, try to find or create by user ID
            if (!conversation) {
                conversation = await Conversation.findOne({
                    participants: { $all: [userId, chatId] }
                });

                if (!conversation) {
                    conversation = await Conversation.create({
                        participants: [userId, chatId],
                        lastMessage: '',
                        lastMessageTime: new Date()
                    });
                }
            }
        } else {
            return res.status(400).json({ message: "Invalid chat ID format" });
        }

        // Get messages for this conversation
        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: 1 })
            .select('content sender type createdAt');

        res.status(200).json({ 
            messages,
            conversationId: conversation._id 
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Error fetching messages" });
    }
};