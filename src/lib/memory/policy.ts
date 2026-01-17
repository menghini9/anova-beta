// ======================================================
// MEMORY — Policy (V2)
// Path: src/lib/memory/policy.ts
// ======================================================

export const MEMORY_POLICY = {
  LIMIT_TOKENS_SOFT: 9000,
  LIMIT_TOKENS_HARD: 12000,

  TARGET_MEMORY_TOKENS_MIN: 450,
  TARGET_MEMORY_TOKENS_MAX: 900,

  KEEP_LAST_TURNS: 2,
  UPDATE_EVERY_TURNS: 10,

  // UI warning thresholds (ratio of SOFT)
  WARN_YELLOW_RATIO: 0.7,
  WARN_RED_RATIO: 0.9,
} as const;
