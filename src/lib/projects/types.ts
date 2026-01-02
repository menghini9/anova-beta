// ⬇️ BLOCCO P0 — Project Types (V3)
// Path: /src/lib/projects/types.ts

// =========================
// 1) Intent / Mode
// =========================
export type WorkIntent = "scrittura" | "riscrittura" | "problema" | "decisione" | "codice";
export type ProjectMode = "breve" | "guidato";

// =========================
// 2) Stage (flow progetto)
// =========================
// Nota:
// - BRIEF_1/2 = domande chiuse
// - BRIEF_3 = domande aperte (chi/cosa/come/perché)
// - OPEN_CHAT = chat aperta (Anova può rispondere subito / fare max 3 domande se critiche)
// - PRODUCTION = modalità produzione
export type ProjectStage =
  | "BRIEF_1"
  | "CONFIRM_1"
  | "AI_Q_1" // legacy / opzionale
  | "BRIEF_2"
  | "CONFIRM_2"
  | "AI_Q_2" // legacy / opzionale
  | "BRIEF_3" // ✅ NEW
  | "CONFIRM_3" // ✅ NEW
  | "OPEN_CHAT"
  | "PRODUCTION";

// =========================
// 3) AI Questions (legacy)
// =========================
export type AiQ = {
  id: string;
  text: string;
  type: "short_text" | "single_choice";
  options?: string[];
};

// =========================
// 4) Project Document
// =========================
export type ProjectDoc = {
  owner: string;
  intent: WorkIntent;
  mode: ProjectMode;
  stage: ProjectStage;

  sessionId: string;

  // -------------------------
  // Brief (input utente)
  // -------------------------
  brief?: {
    round1?: Record<string, any>;
    round2?: Record<string, any>;
    round3?: Record<string, any>; // ✅ NEW: domande aperte (chi/cosa/come/perché)
  };

  // -------------------------
  // AIQ (legacy / opzionale)
  // -------------------------
  aiq?: {
    q1?: AiQ[];
    q2?: AiQ[];
    a1?: Record<string, any>;
    a2?: Record<string, any>;
  };

  // -------------------------
  // Contratti (opzionale)
  // -------------------------
  contracts?: {
    c1?: string;
    c2?: string;
    final?: string;
  };

  // -------------------------
  // Extra context (opzionale)
  // -------------------------
  contextText?: string;

  createdAt?: any;
  updatedAt?: any;
};
// ⬆️ FINE BLOCCO P0
