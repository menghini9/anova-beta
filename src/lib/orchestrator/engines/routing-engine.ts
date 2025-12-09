// ANOVA_ROUTING_ENGINE_V2
// Motore di routing cognitivo con profili di costo (Economy / Balanced / Premium)

import type { ProviderId, Intent } from "../types";
import type { QuantumState } from "../quantum/quantum-model";

import { BASE_WEIGHTS } from "../policy";
import { COST_PROFILES, getUserCostProfile } from "./cost-profile";

/* -------------------------------------------------------
 * TIPI
 * ------------------------------------------------------- */

export interface RoutingDecision {
  selected: ProviderId[];
  ranked: Array<{ provider: ProviderId; weight: number }>;
  fanoutCount: number;
}

/* -------------------------------------------------------
 * PROVIDER REGISTRATI
 * ------------------------------------------------------- */
const ALL_PROVIDERS: ProviderId[] = [
  "openai",
  "anthropic",
  "gemini",
  "mistral",
  "llama",
  "web",
];

/* -------------------------------------------------------
 * API KEY CHECK
 * ------------------------------------------------------- */
function providerAvailable(id: ProviderId): boolean {
  const keyMap: Record<ProviderId, string | undefined> = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    llama: process.env.LLAMA_API_KEY,
    web: process.env.WEB_SEARCH_API_KEY,
  };
  return Boolean(keyMap[id]);
}

/* -------------------------------------------------------
 * QUANTUM + POLICY COMBINATI
 * ------------------------------------------------------- */
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
      const baseline = (domainWeights[provider] as number | undefined) ?? 0.5;
      scores[provider] += baseline * interp.probability;
    }
  }

  return scores;
}

/* -------------------------------------------------------
 * COST ENGINE – aggiunge correzione peso in base al profilo
 * ------------------------------------------------------- */
function applyCostProfileWeights(
  rawScores: Record<ProviderId, number>,
  profile: ReturnType<typeof getUserCostProfile>
) {
  const { allowed, qualityBoost, costPenalty } = COST_PROFILES[profile];

  const finalScores: Record<ProviderId, number> = { ...rawScores };

  for (const prov of Object.keys(finalScores) as ProviderId[]) {
    // Se non è in allowed → peso zero
    if (!allowed.includes(prov)) {
      finalScores[prov] = 0;
      continue;
    }

    // Formula peso modificato
    const score = rawScores[prov];
    const adjusted =
      score * qualityBoost - score * costPenalty * 0.2; // 20% penalità costo
    finalScores[prov] = Math.max(0, adjusted);
  }

  return finalScores;
}

/* -------------------------------------------------------
 * MOTORE CENTRALE DI ROUTING
 * ------------------------------------------------------- */
export function runRoutingEngine(
  intent: Intent,
  quantum: QuantumState,
  userId?: string
): RoutingDecision {
  const profile = getUserCostProfile(userId);

  // 1) Quantum + policy
  const qScores = computeQuantumWeightedScores(quantum);

  // 2) Cost profiling
  const profileScores = applyCostProfileWeights(qScores, profile);

  // 3) Filtra provider davvero disponibili
  const available = (Object.keys(profileScores) as ProviderId[])
    .filter((p) => providerAvailable(p))
    .filter((p) => profileScores[p] > 0);

  if (available.length === 0) {
    return { selected: [], ranked: [], fanoutCount: 0 };
  }

  // 4) Ranking finale
  const ranked = available
    .map((p) => ({
      provider: p,
      weight: Number(profileScores[p].toFixed(3)),
    }))
    .sort((a, b) => b.weight - a.weight);

  // 5) Fanout basato sul profilo
  const maxFanout = COST_PROFILES[profile].maxFanout;
  const fanout = Math.min(maxFanout, ranked.length);
console.log("ROUTING_DEBUG", {
  available: available,
  qScores,
  profileScores,
  apiKeys: ALL_PROVIDERS.map(p => [p, providerAvailable(p)])
});

  return {
    selected: ranked.slice(0, fanout).map((r) => r.provider),
    ranked,
    fanoutCount: fanout,
  };
}
