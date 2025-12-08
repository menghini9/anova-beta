// ANOVA_PROMPT_ENGINE_V1
// Motore che costruisce il super-prompt da inviare ai provider.

import type { Intent } from "../types";

export interface PromptEngineInput {
  intent: Intent;
  sessionMemory?: any;
  userMemory?: any;
}

export interface PromptEngineOutput {
  prompt: string;
}

/**
 * Versione estratta del vecchio buildAutoPrompt, ripulita e pronta per uso modulare.
 */
export function runPromptEngine(input: PromptEngineInput): PromptEngineOutput {
  const { intent, sessionMemory, userMemory } = input;
  const prompt = buildAutoPrompt(intent, sessionMemory, userMemory);
  return { prompt };
}

// === IMPLEMENTAZIONE AUTO-PROMPT (portata dal core legacy) === //

function buildAutoPrompt(
  intent: Intent,
  sessionMemory?: any,
  userMemory?: any
): string {
  const userText = intent.original.trim();

  // Casi semplici → niente arricchimento
  if (!intent.autoPromptNeeded) {
    return userText;
  }

  // 1️⃣ Micro-classificazione del tipo di risposta
  let responseType = "risposta_generica";
  if (intent.purpose === "code") responseType = "supporto_tecnico";
  else if (intent.purpose === "strategy") responseType = "analisi_strategica";
  else if (intent.purpose === "factual") responseType = "informazione_fattuale";
  else if (intent.purpose === "creative") responseType = "creatività_guidata";

  // 2️⃣ Preferenze di dettaglio e tono dalla memoria (sessione + utente)
  let memoryDetail: "low" | "medium" | "high" | undefined = undefined;
  let memoryTone: "concise" | "neutral" | "rich" | undefined = undefined;
  let goals: string[] = [];

  try {
    if (sessionMemory && typeof sessionMemory === "object") {
      if (Array.isArray(sessionMemory.goals)) {
        goals = sessionMemory.goals;
      }
      if (sessionMemory.preferences) {
        memoryDetail = sessionMemory.preferences.detail ?? memoryDetail;
        memoryTone = sessionMemory.preferences.tone ?? memoryTone;
      }
    }

    // Fallback: memoria utente persistente
    if (userMemory && typeof userMemory === "object") {
      if (!memoryDetail && userMemory.prefs?.detail) {
        memoryDetail = userMemory.prefs.detail;
      }
      if (!memoryTone && userMemory.prefs?.tone) {
        memoryTone = userMemory.prefs.tone;
      }
      if (Array.isArray(userMemory.goals) && goals.length === 0) {
        goals = userMemory.goals;
      }
    }
  } catch {
    // Non blocchiamo l'auto-prompt per problemi sulla memoria
  }

  // 3️⃣ Priorità: lessico V12 → memoria → complessità prompt
  let effectiveDetail: "low" | "medium" | "high";
  if (intent.lexiconDetail) {
    effectiveDetail = intent.lexiconDetail;
  } else if (memoryDetail) {
    effectiveDetail = memoryDetail;
  } else {
    effectiveDetail =
      intent.complexity === "high"
        ? "high"
        : intent.complexity === "medium"
        ? "medium"
        : "low";
  }

  if (intent.lexiconTone) {
    memoryTone = intent.lexiconTone;
  }

  let detailLevelText: string;
  if (effectiveDetail === "high") {
    detailLevelText = "molto dettagliata, strutturata e completa";
  } else if (effectiveDetail === "medium") {
    detailLevelText = "chiara e ben organizzata";
  } else {
    detailLevelText = "sintetica ma utile";
  }

  // 4️⃣ Tono suggerito (se appreso)
  let toneInstruction = "";
  if (memoryTone === "concise") {
    toneInstruction =
      "Usa un tono diretto e sintetico, senza giri di parole inutili.\n";
  } else if (memoryTone === "rich") {
    toneInstruction =
      "Usa un tono ricco, con esempi e immagini mentali, mantenendo comunque chiarezza.\n";
  } else if (memoryTone === "neutral") {
    toneInstruction =
      "Usa un tono professionale e neutrale, chiaro ma non eccessivamente informale.\n";
  }

  // 5️⃣ Identità di ANOVA per i provider
  const anovaIntro =
    "Tu sei un modello AI orchestrato da **ANOVA β**, un sistema cognitivo che coordina più intelligenze artificiali " +
    "per produrre risposte affidabili, strutturate e orientate all’obiettivo dell’utente. " +
    "ANOVA β fornisce un contesto standardizzato per migliorare la qualità della risposta.";

  // 6️⃣ Aggancio alla mini-memoria locale
  let memorySnippet = "";
  if (goals.length > 0) {
    memorySnippet +=
      "\n\n📚 **Contesto persistente (estratto dalla memoria):**\n" +
      `- Obiettivi ricorrenti dell’utente: ${goals.join(", ")}\n`;
  }

  if (memoryTone || memoryDetail) {
    memorySnippet += "\n🎛 **Preferenze apprese:**\n";
    if (memoryDetail === "high") {
      memorySnippet += "- L’utente tende a preferire risposte più approfondite.\n";
    } else if (memoryDetail === "low") {
      memorySnippet += "- L’utente tende a preferire risposte più sintetiche.\n";
    }
    if (memoryTone === "concise") {
      memorySnippet += "- Tono preferito: diretto e semplice.\n";
    } else if (memoryTone === "rich") {
      memorySnippet += "- Tono preferito: ricco e narrativo.\n";
    } else if (memoryTone === "neutral") {
      memorySnippet += "- Tono preferito: professionale e neutro.\n";
    }
  }

  // 7️⃣ Template finale del super-prompt
  return (
    `${anovaIntro}\n\n` +
    `⚡ **Contesto della richiesta attuale:**\n` +
    `L’utente ha chiesto: """${userText}"""\n\n` +
    `⚙️ **Tipo di risposta richiesta:** ${responseType}\n` +
    `📏 **Livello di dettaglio richiesto:** ${detailLevelText}\n` +
    memorySnippet +
    `\n🧩 **Obiettivi per la tua risposta:**\n` +
    `1. Rispondi in modo accurato, chiaro e non prolisso.\n` +
    `2. Se utile, suddividi in sezioni o passi operativi.\n` +
    `3. Mantieni coerenza e aderenza stretta alla richiesta.\n` +
    `4. Aggiungi note pratiche / avvertenze quando appropriate.\n` +
    `5. Evita contenuti inutili, vaghi o inventati.\n\n` +
    (toneInstruction ? `🎙 **Tono suggerito:** ${toneInstruction}\n` : "") +
    `🎯 **Missione finale:** Produrre la versione migliore possibile della risposta che un utente esperto si aspetterebbe.\n`
  );
}
