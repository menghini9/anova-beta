// ANOVA_MEMORY_ENGINE_V1
// Motore che gestisce sessionMemory + userMemory in modo centralizzato.

import type { Intent } from "../types";
import { updateSessionMemory, getSessionMemory } from "./sessionMemory";
import { loadUserMemory, mergeSessionIntoUserMemory } from "./userMemory";

export interface MemoryContext {
  session: any;
  user?: any;
}

/**
 * Inizializza la memoria per una richiesta:
 *  - aggiorna la mini-memoria di sessione
 *  - carica (se possibile) la memoria utente persistente
 */
export async function initMemoryEngine(
  prompt: string,
  intent?: any, // oppure: Intent | null se vuoi tipizzare bene
  userId?: string
): Promise<MemoryContext> {
 const purpose = intent?.purpose ?? "logic";
updateSessionMemory(prompt, purpose);

  const session = getSessionMemory();
  const user = userId ? await loadUserMemory(userId) : undefined;

  return { session, user };
}

/**
 * Persistenza best-effort della memoria di sessione nella memoria utente.
 */
export async function persistMemoryEngine(
  userId: string,
  sessionMemory: any
): Promise<void> {
  try {
    await mergeSessionIntoUserMemory(userId, {
      prefs: sessionMemory.preferences || {},
      corrections: sessionMemory.corrections || [],
    });
  } catch (err) {
    console.error("[ANOVA] Errore nel salvataggio della memoria utente:", err);
  }
}
