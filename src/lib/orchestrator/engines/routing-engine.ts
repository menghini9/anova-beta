// ANOVA_ROUTING_ENGINE_V1
// Motore di routing cognitivo: sceglie quali provider interrogare.
// Usa: quantum-model, policy, performance-map (in futuro), availability API key.

import type { ProviderId, Intent } from "../types";
import type { QuantumState } from "../quantum/quantum-model";
import { BASE_WEIGHTS, PARALLEL_FANOUT, PROVIDER_TIMEOUT_MS } 
  from "../policy";




/**
 * Descrive quali provider chiamare e con che peso.
 */
export interface RoutingDecision {
  selected: ProviderId[];
  ranked: Array<{ provider: ProviderId; weight: number }>;
  fanoutCount: number;
}

/**
 * Provider registrati — in futuro sarà dinamico.
 */
const ALL_PROVIDERS: ProviderId[] = [
  "openai",
  "anthropic",
  "gemini",
  "mistral",
  "llama",
  "web",
];

/**
 * Verifica presenza API key.
 */
function providerAvailable(id: ProviderId): boolean {
  const keyMap: Record<ProviderId, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    llama: process.env.LLAMA_API_KEY,
    web: process.env.WEB_SEARCH_API_KEY,
  };
  const key = keyMap[id];
  return Boolean(key && key !== "");
}

/**
 * Combina i pesi della policy + le probabilità quantiche.
 */
function computeQuantumWeightedScores(
  quantum: QuantumState
): Record<ProviderId, number> {
  const scores: Record<ProviderId, number> = {
    openai: 0,
    anthropic: 0,
    gemini: 0,
    mistral: 0,
    llama: 0,
    web: 0,
  };

  for (const interp of quantum.interpretations) {
    const domain = interp.domain;
    const domainWeights = BASE_WEIGHTS[domain] || {};

    for (const provider of ALL_PROVIDERS) {
      const w = (domainWeights[provider] as number | undefined) ?? 0.5;
      scores[provider] += w * interp.probability;
    }
  }

  return scores;
}

/**
 * Motore centrale: decide quali provider chiamare.
 */
export function runRoutingEngine(
  intent: Intent,
  quantum: QuantumState
): RoutingDecision {
  // 1) Pesi combinati (policy + quantum)
  const quantumScores = computeQuantumWeightedScores(quantum);

  // 2) Consideriamo solo provider attivi (con API key)
  const available = ALL_PROVIDERS.filter((p) => providerAvailable(p));

  if (available.length === 0) {
    return {
      selected: [],
      ranked: [],
      fanoutCount: 0,
    };
  }

  // 3) Ranking provider con pesi quantici
  const ranked = available
    .map((p) => ({
      provider: p,
      weight: Number(quantumScores[p].toFixed(3)),
    }))
    .sort((a, b) => b.weight - a.weight);

  // 4) Numero massimo di provider in fanout
  const fanout = Math.min(PARALLEL_FANOUT ?? 3, ranked.length);

  // 5) Provider selezionati per fanout finale
  const selected = ranked.slice(0, fanout).map((r) => r.provider);

  return {
    selected,
    ranked,
    fanoutCount: fanout,
  };
}
