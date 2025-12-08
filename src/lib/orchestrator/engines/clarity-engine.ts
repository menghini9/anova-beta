// ANOVA_CLARITY_ENGINE_V1
// Motore che decide se fermare il flusso e chiedere chiarimenti all'utente.

import type { Intent } from "../types";

const hasAny = (text: string, list: string[]) =>
  list.some((k) => text.includes(k.toLowerCase()));

/**
 * Output del Clarity Engine.
 */
export interface ClarityResult {
  needsClarification: boolean;
  question?: string;
}

/**
 * Costruisce la domanda di chiarimento più adatta, riutilizzando la logica V60.
 */
function buildClarificationQuestion(intent: Intent): string {
  const lower = intent.original.toLowerCase();
  const mentionsAnova = lower.includes("anova");

  // Caso specifico: ANOVA ambiguo (statistica vs sistema)
  if (intent.clarificationType === "anova_ambiguous" || mentionsAnova) {
    return (
      'Quando scrivi "ANOVA", ti riferisci alla tecnica statistica ' +
      '(Analysis of Variance) oppure ad **Anova β**, il sistema cognitivo che stai usando ora? ' +
      "Dimmi quale delle due, così posso allinearmi a quello che ti serve davvero."
    );
  }

  // Obiettivo troppo vago
  if (intent.clarificationType === "vague_goal") {
    return (
      "La tua richiesta è molto aperta e può voler dire tante cose.\n" +
      "Per aiutarti davvero, chiarisci in 3 punti:\n" +
      "1) Ambito (personale, business, tecnico, studio...)\n" +
      "2) Obiettivo principale che vuoi ottenere\n" +
      "3) Vincoli o risorse che hai (tempo, soldi, competenze)\n\n" +
      "Con questi tre punti posso darti un piano molto più preciso, non una risposta generica."
    );
  }

  // Chiarimento generico
  return (
    "Posso interpretare la tua richiesta in più modi. " +
    "Aggiungi qualche dettaglio in più (contesto, obiettivo, livello di dettaglio) " +
    "così posso modellare meglio la risposta."
  );
}

/**
 * Motore di clarity: decide se fermare il flusso e generare una domanda di chiarimento.
 */
export function runClarityEngine(intent: Intent): ClarityResult {
  if (!intent.needsClarification) {
    return { needsClarification: false };
  }

  const question = buildClarificationQuestion(intent);
  return {
    needsClarification: true,
    question,
  };
}
