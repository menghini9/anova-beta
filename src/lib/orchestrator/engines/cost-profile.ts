// ANOVA_COST_PROFILE_V2
// Profili di costo semplificati per lo stato attuale di ANOVA β
// (3 provider reali: openai, anthropic, gemini)

import type { ProviderId } from "../types";

export type CostProfileId = "economy" | "balanced" | "premium";

export interface CostProfile {
  allowed: ProviderId[];   // provider che possono essere usati
  qualityBoost: number;    // quanto premiamo la qualità
  costPenalty: number;     // quanto penalizziamo il costo
  maxFanout: number;       // massimo numero di provider in parallelo
}

// ⚙️ Profili attuali: tutti includono SEMPRE openai, anthropic, gemini
export const COST_PROFILES: Record<CostProfileId, CostProfile> = {
  economy: {
    // 1 solo modello alla volta → minimo costo
    allowed: ["openai", "anthropic", "gemini"],
    qualityBoost: 1.0,
    costPenalty: 0.15,
    maxFanout: 1,
  },
  balanced: {
    // 2 modelli in parallelo → buon compromesso
    allowed: ["openai", "anthropic", "gemini"],
    qualityBoost: 1.1,
    costPenalty: 0.1,
    maxFanout: 3,
  },
  premium: {
    // fino a 3 modelli in parallelo → massima qualità
    allowed: ["openai", "anthropic", "gemini"],
    qualityBoost: 1.2,
    costPenalty: 0.05,
    maxFanout: 3,
  },
};

// 🔎 Per ora profilo fisso → in futuro lo prenderemo da Firestore / preferenze utente
export function getUserCostProfile(userId?: string): CostProfileId {
  // se vuoi forzare profilo, cambia qui: "economy" | "balanced" | "premium"
  return "balanced";
}
