// ⬇️ BLOCCO PE 1.1 — Preference Reply Core
// Path: /src/lib/orchestrator/preference-engine/preferenceReply.ts

import type { PreferenceHit } from "./detectPreference";

/**
 * Costruisce la risposta “di servizio” di Anova quando capisce
 * una preferenza dell’utente, senza chiamare provider esterni.
 */
export function buildPreferenceAck(
  hit: PreferenceHit,
  lastAnswerExists: boolean
): string {
  const parts: string[] = [];

  if (hit.detail === "low") parts.push("risposte più corte e sintetiche");
  if (hit.detail === "medium") parts.push("risposte di livello intermedio");
  if (hit.detail === "high") parts.push("risposte lunghe e dettagliate");

  if (hit.tone === "concise") parts.push("un tono più semplice e diretto");
  if (hit.tone === "neutral") parts.push("un tono più neutrale e professionale");
  if (hit.tone === "rich") parts.push("un tono più ricco e narrativo");

  const prefText = parts.join(" e ");

  if (lastAnswerExists) {
    return `Ricevuto — da ora terrò ${prefText}. Vuoi che ti riformuli anche la risposta precedente con questo stile?`;
  }

  return `Perfetto, terrò ${prefText} nelle prossime risposte.`;
}

// ⬆️ FINE BLOCCO PE 1.1
