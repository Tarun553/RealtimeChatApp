import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import messageReducer from "./messageSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        message: messageReducer
    }
})