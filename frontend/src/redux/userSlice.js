import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  userdata: null,
  otherusers: null,
  chats: [],
  selectedChatId: null,
  messages: {},  // messages by chat ID
  profilePic: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.userdata = action.payload;
    },
    setOtherUsers: (state, action) => {
      state.otherusers = action.payload;
    },
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setSelectedChat: (state, action) => {
      state.selectedChatId = action.payload;
    },
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
    },
    setMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      state.messages[chatId] = messages;
    },
    setProfilePic: (state, action) => {
      state.profilePic = action.payload;
    }
  },
});

export const { setUser, setOtherUsers, setChats, setSelectedChat, addMessage, setMessages, setProfilePic } = userSlice.actions;
export default userSlice.reducer;