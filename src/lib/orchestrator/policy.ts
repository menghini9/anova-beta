// ANOVA_ORCHESTRATOR_POLICY_V1
// Policy centralizzata per routing, qualità e provider timeout.

import type { Domain, ProviderId, CoreProviderId } from "./types";


// ------------------------------
// 1) PESI DI BASE PER DOMINIO
//     (solo ID BASE: openai, anthropic, gemini, mistral, llama, web)
// ------------------------------

export const BASE_WEIGHTS: Record<
  Domain,
  Partial<Record<CoreProviderId, number>>
> = {
  logic: {
    openai: 0.9,
    anthropic: 0.85,
    gemini: 0.75,
    mistral: 0.7,
    llama: 0.6,
  },

  code: {
    openai: 0.95,
    anthropic: 0.8,
    gemini: 0.72,
    mistral: 0.78,
    llama: 0.65,
  },

  creative: {
    anthropic: 0.9,
    openai: 0.82,
    gemini: 0.85,
    mistral: 0.7,
    llama: 0.6,
  },

  factual: {
    gemini: 0.9,
    openai: 0.82,
    anthropic: 0.78,
    mistral: 0.7,
    web: 0.85,
  },

  strategy: {
    openai: 0.9,
    anthropic: 0.88,
    gemini: 0.8,
    mistral: 0.7,
    llama: 0.6,
  },
};



// ------------------------------
// 2) PARAMETRI DI FANOUT
// ------------------------------
export const PARALLEL_FANOUT = 3;

// ------------------------------
// 3) TIMEOUT PER PROVIDER
// ------------------------------
export const PROVIDER_TIMEOUT_MS = 55_000;
