// ⬇️ BLOCCO P0 — Project Types (V4)
// Path: /src/lib/projects/types.ts

// =========================
// 1) Intent
// =========================
export type WorkIntent =
  | "scrittura"
  | "riscrittura"
  | "problema"
  | "decisione"
  | "codice"
  | "informazione";

// =========================
// 2) Scrittura Job (TIPI reali)
// =========================
export type ScritturaJob =
  | "email_singola"
  | "email_sequenza"
  | "messaggio"
  | "post_social"
  | "pagina_web"
  | "descrizione_prodotto"
  | "materiale_marketing"
  | "articolo"
  | "documento"
  | "comunicazione_interna"
  | "comunicato_pubblico"
  | "pitch_presentazione"
  | "script_discorso"
  | "faq"
  | "bio_profilo"
  | "libro_longform"
  | "altro";

// =========================
// 3) Stage (flow progetto)
// =========================
export type ProjectStage =
  | "BRIEF_1"
  | "CONFIRM_1"
  | "BRIEF_2"
  | "CONFIRM_2"
  | "BRIEF_3"
  | "CONFIRM_3"
  | "OPEN_CHAT"
  | "PRODUCTION";

// =========================
// 4) Project Document
// =========================
export type ProjectDoc = {
  owner: string;
  intent: WorkIntent;

  // ✅ solo per scrittura
  job?: ScritturaJob;

  stage: ProjectStage;
  sessionId: string;

  brief?: {
    round1?: Record<string, any>;
    round2?: Record<string, any>;
    round3?: Record<string, any>;
  };

  contracts?: {
    c1?: string;
    c2?: string;
    final?: string;
  };

  contextText?: string;

  // Flags tecniche
  autoKickoffDone?: boolean;

  createdAt?: any;
  updatedAt?: any;
};
// ⬆️ FINE BLOCCO P0
