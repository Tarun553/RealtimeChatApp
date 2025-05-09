import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BiMessageDetail, BiGroup, BiSearch, BiDotsHorizontalRounded, BiSend, BiArrowBack, BiLogOut, BiSmile, BiImage } from 'react-icons/bi'
import EmojiPicker from 'emoji-picker-react'
import { setSelectedChat, setChats, setUser } from '../redux/userSlice'
import { addMessage } from '../redux/messageSlice'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useGetMessages from '../hooks/useGetMessages'
import { useSocket } from '../hooks/useSocket'
import toast from 'react-hot-toast'

function Home() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { userdata, otherusers, chats, selectedChatId } = useSelector((state) => state.user)
    const messageState = useSelector((state) => state.message)
    
    // Check authentication and socket connection
    useEffect(() => {
        if (!userdata) {
            navigate('/login')
            return
        }
    }, [userdata, navigate])

    const { sendMessage, joinChat, isConnected, isAuthenticated } = useSocket(userdata?.id)
    useGetMessages()

    const [messageInput, setMessageInput] = useState('')
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768)
    const [searchQuery, setSearchQuery] = useState('')
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const fileInputRef = useRef(null)
    const emojiPickerRef = useRef(null)
    const selectedChat = chats.find(chat => chat.id === selectedChatId)
    const currentChatMessages = messageState.messages[selectedChatId] || []

    // Initialize chats from other users
    useEffect(() => {
        if (otherusers && otherusers.length > 0) {
            const initialChats = otherusers.map(user => ({
                id: user.id,
                name: user.name,
                username: user.username,
                online: user.online,
                lastMessage: user.lastMessage,
                lastMessageTime: user.lastMessageTime,
                unreadCount: user.unreadCount
            }))
            dispatch(setChats(initialChats))
        }
    }, [otherusers, dispatch])

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Join chat room when selected and connected
    useEffect(() => {
        if (selectedChatId && isConnected) {
            console.log('Joining chat room:', selectedChatId);
            joinChat(selectedChatId);
        }
    }, [selectedChatId, isConnected, joinChat]);

    // Show connection status
    useEffect(() => {
        if (userdata && !isConnected) {
            toast.error('Connecting to chat server...');
        } else if (userdata && isConnected && !isAuthenticated) {
            toast.error('Authenticating...');
        }
    }, [userdata, isConnected, isAuthenticated]);

    const handleSendMessage = async () => {
        if (!selectedChatId) {
            toast.error('Please select a chat first');
            return;
        }

        if (!isAuthenticated) {
            toast.error('Please wait, connecting to chat server...');
            return;
        }

        if (!messageInput.trim()) return;

        try {
            const newMessage = {
                id: Date.now(),
                content: messageInput,
                sender: userdata.id,
                timestamp: new Date().toISOString(),
                type: 'text'
            };

            // Send through socket first
            await sendMessage(selectedChatId, messageInput, 'text');

            // Update UI
            dispatch(addMessage({
                chatId: selectedChatId,
                message: newMessage
            }));

            // Clear input
            setMessageInput('');
            setShowEmojiPicker(false);
        } catch (error) {
            console.error('Failed to send message:', error);
            if (error.message === 'User not authenticated') {
                toast.error('Connection lost. Reconnecting...');
            } else {
                toast.error('Failed to send message. Please try again.');
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            const formData = new FormData()
            formData.append('image', file)

            const uploadResponse = await axios.post('http://localhost:3000/api/message/upload', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (uploadResponse.status === 200) {
                const imageUrl = uploadResponse.data.url

                const newMessage = {
                    id: Date.now(),
                    content: imageUrl,
                    type: 'image',
                    sender: userdata.id,
                    timestamp: new Date().toISOString(),
                }

                // Update UI immediately
                dispatch(addMessage({
                    chatId: selectedChatId,
                    message: newMessage
                }))

                // Send through socket
                sendMessage(selectedChatId, imageUrl, 'image')

                // Update last message in chat list
                const updatedChats = chats.map(chat => 
                    chat.id === selectedChatId 
                        ? { 
                            ...chat, 
                            lastMessage: '📷 Image',
                            lastMessageTime: new Date().toISOString()
                        }
                        : chat
                )
                dispatch(setChats(updatedChats))
            }
        } catch (error) {
            console.error('Error uploading image:', error)
        }
    }

    const handleBackToList = () => {
        dispatch(setSelectedChat(null))
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const onEmojiClick = (emojiObject) => {
        setMessageInput(prev => prev + emojiObject.emoji)
        setShowEmojiPicker(false)
    }

    // Filter chats based on search query
    const filteredChats = chats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const handleLogout = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/auth/logout', {}, {
                withCredentials: true
            })
            if (response.status === 200) {
                localStorage.removeItem('token')
                dispatch(setUser(null))
                dispatch(setChats([]))
                dispatch(setSelectedChat(null))
                navigate('/login')
            }
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <div className="h-screen flex bg-gray-100">
            {/* Sidebar */}
            <AnimatePresence>
                {(!isMobileView || !selectedChatId) && (
                    <motion.div 
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-full md:w-80 bg-white border-r flex flex-col md:relative fixed inset-0 z-10"
                    >
                        {/* User Profile Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div onClick={() => navigate('/profile')} className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                        {/* <span className="text-indigo-600 font-medium">{userdata?.name?.[0]}</span> */}
                                        <img src={userdata?.profilePic} alt="Profile" className="w-full h-full rounded-full cursor-pointer" />
                                    </div>
                                    <h2 className="font-semibold">{userdata?.name || 'User'}</h2>
                                </div>
                                <button className="text-gray-500 hover:text-gray-700">
                                    <BiDotsHorizontalRounded size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4">
                            <div className="relative">
                                <BiSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search messages"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredChats.length > 0 ? (
                                filteredChats.map((chat) => (
                                    <motion.div
                                        key={chat.id}
                                        whileHover={{ backgroundColor: '#F3F4F6' }}
                                        onClick={() => dispatch(setSelectedChat(chat.id))}
                                        className={`p-3 cursor-pointer ${selectedChatId === chat.id ? 'bg-gray-100' : ''}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <img src={chat.profilePic} alt="Profile" className="w-full h-full rounded-full cursor-pointer" />
                                                </div>
                                                {chat.online && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium truncate">{chat.name || 'User'}</h3>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        {chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {chat.lastMessage || 'Start a conversation'}
                                                    </p>
                                                    {chat.unreadCount > 0 && (
                                                        <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                                                            {chat.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    {searchQuery ? 'No matches found' : 'No conversations yet'}
                                </div>
                            )}
                        </div>

                        {/* Bottom Navigation */}
                        <div className="p-4 border-t bg-white">
                            <div className="flex justify-around">
                                <button className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full">
                                    <BiMessageDetail size={24} />
                                </button>
                                <button className="text-gray-500 hover:bg-gray-50 p-2 rounded-full">
                                    <BiGroup size={24} />
                                </button>
                                {/* add logout button */}
                                <button onClick={handleLogout} className="text-gray-500 hover:bg-gray-50 p-2 rounded-full">
                                    <BiLogOut size={24} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <AnimatePresence>
                {(!isMobileView || selectedChatId) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col bg-white md:relative fixed inset-0"
                    >
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="bg-white border-b p-4">
                                    <div className="flex items-center space-x-3">
                                        {isMobileView && (
                                            <button 
                                                onClick={handleBackToList}
                                                className="p-2 -ml-2 rounded-full hover:bg-gray-100"
                                            >
                                                <BiArrowBack size={20} />
                                            </button>
                                        )}
                                        <div className="relative">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <img src={selectedChat.profilePic} alt="Profile" className="w-full h-full rounded-full cursor-pointer" />
                                            </div>
                                            {selectedChat.online && (
                                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{selectedChat.name}</h3>
                                            <p className="text-xs text-gray-500">{selectedChat.online ? 'Online' : 'Offline'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {currentChatMessages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.sender === userdata.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`rounded-lg p-3 max-w-[70%] md:max-w-[50%] ${
                                                msg.sender === userdata.id 
                                                    ? 'bg-indigo-600 text-white' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {msg.type === 'image' ? (
                                                    <img 
                                                        src={msg.content} 
                                                        alt="Shared" 
                                                        className="rounded-lg max-w-full h-auto"
                                                    />
                                                ) : (
                                                    <p className="break-words">{msg.content}</p>
                                                )}
                                                <span className={`text-xs mt-1 block ${
                                                    msg.sender === userdata.id ? 'text-indigo-100' : 'text-gray-500'
                                                }`}>
                                                    {formatTime(msg.timestamp)}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Message Input */}
                                <div className="p-4 bg-white border-t">
                                    <div className="flex items-center space-x-2 relative">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100"
                                            >
                                                <BiSmile size={24} />
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100"
                                            >
                                                <BiImage size={24} />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleSendMessage}
                                            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700"
                                        >
                                            <BiSend size={20} />
                                        </motion.button>
                                        {showEmojiPicker && (
                                            <div 
                                                ref={emojiPickerRef}
                                                className="absolute bottom-full left-0 mb-2"
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={onEmojiClick}
                                                    width={280}
                                                    height={350}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-4">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <BiMessageDetail size={40} className="text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900">Select a chat to start messaging</h3>
                                    <p className="text-gray-500 mt-2">Choose from your existing conversations</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Home