import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useEffect } from "react";
import { setMessages } from "../redux/messageSlice";

const useGetMessages = () => {
    const dispatch = useDispatch();
    const { selectedChatId } = useSelector((state) => state.user);
    const messages = useSelector((state) => state.message.messages[selectedChatId] || []);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedChatId) return;
            
            try {
                const response = await axios.get(`http://localhost:3000/api/message/${selectedChatId}`, {
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                // Use the conversation ID from the response
                const chatId = response.data.conversationId || selectedChatId;
                
                dispatch(setMessages({
                    chatId,
                    messages: response.data.messages.map(msg => ({
                        ...msg,
                        id: msg._id || msg.id || Date.now()
                    }))
                }));
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [dispatch, selectedChatId]);

    return { messages };
};

export default useGetMessages;