// magnecruit_frontend\src\store\workspaceSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Jobs, JobsUpdatePayload } from '../lib/types';

export type WorkspaceView = | "actions" | "job-sections" | "linkedin-post-creation" | "interview-scheduling" | "candidate-management" | "follow-up" | "submit-expense";

// Interface for the Workspace State
interface WorkspaceState {
  activeView: WorkspaceView;
  aiGeneratedJob: Jobs | null;
  updatedFields: string[] | null;
  lastUpdateTime: number | null;
}

// Interface for the initial state of the Workspace
const initialState: WorkspaceState = {
  activeView: "actions",
  aiGeneratedJob: null,
  updatedFields: null,
  lastUpdateTime: null,
};

// Create the Workspace Slice
const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveView(state, action: PayloadAction<WorkspaceView>) {
        state.activeView = action.payload;
    },
    setAiGeneratedJobSections(state, action: PayloadAction<JobsUpdatePayload | null>) {
      if (action.payload) {
        const { updated_field_keys, ...jobSectionsData } = action.payload;
        state.aiGeneratedJob = jobSectionsData as Jobs;
        state.updatedFields = updated_field_keys || null;
        state.lastUpdateTime = Date.now();
      } else {
        state.aiGeneratedJob = null;
        state.updatedFields = null;
        state.lastUpdateTime = null;
      }
    },
    clearUpdatedFieldHighlights(state) {
      state.updatedFields = null;
    }
  },
});

export const { setActiveView, setAiGeneratedJobSections, clearUpdatedFieldHighlights } = workspaceSlice.actions;
export default workspaceSlice.reducer; 