// magnecruit_frontend\src\store\chatSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../lib/types';

interface ChatState {
  messages: Message[];
  selectedConversationId: number | null;
}

const initialState: ChatState = {
    messages: [],
    selectedConversationId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Message[]>) {
      console.log("Redux Reducer: Setting Messages", action.payload);
      state.messages = action.payload;
    },
    addMessage(state, action: PayloadAction<Message>){
        state.messages.push(action.payload);
        console.log("Redux Reducer: Added Message", action.payload);
    },
    clearMessages(state){
        console.log("Redux Reducer: Clearing Messages");
        state.messages = [];
    },
    setSelectedConversation(state, action: PayloadAction<number | null>) {
        console.log("Redux Reducer: Setting Selected Conversation ID", action.payload);
        state.selectedConversationId = action.payload;
        if (state.selectedConversationId !== action.payload) {
             state.messages = [];
             console.log("Redux Reducer: Cleared messages due to conversation change.");
        }
    }
  },
});

export const { setMessages, addMessage, clearMessages, setSelectedConversation } = chatSlice.actions;
export default chatSlice.reducer; 