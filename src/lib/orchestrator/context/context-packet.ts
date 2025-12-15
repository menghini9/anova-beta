// ANOVA_CONTEXT_PACKET_V1
// Path: /src/lib/orchestrator/context/context-packet.ts

import type { ProviderId } from "../types";

export type AnovaPhase =
  | "UNDERSTAND"
  | "CHECKLIST"
  | "CLARIFY"
  | "SUPERPROMPT"
  | "EXECUTE"
  | "REFINE"
  | "DONE";

export type AnovaCategory =
  | "INFORMATIVE"
  | "OPERATIVE"
  | "DEBUG"
  | "DECISIONAL"
  | "PREFERENCES";

export interface ChecklistBlock {
  title: string;
  items: string[];
  priority: "P1" | "P2" | "P3";
}

export interface AiDirectiveResult {
  category: AnovaCategory;
  confidence: number; // 0..1
  phaseNext: AnovaPhase;
  needsUserInput: boolean;
  questions: string[];
  checklist: ChecklistBlock[];
  superPrompt?: string;
  finalAnswer?: string;
  notesForOrchestrator?: string[];
  sourceProvider?: ProviderId;
}

export interface ContextPacket {
  // Identità richiesta
  userId?: string;
  conversationId?: string;

  // Stato processo
  phase: AnovaPhase;
  category?: AnovaCategory;

  // Input e contesto
  userRequest: string;
  userAnswers?: Record<string, string>; // Q->A

  // Materiale generato
  checklist?: ChecklistBlock[];
  superPrompt?: string;

  // Ultimi risultati “direttivi” dalle AI
  lastDirective?: AiDirectiveResult;

  // Debug/telemetria
  createdAtMs: number;
  updatedAtMs: number;
}

// Builder minimale
export function buildContextPacket(input: {
  userRequest: string;
  userId?: string;
  conversationId?: string;
  phase?: AnovaPhase;
  category?: AnovaCategory;
  userAnswers?: Record<string, string>;
  checklist?: ChecklistBlock[];
  superPrompt?: string;
  lastDirective?: AiDirectiveResult;
}): ContextPacket {
  const now = Date.now();
  return {
    userId: input.userId,
    conversationId: input.conversationId,
    phase: input.phase ?? "UNDERSTAND",
    category: input.category,
    userRequest: input.userRequest,
    userAnswers: input.userAnswers,
    checklist: input.checklist,
    superPrompt: input.superPrompt,
    lastDirective: input.lastDirective,
    createdAtMs: now,
    updatedAtMs: now,
  };
}
