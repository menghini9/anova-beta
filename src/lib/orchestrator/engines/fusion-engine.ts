// ANOVA_FUSION_ENGINE_V2
// Motore di fusione controllata delle risposte AI.
// Produce UNA risposta coerente, come se fosse un'unica intelligenza.

import type { FusionResult, Domain, ProviderResponse } from "../types";
import { runQualityEngine, type EvaluatedResponse } from "./quality-engine";

/* ------------------------------------------
 * OUTPUT
 * ------------------------------------------ */

export interface FusionEngineOutput {
  fusion: FusionResult;
  evaluated: EvaluatedResponse[];
}

/* ------------------------------------------
 * MOTORE PRINCIPALE
 * ------------------------------------------ */

export function runFusionEngine(
  responses: ProviderResponse[],
  domain: Domain = "logic"
): FusionEngineOutput {
  if (!responses || responses.length === 0) {
    return {
      fusion: {
        finalText: "Nessuna risposta ricevuta dai provider.",
        fusionScore: 0,
        used: [],
      },
      evaluated: [],
    };
  }

  // 1️⃣ Valutazione qualità
  const { evaluated } = runQualityEngine(responses, domain);

  // 2️⃣ Filtriamo risposte realmente utilizzabili
  const usable = evaluated
    .filter(
      (e) =>
        e.finalScore > 0 &&
        e.response.text &&
        e.response.text.trim().length > 0
    )
    .sort((a, b) => b.finalScore - a.finalScore);

  if (usable.length === 0) {
    return {
      fusion: {
        finalText: "Nessuna risposta utile dai provider.",
        fusionScore: 0,
        used: [],
      },
      evaluated,
    };
  }

  // 3️⃣ Backbone: la migliore risposta
  const backbone = usable[0];

  // 4️⃣ Integrazioni soft (solo se non troppo peggiori)
  const integrations = usable
    .slice(1, 3)
    .filter((e) => e.finalScore >= backbone.finalScore * 0.65)
    .map((e) => e.response.text!.trim());

  // 5️⃣ Costruzione testo finale (fusione INVISIBILE)
  let finalText = backbone.response.text!.trim();

  if (integrations.length > 0) {
    finalText += "\n\n" + integrations.join("\n\n");
  }

  // 6️⃣ Fusion score pesato:
  // backbone pesa di più delle integrazioni
  const fusionScore =
    clamp01(
      backbone.finalScore * 0.7 +
      integrations.length * 0.15
    );

  const fusion: FusionResult = {
    finalText,
    fusionScore,
    used: usable.slice(0, 3).map((e) => ({
      provider: e.response.provider,
      score: clamp01(e.finalScore),
      latencyMs: e.response.latencyMs,
    })),
  };

  return { fusion, evaluated };
}

/* ------------------------------------------
 * HELPERS
 * ------------------------------------------ */

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
