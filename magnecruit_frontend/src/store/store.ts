import { configureStore } from '@reduxjs/toolkit';
import workspaceReducer from './workspaceSlice';

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    // Add other reducers here if you create more slices
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 