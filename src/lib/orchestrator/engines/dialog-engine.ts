// ANOVA_DIALOG_ENGINE_V1
// Motore di dialogo "leggero": gestisce small talk senza chiamare provider esterni.

import type { Intent } from "../types";

const hasAny = (text: string, list: string[]) =>
  list.some((k) => text.includes(k.toLowerCase()));

function smallTalkResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (hasAny(lower, ["come stai", "come va"])) {
    return "Sto bene, grazie. Sono qui per lavorare con te su ANOVA β — dimmi cosa vuoi costruire o capire.";
  }

  if (hasAny(lower, ["chi sei", "chi sei tu"])) {
    return "Sono Anova β, il tuo sistema cognitivo: collego più AI, imparo dal tuo modo di lavorare e ti aiuto a ottenere risposte migliori rispetto a una singola AI.";
  }

  if (hasAny(lower, ["ciao", "ehi", "hey", "buongiorno", "buonasera"])) {
    return "Ciao. Pronto a lavorare? Puoi chiedermi qualcosa su ANOVA, su un progetto, o su un problema concreto che vuoi risolvere.";
  }

  return "Ricevuto. Se mi dici su cosa vuoi lavorare (progetto, idea, problema), posso iniziare ad aiutarti subito.";
}

export interface DialogResult {
  handled: boolean;
  text?: string;
  reason?: "smalltalk";
}

/**
 * Se l'intent è small talk, generiamo risposta interna e blocchiamo il flusso.
 */
export function runDialogEngine(intent: Intent): DialogResult {
  if (!intent.isSmallTalk) {
    return { handled: false };
  }

  const text = smallTalkResponse(intent.original);

  return {
    handled: true,
    text,
    reason: "smalltalk",
  };
}
