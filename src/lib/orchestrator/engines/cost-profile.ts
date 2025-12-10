// ANOVA_COST_PROFILE_V2 — profili costo/qualità

import type { ProviderId } from "../types";

export type CostProfileId = "eco" | "balanced" | "premium";

interface CostProfile {
  maxFanout: number;
  allowed: ProviderId[];
  qualityBoost: number;
  costPenalty: number;
}

export const COST_PROFILES: Record<CostProfileId, CostProfile> = {
  eco: {
    maxFanout: 1,
    allowed: [
      "openai:econ",
      "anthropic:econ",
      "gemini:econ",
      "mistral",
      "llama",
    ],
    qualityBoost: 0.9,
    costPenalty: 1.0,
  },
  balanced: {
    maxFanout: 2,
    allowed: [
      "openai:mid",
      "anthropic:mid",
      "gemini:mid",
      "mistral",
      "llama",
    ],
    qualityBoost: 1.0,
    costPenalty: 0.7,
  },
  premium: {
    maxFanout: 3,
    allowed: [
      "openai:max",
      "anthropic:max",
      "gemini:max",
      "mistral",
      "llama",
      "web",
    ],
    qualityBoost: 1.1,
    costPenalty: 0.4,
  },
};

export function getUserCostProfile(userId?: string): CostProfileId {
  // Per ora fisso; in futuro logica per utente
  return "balanced";
}
