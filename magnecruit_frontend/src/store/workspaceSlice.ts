// magnecruit_frontend\src\store\workspaceSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SequenceData } from '../lib/types';

interface WorkspaceState {
  aiGeneratedSequence: SequenceData | null;
}

const initialState: WorkspaceState = {
  aiGeneratedSequence: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setAiGeneratedSequence(state, action: PayloadAction<SequenceData | null>) {
      console.log("Redux Reducer: Setting AI Generated Sequence", action.payload);
      state.aiGeneratedSequence = action.payload;
    },
  },
});

export const { setAiGeneratedSequence } = workspaceSlice.actions;
export default workspaceSlice.reducer; 