// ANOVA_ROUTING_ENGINE_V3 — FULL MULTI-PROVIDER (tier + cost profile)

import type { ProviderId, Intent, CoreProviderId } from "../types";
import type { QuantumState } from "../quantum/quantum-model";
import { BASE_WEIGHTS } from "../policy";
import { COST_PROFILES, CostProfileId, getUserCostProfile } from "./cost-profile";

export interface RoutingDecision {
  selected: ProviderId[];
  ranked: Array<{ provider: ProviderId; weight: number }>;
  fanoutCount: number;
}

const ALL_PROVIDERS: ProviderId[] = [
  "openai:econ",
  "openai:mid",
  "openai:max",

  "anthropic:econ",
  "anthropic:mid",
  "anthropic:max",

  "gemini:econ",
  "gemini:mid",
  "gemini:max",

  "mistral",
  "llama",
  "web",
];

// -------------------------------------------------------
// QUANTUM + POLICY
// -------------------------------------------------------
function computeQuantumScores(
  quantum: QuantumState
): Record<ProviderId, number> {
  const scores = {} as Record<ProviderId, number>;
  for (const p of ALL_PROVIDERS) scores[p] = 0;

  for (const interp of quantum.interpretations) {
    const domain = interp.domain;

const domainWeights: Partial<Record<CoreProviderId, number>> =
  BASE_WEIGHTS[domain] || {};


    for (const provider of ALL_PROVIDERS) {
      const baseId: CoreProviderId =
        provider.includes(":")
          ? (provider.split(":")[0] as CoreProviderId)
          : (provider as CoreProviderId);

     const baseline = domainWeights[baseId] ?? 0.5;

      scores[provider] += baseline * interp.probability;
    }
  }

  return scores;
}

// -------------------------------------------------------
// COST PROFILE APPLICATION
// -------------------------------------------------------
function applyCostProfile(
  raw: Record<ProviderId, number>,
  profile: CostProfileId
): Record<ProviderId, number> {
  const { allowed, qualityBoost, costPenalty } = COST_PROFILES[profile];
  const final: Record<ProviderId, number> = { ...raw };

  for (const prov of ALL_PROVIDERS) {
    if (!allowed.includes(prov)) {
      final[prov] = 0;
      continue;
    }

    const score = raw[prov];
    const adjusted = score * qualityBoost - score * costPenalty * 0.2;
    final[prov] = Math.max(0, adjusted);
  }

  return final;
}

// -------------------------------------------------------
// MAIN ENGINE
// -------------------------------------------------------
export function runRoutingEngine(
  intent: Intent,
  quantum: QuantumState,
  userId?: string
): RoutingDecision {
  const profile = getUserCostProfile(userId); // CostProfileId

  const qScores = computeQuantumScores(quantum);
  const profileScores = applyCostProfile(qScores, profile);

  const available = ALL_PROVIDERS.filter(
    (p) => profileScores[p] > 0
  );

  if (available.length === 0) {
    return { selected: [], ranked: [], fanoutCount: 0 };
  }

  const ranked = available
    .map((p) => ({
      provider: p,
      weight: Number(profileScores[p].toFixed(3)),
    }))
    .sort((a, b) => b.weight - a.weight);

  const fanout = Math.min(
    COST_PROFILES[profile].maxFanout,
    ranked.length
  );

  return {
    selected: ranked.slice(0, fanout).map((r) => r.provider),
    ranked,
    fanoutCount: fanout,
  };
}
