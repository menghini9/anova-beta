// ANOVA_FUSION_ENGINE_V1
// Motore di fusione avanzata delle risposte dei provider.

import type { FusionResult, Domain } from "../types";
import type { ProviderResponse } from "../types";
import { runQualityEngine, type EvaluatedResponse } from "./quality-engine";

/* ------------------------------------------
 * TIPI ESPORTATI
 * ------------------------------------------ */

export interface FusionEngineOutput {
  fusion: FusionResult;
  evaluated: EvaluatedResponse[];
}

/* ------------------------------------------
 * MOTORE PRINCIPALE
 * ------------------------------------------ */

/**
 * Esegue la fusione delle risposte dei provider:
 * - sceglie una risposta backbone
 * - aggiunge integrazioni da altri provider non pessimi
 * - calcola un fusionScore aggregato
 */
export function runFusionEngine(
  responses: ProviderResponse[],
  domain: Domain = "logic"
): FusionEngineOutput {
  if (!responses || responses.length === 0) {
    const empty: FusionResult = {
      finalText: "Nessuna risposta ricevuta dai provider.",
      fusionScore: 0,
      used: [],
    };
    return { fusion: empty, evaluated: [] };
  }

  const qualityResult = runQualityEngine(responses, domain);
  const evaluated = qualityResult.evaluated;

  // Filtriamo solo quelle minimamente utili
  const usable = evaluated
    .filter(
      (e) =>
        e.finalScore > 0 &&
        (e.response.text?.trim().length ?? 0) > 0
    )
    .sort((a, b) => b.finalScore - a.finalScore);

  if (usable.length === 0) {
    const none: FusionResult = {
      finalText: "Nessuna risposta utile dai provider.",
      fusionScore: 0,
      used: [],
    };
    return { fusion: none, evaluated };
  }

  // Limitiamo a massimo 3 provider "usati" per fusione
  const topUsed = usable.slice(0, 3);
  const best = topUsed[0];
  const bestScore = best.finalScore;

  // Selezioniamo le integrazioni: provider non troppo peggiori del migliore
  const additives = topUsed
    .slice(1)
    .filter((e) => e.finalScore >= bestScore * 0.55)
    .map((e) => e.response.text)
    .filter(Boolean) as string[];

  // Testo finale: spina dorsale + integrazioni
  let finalText = (best.response.text || "").trim();

  if (additives.length > 0) {
    finalText =
      finalText +
      "\n\n—\n" +
      "📌 **Integrazioni da altri modelli (merge controllato):**\n" +
      additives.map((t) => `• ${t.trim()}`).join("\n");
  }

  const fusionScoreRaw =
    topUsed.reduce((acc, e) => acc + e.finalScore, 0) / topUsed.length;

  const fusion: FusionResult = {
    finalText: finalText || "Nessuna risposta utile dai provider.",
    fusionScore: clamp01(fusionScoreRaw),
    used: topUsed.map((e) => ({
      provider: e.response.provider,
      score: clamp01(e.finalScore),
      latencyMs: e.response.latencyMs,
    })),
  };

  return {
    fusion,
    evaluated,
  };
}

/* ------------------------------------------
 * HELPERS INTERNI
 * ------------------------------------------ */

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
