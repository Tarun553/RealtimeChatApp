import express from 'express';
import { uploadImage, sendMessage, getMessages } from '../controllers/message.controller.js';
import isAuth from '../middlewares/isauth.js';
import upload from '../middlewares/upload.js';
const MessageRouter = express.Router();

// Image upload route
MessageRouter.post('/upload', isAuth, upload.single('image'), uploadImage);

// Message routes
MessageRouter.post('/send', isAuth, sendMessage);
MessageRouter.get('/:chatId', isAuth, getMessages);

export default MessageRouter;
