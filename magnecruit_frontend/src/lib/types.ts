// magnecruit_frontend\src\lib\types.ts

export interface Users {
    id: number;
    username: string | null;
    email: string;
}

export interface Conversations {
    id: number;
    title: string | null;
    created_at: string;
}

export interface Messages {
    id: string | number;
    sender: "user" | "ai" | "system";
    content: string;
    timestamp?: string;
    conversation_id?: number;
  }
  
export interface Jobs {
    id?: number;
    conversation_id?: number;
    user_id?: number;
    jobrole: string; 
    description: string;
    sections: JobSections[];
    created_at?: string;
    updated_field_keys?: string[];
}

export interface JobSections {
    id: number | string;
    section_number: number;
    heading: string;
    body: string;
}

export interface JobsUpdatePayload extends Jobs {
    updated_field_keys?: string[];
  }