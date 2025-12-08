// ANOVA_INTENT_ENGINE_V1 (MINIMALE)
// Intent engine pulito, senza dipendenze legacy.

import type { Intent, Domain } from "../types";

/**
 * Riconoscimento dominio semplice e robusto.
 */
function detectDomain(prompt: string): Domain {
  const p = prompt.toLowerCase();

  if (
    p.includes("codice") ||
    p.includes("programmazione") ||
    p.includes("script") ||
    p.includes("ts ") ||
    p.includes("js ") ||
    p.includes("bug")
  ) {
    return "code";
  }

  if (
    p.includes("crea") ||
    p.includes("storia") ||
    p.includes("romanzo") ||
    p.includes("narrazione") ||
    p.includes("idea creativa")
  ) {
    return "creative";
  }

  if (
    p.includes("perché") ||
    p.includes("spiega") ||
    p.includes("informazioni") ||
    p.includes("dati") ||
    p.includes("definizione")
  ) {
    return "factual";
  }

  if (
    p.includes("strategia") ||
    p.includes("business") ||
    p.includes("azienda") ||
    p.includes("piano")
  ) {
    return "strategy";
  }

  // fallback
  return "logic";
}

/**
 * Riconoscimento smalltalk.
 */
function detectSmallTalk(prompt: string): boolean {
  const p = prompt.toLowerCase();

  return (
    p === "ciao" ||
    p.includes("come stai") ||
    p.includes("buongiorno") ||
    p.includes("buonasera") ||
    p.includes("che fai") ||
    p.includes("tutto bene")
  );
}

/**
 * Intent Engine minimizzato e robusto.
 */
export function runIntentEngine(
  prompt: string,
  userId?: string
): { intent: Intent } {
  const trimmed = prompt.trim();

  const smallTalk = detectSmallTalk(trimmed);
  const domain = detectDomain(trimmed);

  const intent: Intent = {
    original: prompt,
    userId,

    // dominio principale
    purpose: domain,

    // default moderni
    tone: "neutral",
    complexity: "medium",

    // meta
    keywords: [],
    lexiconDetail: undefined,
    lexiconTone: undefined,

    isSmallTalk: smallTalk,
    needsClarification: false,
    clarificationType: undefined,
    autoPromptNeeded: !smallTalk && trimmed.length < 12, // frasi troppo brevi → migliora prompt
    mode: smallTalk ? "chat" : "question",
    isSimpleQuestion: trimmed.endsWith("?") && trimmed.length < 40,
  };

  return { intent };
}
