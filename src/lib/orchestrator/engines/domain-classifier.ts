// ANOVA_DOMAIN_CLASSIFIER_V1
// Motore che decide il dominio finale usando intent + stato quantico.

import type { Intent, Domain } from "../types";
import type { QuantumState } from "../quantum/quantum-model";

export interface DomainClassifierResult {
  domain: Domain;
  rationale: string;
}

/**
 * Sceglie il dominio da usare per routing/fusione.
 * Logica:
 *  - se una interpretazione ha probabilità alta → usiamo quella
 *  - altrimenti fallback su intent.purpose
 */
export function runDomainClassifier(
  intent: Intent,
  quantum: QuantumState
): DomainClassifierResult {
  if (!quantum.interpretations || quantum.interpretations.length === 0) {
    return {
      domain: intent.purpose,
      rationale: "Nessuna interpretazione quantica disponibile, uso il purpose dell'intent.",
    };
  }

  const best = quantum.interpretations.reduce((acc, curr) =>
    curr.probability > acc.probability ? curr : acc
  );

  if (best.probability >= 0.6) {
    return {
      domain: best.domain,
      rationale:
        "Dominio scelto dalla migliore interpretazione quantica (probabilità >= 0.6).",
    };
  }

  return {
    domain: intent.purpose,
    rationale:
      "Probabilità quantiche distribuite, uso il purpose dell'intent come dominio principale.",
  };
}
