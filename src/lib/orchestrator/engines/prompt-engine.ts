// ANOVA_PROMPT_ENGINE_V2
// Super-prompt basato su "Manifesto Esecutivo" + contesto minimo.
// Obiettivo: far lavorare le AI dentro regole stabili, senza citare provider/modelli.

import type { Intent } from "../types";

export interface PromptEngineInput {
  intent: Intent;
  sessionMemory?: any;
  userMemory?: any;
}

export interface PromptEngineOutput {
  prompt: string;
}

/* ======================================================
 * 0) MANIFESTO ESECUTIVO (V1)
 *    - È la "libreria" di regole che ogni AI deve seguire.
 *    - Non deve mai citare provider, routing, fusion.
 * ====================================================== */
const MANIFESTO_V1 = `
# ANOVA — MANIFESTO OPERATIVO PER LE AI (V1)

## IDENTITÀ
Tu sei ANOVA β, un assistente AI. Rispondi come un’unica voce: naturale, competente, utile.
NON citare modelli, provider, routing o sistemi interni.

## INPUT DISPONIBILI
Riceverai:
1) Richiesta utente (testo grezzo)
2) Questo manifesto
3) Eventuali dettagli aggiunti dall’utente in seguito

Non hai memoria autonoma: ricostruisci contesto solo da ciò che ricevi.

## CLASSIFICAZIONE OBBLIGATORIA (scegli UNA categoria)
A) INFORMATIVA → l’utente vuole capire
B) OPERATIVA/CREATIVA → l’utente vuole ottenere un output (sito, piano, codice, procedura…)
C) DIALOGO → conversazione/feedback/valutazione

Se sei incerto, scegli INFORMATIVA.

## PROCEDURA INFORMATIVA
- Se tema ampio o ambiguo: NON rispondere subito.
- Produci una checklist di chiarimento con opzioni selezionabili (non domande vaghe).
- Non chiedere “vuoi risposta lunga/corta” come prima cosa.

## PROCEDURA OPERATIVA/CREATIVA
- NON produrre subito il lavoro finale se mancano dati.
- Genera checklist completa (fondamentali vs opzionali).
- Assumi che l’utente non sappia cosa serve: proponi tu le opzioni.

## PROCEDURA DIALOGO
- Rispondi naturale, breve, coerente.
- Niente checklist se non servono.

## OUTPUT (scegli UNO solo formato)
1) Checklist di chiarimento
2) Domande mirate (1–3) tecniche
3) Risposta completa
4) Risposta dialogica
`;

/* ======================================================
 * 1) RUN ENGINE
 * ====================================================== */
export function runPromptEngine(input: PromptEngineInput): PromptEngineOutput {
  const { intent, sessionMemory, userMemory } = input;
  const prompt = buildAutoPrompt(intent, sessionMemory, userMemory);
  return { prompt };
}

/* ======================================================
 * 2) BUILD AUTO PROMPT
 * ====================================================== */
function buildAutoPrompt(intent: Intent, sessionMemory?: any, userMemory?: any): string {
  const userText = (intent.original ?? "").trim();

  // ---- 2.1 Contesto minimo dalla memoria (senza “preferenze stile” aggressive)
  const memory = extractMemorySnippet(sessionMemory, userMemory);

  // ---- 2.2 Mini guida operativa (molto corta) basata sull’intent
  // Nota: NON chiediamo mai subito “lungo/corto”. Si usa solo come hint.
  const intentHints = buildIntentHints(intent);

  // ---- 2.3 Prompt finale: Manifesto + contesto + richiesta
  // Importante: struttura sempre uguale per stabilità e debug.
  return `
${MANIFESTO_V1}

---

## CONTESTO (se presente)
${memory || "Nessun contesto aggiuntivo disponibile."}

---

## SEGNALI DALL'INTENT (non obbligatori, solo hint)
${intentHints}

---

## RICHIESTA UTENTE (testo originale)
"""${userText}"""

---

## ISTRUZIONE FINALE
1) Classifica la richiesta (A/B/C) secondo manifesto.
2) Applica la procedura relativa.
3) Produci SOLO l’output scelto (uno dei 4 formati).
`.trim();
}

/* ======================================================
 * 3) HELPERS
 * ====================================================== */
function extractMemorySnippet(sessionMemory?: any, userMemory?: any): string {
  try {
    const lines: string[] = [];

    // Obiettivi ricorrenti (se esistono)
    const goals =
      (Array.isArray(sessionMemory?.goals) && sessionMemory.goals) ||
      (Array.isArray(userMemory?.goals) && userMemory.goals) ||
      [];

    if (goals.length > 0) {
      lines.push(`- Obiettivi ricorrenti: ${goals.join(", ")}`);
    }

    // Ultimi prompt (se esistono) — utile per “continuità chat”
    const lastPrompts = Array.isArray(sessionMemory?.lastPrompts)
      ? sessionMemory.lastPrompts
      : [];

    if (lastPrompts.length > 0) {
      const last = String(lastPrompts[lastPrompts.length - 1] ?? "").slice(0, 220);
      if (last.trim()) lines.push(`- Ultimo contesto (estratto): ${last}${last.length >= 220 ? "…" : ""}`);
    }

    // Eventuali note di sessione
    const notes = typeof sessionMemory?.notes === "string" ? sessionMemory.notes.trim() : "";
    if (notes) lines.push(`- Note sessione: ${notes.slice(0, 220)}${notes.length >= 220 ? "…" : ""}`);

    return lines.join("\n");
  } catch {
    return "";
  }
}

function buildIntentHints(intent: Intent): string {
  const hints: string[] = [];

  if (intent?.purpose) hints.push(`- Dominio stimato: ${intent.purpose}`);
  if (intent?.mode) hints.push(`- Mode stimata: ${intent.mode}`);
  if (intent?.isSmallTalk) hints.push(`- Small talk: true`);
  if (intent?.isSimpleQuestion) hints.push(`- Domanda semplice: true`);
  if (intent?.needsClarification) hints.push(`- Needs clarification: true (${intent.clarificationType ?? "n/a"})`);

  // Non vincoliamo l’AI, è solo segnale.
  if (intent?.complexity) hints.push(`- Complessità stimata: ${intent.complexity}`);

  return hints.length ? hints.join("\n") : "Nessun segnale utile dall’intent.";
}
