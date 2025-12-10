// =======================================
// ANOVA_COST_ENGINE_V1
// Stima costi, latenza prevista e token count
// =======================================

import type { ProviderId } from "../types";

// Prezzi indicativi per modello (USD per 1 token)
// In futuro potremo caricarli da Firestore o da config remota
const PRICE_MAP: Record<ProviderId, number> = {
  "openai:econ": 0.000002,
  "openai:mid": 0.00001,
  "openai:max": 0.00003,

  "anthropic:econ": 0.000003,
  "anthropic:mid": 0.000015,
  "anthropic:max": 0.00004,

  "gemini:econ": 0.0000018,
  "gemini:mid": 0.00001,
  "gemini:max": 0.00003,

  mistral: 0.0000015,
  llama: 0.0000005,
  web: 0,
};

const LATENCY_MAP: Record<ProviderId, number> = {
  "openai:econ": 1100,
  "openai:mid": 1500,
  "openai:max": 2000,

  "anthropic:econ": 1300,
  "anthropic:mid": 1600,
  "anthropic:max": 2100,

  "gemini:econ": 1000,
  "gemini:mid": 1400,
  "gemini:max": 1800,

  mistral: 900,
  llama: 800,
  web: 1600,
};


// ===============================
// Token estimator (grezzo)
// ===============================
// Non usiamo encoder pesanti qui: serve solo per la stima.
// Un token ≈ 4 caratteri per testi normali.
function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const chars = text.length;
  return Math.max(1, Math.round(chars / 4));
}

// ===============================
// Tipi esportati
// ===============================
export interface CostEstimate {
  provider: ProviderId;
  tokens: number;
  predictedCost: number;     // USD
  expectedLatency: number;   // ms
}

// ===============================
// Funzione principale
// ===============================
export function estimateCosts(prompt: string): CostEstimate[] {
  const tokens = estimateTokenCount(prompt);

  const results: CostEstimate[] = Object.keys(PRICE_MAP).map((provider) => {
    const id = provider as ProviderId;

    const predictedCost = tokens * (PRICE_MAP[id] ?? 0);
    const expectedLatency = LATENCY_MAP[id] ?? 1500;

    return {
      provider: id,
      tokens,
      predictedCost: Number(predictedCost.toFixed(6)),
      expectedLatency,
    };
  });

  return results;
}

// ===============================
// Helper per routing-engine
// ===============================
export function getCostForProvider(
  costs: CostEstimate[],
  provider: ProviderId
): number {
  const entry = costs.find((c) => c.provider === provider);
  return entry ? entry.predictedCost : 0;
}

export function getLatencyForProvider(
  costs: CostEstimate[],
  provider: ProviderId
): number {
  const entry = costs.find((c) => c.provider === provider);
  return entry ? entry.expectedLatency : 1500;
}
