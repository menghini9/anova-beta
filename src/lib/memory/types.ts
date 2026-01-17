// ======================================================
// MEMORY — Types
// Path: src/lib/memory/types.ts
// ======================================================

export type Priority = "P0" | "P1";

export type MemoryKV = { k: string; v: string; conf?: number };

export type MemoryDecision = { d: string; why?: string; date?: string };

export type MemoryConstraint = { c: string; priority: Priority };

export type MemoryThread = {
  t: string;
  owner: "user" | "anova";
  status: "open" | "blocked";
};

export type MemoryTodo = { a: string; owner: "user" | "anova" };

export type MemoryPacketV2 = {
  goal: string;

  facts: MemoryKV[];
  decisions: MemoryDecision[];
  constraints: MemoryConstraint[];

  open_threads: MemoryThread[];
  todo_next: MemoryTodo[];

  do_not_forget: string[];

  tone_style?: string;

  routing_hints?: {
    preferred_provider?: string;
    avoid?: string[];
    notes?: string;
  };

  memory_version: number;
  updated_at: string; // ISO
};

export type MemoryState = {
  pendingCompression: boolean;
  compressedMemory: MemoryPacketV2 | null;
  memoryVersion: number;
  approxContextTokens: number;
};
