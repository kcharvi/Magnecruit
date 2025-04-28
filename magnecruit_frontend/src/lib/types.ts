// magnecruit_frontend\src\lib\types.ts

export interface SequenceStepData {
    id: number;
    step_number: number;
    heading: string;
    body: string;
}

export interface SequenceData {
    id?: number;
    conversation_id?: number;
    user_id?: number;
    jobrole: string; 
    description: string;
    steps: SequenceStepData[];
    created_at?: string;
}

export interface User {
    id: number;
    username: string | null;
    email: string;
}

export interface ConversationSummary {
    id: number;
    title: string | null;
    created_at: string;
}

// Add Message type definition
export interface Message {
  id: string | number;
  sender: "user" | "ai";
  content: string;
  timestamp?: string;
  conversation_id?: number; // Add conversation ID
}

// Add other shared types as needed 