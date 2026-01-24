// ======================================================
// MEMORY — Policy (V2.1 cost-based + safety rails)
// Path: src/lib/memory/policy.ts
// ======================================================

export const MEMORY_POLICY = {
  // =========================
  // SAFETY RAILS (anti-crash)
  // =========================
  // Non sono il trigger “principale”, sono il paracadute.
  LIMIT_TOKENS_SOFT: 8000,
  LIMIT_TOKENS_HARD: 12000,

  // =========================
  // LIVE CONTEXT
  // =========================
  // Quanti turni recenti mandiamo sempre “al volo”
  KEEP_LAST_TURNS: 2,

  // Ogni quanti turni aggiorniamo/valutiamo compressione
  UPDATE_EVERY_TURNS: 1,

  // =========================
  // TARGET MEMORY SIZE
  // =========================
  // Quando comprimiamo, vogliamo che il packet stia in quel range
  TARGET_MEMORY_TOKENS_MIN: 350,
  TARGET_MEMORY_TOKENS_MAX: 900,

  // =========================
  // COST-BASED DECISION
  // =========================
  // Margine minimo: comprimi solo se risparmi almeno X%
  COST_SAVE_RATIO_MIN: 0.15, // 15%

  // Margine minimo assoluto: comprimi solo se risparmi almeno X €
  COST_SAVE_EUR_MIN: 0.0015, // 0,15 cent

  // Per evitare “micro-compressioni” inutili:
  // comprimi solo se il rawBuffer stimato supera questo
  MIN_RAWBUFFER_TOKENS_TO_CONSIDER: 600,

  // =========================
  // UI WARNINGS
  // =========================
  WARN_YELLOW_RATIO: 0.7,
  WARN_RED_RATIO: 0.9,
} as const;
