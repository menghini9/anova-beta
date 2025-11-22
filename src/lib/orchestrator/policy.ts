// ⬇️ BLOCCO 2 — /src/lib/orchestrator/policy.ts
// ANOVA_ORCHESTRATOR_V42

import type { Domain, ProviderId } from "./types";

export const BASE_WEIGHTS: Record<Domain, Partial<Record<ProviderId, number>>> = {
  logic:    { openai: 0.9, anthropic: 0.85, mistral: 0.7, gemini: 0.75, llama: 0.6 },
  code:     { openai: 0.95, mistral: 0.78, llama: 0.65, anthropic: 0.75, gemini: 0.72 },
  creative: { anthropic: 0.9, openai: 0.82, mistral: 0.7, gemini: 0.8, llama: 0.6 },
  factual:  { gemini: 0.9, openai: 0.82, anthropic: 0.78, mistral: 0.7, web: 0.85 },
  strategy: { openai: 0.88, anthropic: 0.86, gemini: 0.8, mistral: 0.7, llama: 0.6 },
};

// timeout di sicurezza per singolo provider
export const PROVIDER_TIMEOUT_MS = 55_000; // 55.000 ms

// massimo numero di provider in parallelo 
export const PARALLEL_FANOUT = 1;
// ⬆️ FINE BLOCCO 2
