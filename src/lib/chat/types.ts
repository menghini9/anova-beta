// Path: src/lib/chat/types.ts

export type ProviderId = "openai" | "gemini" | "claude";




export type SessionMetaLite = {
  id: string;
  title?: string | null;
  lastMessage?: string | null;
  updatedAt?: any;
};

export type TabDoc = {
  id: string;
  title: string;
  provider: ProviderId;
  rules: string;
  deleted?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export type ChatMessage = {
  id?: string;
  sender: "user" | "anova";
  text: string;
  createdAt?: any;
};
