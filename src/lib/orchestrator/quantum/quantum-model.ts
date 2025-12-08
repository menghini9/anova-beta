// ANOVA_QUANTUM_MODEL_V1
// Modello quantico simulato per interpretazioni multiple dell'intent

import type { Intent, Domain } from "../types";

/**
 * Singola interpretazione dell'intent con probabilità associata.
 */
export interface QuantumIntent {
  baseIntent: Intent;
  domain: Domain;
  probability: number; // 0..1
  rationale: string;
}

/**
 * Stato quantico complessivo di una richiesta.
 */
export interface QuantumState {
  originalIntent: Intent;
  interpretations: QuantumIntent[];
}

/**
 * Costruisce uno stato quantico simulato a partire dall'intent principale.
 * Per ora crea:
 *  - interpretazione principale (dominio rilevato)
 *  - eventuali interpretazioni secondarie (es. code → factual, strategy → factual)
 */
export function buildQuantumState(intent: Intent): QuantumState {
  const interpretations: QuantumIntent[] = [];

  // 🔵 Interpretazione principale
  interpretations.push({
    baseIntent: intent,
    domain: intent.purpose,
    probability: 0.7,
    rationale: "Interpretazione principale basata su purpose rilevato dall'intent.",
  });

  // 🟠 Interpretazioni alternative semplici (primo step di logica quantica simulata)
  if (intent.purpose === "code") {
    interpretations.push({
      baseIntent: { ...intent, purpose: "factual" },
      domain: "factual",
      probability: 0.3,
      rationale:
        "Molte richieste di codice includono anche bisogno di spiegazione concettuale / fattuale.",
    });
  } else if (intent.purpose === "strategy") {
    interpretations.push({
      baseIntent: { ...intent, purpose: "factual" },
      domain: "factual",
      probability: 0.3,
      rationale:
        "Le decisioni strategiche richiedono spesso dati, vincoli e contesto fattuale.",
    });
  } else if (intent.purpose === "factual") {
    interpretations.push({
      baseIntent: { ...intent, purpose: "strategy" },
      domain: "strategy",
      probability: 0.25,
      rationale:
        "Molte domande fattuali nascondono un problema decisionale o strategico.",
    });
  }

  // Normalizzazione delle probabilità a somma 1
  const total = interpretations.reduce((acc, i) => acc + (i.probability || 0), 0);
  const normalized =
    total > 0
      ? interpretations.map((i) => ({
          ...i,
          probability: Number((i.probability / total).toFixed(3)),
        }))
      : interpretations.map((i, idx) => ({
          ...i,
          probability: idx === 0 ? 1 : 0,
        }));

  return {
    originalIntent: intent,
    interpretations: normalized,
  };
}
