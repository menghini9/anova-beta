// ANOVA_QUALITY_ENGINE_V1
// Motore di valutazione qualità delle risposte dei provider.

import type { ProviderResponse} from "../types";
import { BASE_WEIGHTS } from "../policy";
import type { ProviderId, CoreProviderId, Domain } from "../types";

/* ------------------------------------------
 * TIPI ESPORTATI
 * ------------------------------------------ */

export interface EvaluatedResponse {
  response: ProviderResponse;
  quality: number;        // qualità contenuto 0..1
  providerWeight: number; // peso di policy 0..1
  latencyScore: number;   // latenza normalizzata 0..1
  finalScore: number;     // punteggio complessivo 0..1
}

export interface QualityEngineResult {
  evaluated: EvaluatedResponse[];
}

/* ------------------------------------------
 * HELPERS INTERNI
 * ------------------------------------------ */

// Valuta struttura + lunghezza del testo (0..1)
function contentScore(text: string): number {
  if (!text) return 0;

  const trimmed = text.trim();
  if (!trimmed) return 0;

  const len = Math.min(trimmed.length, 4000) / 4000; // 0–1
  const bullets = (trimmed.match(/[-•\n*]/g) || []).length;
  const headings = (trimmed.match(/#{1,3}\s|(?:\n\s*[A-Z].+:)/g) || []).length;
  const codeBlocks = (trimmed.match(/```/g) || []).length;

  // Struttura: liste, titoli, blocchi di codice → massimo 0.6
  const structureRaw = bullets * 0.02 + headings * 0.05 + codeBlocks * 0.08;
  const structure = Math.min(structureRaw, 0.6);

  const base = 0.15; // base minima per testi decenti

  return clamp01(base + 0.5 * len + structure);
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/* ------------------------------------------
 * MOTORE PRINCIPALE
 * ------------------------------------------ */

/**
 * Valuta tutte le risposte dei provider rispetto al dominio.
 * Non decide ancora la fusione, si limita a calcolare i punteggi.
 */
export function runQualityEngine(
  responses: ProviderResponse[],
  domain: Domain
): QualityEngineResult {
  if (!responses || responses.length === 0) {
    return { evaluated: [] };
  }

  const weightsForDomain = BASE_WEIGHTS[domain] ?? {};

  const evaluated: EvaluatedResponse[] = responses.map((r) => {
    if (!r.success || !r.text) {
      return {
        response: r,
        quality: 0,
        providerWeight: 0,
        latencyScore: 0,
        finalScore: 0,
      };
    }

    const quality = contentScore(r.text);

  const baseProvider = (r.provider.includes(":")
  ? r.provider.split(":")[0]
  : r.provider) as CoreProviderId;

const providerWeight = clamp01(
  weightsForDomain[baseProvider] ?? 0.7
);


    const latencyMs = r.latencyMs ?? 0;
    const latencyScore = clamp01(1 / (1 + latencyMs / 2000)); // più veloce → più alto

    // Mix pesato: qualità contenuto > peso provider > latenza
    const finalScore = clamp01(
      quality * 0.55 + providerWeight * 0.3 + latencyScore * 0.15
    );

    return {
      response: r,
      quality,
      providerWeight,
      latencyScore,
      finalScore,
    };
  });

  return { evaluated };
}
