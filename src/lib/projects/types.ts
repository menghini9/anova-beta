// ⬇️ BLOCCO P0 — Project Types (V2)
// Path: /src/lib/projects/types.ts

export type WorkIntent = "scrittura" | "riscrittura" | "problema" | "decisione" | "codice";
export type ProjectMode = "breve" | "guidato";

export type ProjectStage =
  | "BRIEF_1"
  | "CONFIRM_1"
  | "AI_Q_1"
  | "BRIEF_2"
  | "CONFIRM_2"
  | "AI_Q_2"
  | "OPEN_CHAT"
  | "PRODUCTION";

export type AiQ = { id: string; text: string; type: "short_text" | "single_choice"; options?: string[] };

export type ProjectDoc = {
  owner: string;
  intent: WorkIntent;
  mode: ProjectMode;
  stage: ProjectStage;

  sessionId: string;

  brief?: {
    round1?: Record<string, any>;
    round2?: Record<string, any>;
  };

  aiq?: {
    q1?: AiQ[];
    q2?: AiQ[];
    a1?: Record<string, any>;
    a2?: Record<string, any>;
  };

  contracts?: {
    c1?: string;
    c2?: string;
    final?: string;
  };

  contextText?: string;

  createdAt?: any;
  updatedAt?: any;
};
// ⬆️ FINE BLOCCO P0
