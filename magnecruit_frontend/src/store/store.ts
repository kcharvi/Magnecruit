// magnecruit_frontend\src\store\store.ts
import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './workspaceSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 