import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SequenceData } from '../lib/types';

interface WorkspaceState {
  aiGeneratedSequence: SequenceData | null;
  // Add other workspace-related state here later
  // e.g., aiGeneratedLinkedInPost: string | null;
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
    // Add other reducers here later for other actions
    // e.g., setAiGeneratedLinkedInPost(state, action: PayloadAction<string | null>) { ... }
  },
});

// Export actions and reducer
export const { setAiGeneratedSequence } = workspaceSlice.actions;
export default workspaceSlice.reducer; 