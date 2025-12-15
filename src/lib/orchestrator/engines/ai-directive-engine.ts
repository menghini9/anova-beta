// ANOVA_AI_DIRECTIVE_ENGINE_V1
// Path: /src/lib/orchestrator/engines/ai-directive-engine.ts
//
// Chiama i provider "econ" per ottenere DIRETTIVE (categoria, domande, checklist, superprompt).
// Non produce la risposta finale: produce "cosa fare dopo".

import type { ProviderResponse, ProviderId } from "../types";
import type { ContextPacket, AiDirectiveResult } from "../context/context-packet";
import { ANOVA_MANIFESTO_TEXT } from "../manifesto/manifesto";

// Parser robusto: accetta JSON o JSON-like
function safeJsonParse(text: string): any | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // Tentativo semplice: rimuove triple backticks se presenti
    const cleaned = text
      .replace(/```json/gi, "```")
      .replace(/```/g, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

export function buildDirectivePrompt(packet: ContextPacket): string {
  const context = {
    phase: packet.phase,
    category: packet.category ?? null,
    userRequest: packet.userRequest,
    userAnswers: packet.userAnswers ?? {},
    checklist: packet.checklist ?? [],
    superPrompt: packet.superPrompt ?? null,
  };

  return [
    ANOVA_MANIFESTO_TEXT,
    "\n\n# USER REQUEST\n" + packet.userRequest,
    "\n\n# CONTEXT PACKET (JSON)\n" + JSON.stringify(context, null, 2),
    "\n\n# OUTPUT\nRestituisci SOLO il JSON richiesto dal Manifesto.",
  ].join("\n");
}

export function normalizeDirective(raw: any, sourceProvider: ProviderId): AiDirectiveResult {
  // Hard defaults per evitare undefined
  const category = raw?.category ?? "INFORMATIVE";
  const confidence = Number(raw?.confidence ?? 0.5);
  const phaseNext = raw?.phaseNext ?? "UNDERSTAND";
  const needsUserInput = Boolean(raw?.needsUserInput ?? false);

  const questions = Array.isArray(raw?.questions) ? raw.questions.filter(Boolean) : [];
  const checklist = Array.isArray(raw?.checklist) ? raw.checklist : [];

  const superPrompt = typeof raw?.superPrompt === "string" ? raw.superPrompt : undefined;
  const finalAnswer = typeof raw?.finalAnswer === "string" ? raw.finalAnswer : undefined;
  const notesForOrchestrator = Array.isArray(raw?.notesForOrchestrator)
    ? raw.notesForOrchestrator.filter(Boolean)
    : [];

  return {
    category,
    confidence: Math.max(0, Math.min(1, confidence)),
    phaseNext,
    needsUserInput,
    questions,
    checklist,
    superPrompt,
    finalAnswer,
    notesForOrchestrator,
    sourceProvider,
  } as AiDirectiveResult;
}

/**
 * Prende le risposte provider e prova a estrarre la direttiva migliore.
 * Sceglie la prima risposta parseabile con confidence più alta.
 */
export function pickBestDirective(responses: ProviderResponse[]): AiDirectiveResult | null {
  const parsed: AiDirectiveResult[] = [];

  for (const r of responses) {
    if (!r?.success || !r.text) continue;
    const json = safeJsonParse(r.text);
    if (!json) continue;
    parsed.push(normalizeDirective(json, r.provider));
  }

  if (parsed.length === 0) return null;
  parsed.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  return parsed[0];
}
