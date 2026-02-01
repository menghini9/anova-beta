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
  id: string;
  sender: "user" | "assistant";
  text: string;
  createdAt?: any;

  // ✅ NUOVO: metadata agent (opzionali)
  agentId?: string | null;
  agentName?: string | null;
  agentProvider?: "openai" | "gemini" | "claude" | string | null;
  agentModel?: string | null;
  kind?: "group" | "agent" | "fusion" | string;
};

