// magnecruit_frontend\src\store\chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Messages } from '../lib/types';

// Interface for the Chat State
interface ChatState {
  messages: Messages[];
  selectedConversationId: number | null;
}

// Initial State for the Chat
const initialState: ChatState = {
    messages: [],
    selectedConversationId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Messages[]>) {
      state.messages = action.payload;
    },
    clearMessages(state){
        state.messages = [];
    },
    addMessages(state, action: PayloadAction<Messages>){
      state.messages.push(action.payload);
    },
    setSelectedConversation(state, action: PayloadAction<number | null>) {
        state.selectedConversationId = action.payload;
        if (state.selectedConversationId !== action.payload) {
            state.messages = [];
        }
    }
  },
});

export const { setMessages, addMessages, clearMessages, setSelectedConversation } = chatSlice.actions;
export default chatSlice.reducer; 