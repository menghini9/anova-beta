// ⬇️ BLOCCO 13.1 — /src/lib/orchestrator/index.ts
// ANOVA_ORCHESTRATOR_V60_CORE

import type {
  Intent,
  FusionResult,
  ProviderResponse,
  OrchestrationMeta,
} from "./types";
import { fanout } from "./router";
import { fuse } from "./fusion";
import { logPerformance } from "./learn";
import { updateSessionMemory, getSessionMemory } from "./memory/sessionMemory";
import {
  loadUserMemory,
  applyMemoryToIntent,
  mergeSessionIntoUserMemory,
} from "./memory/userMemory";
// 🌐 Preference Engine (V12)
import { analyzeTextPreferences } from "@/lib/orchestrator/preference-engine/preferencesLexicon";
import { detectUserPreferenceStatement } from "@/lib/orchestrator/preference-engine/detectPreference";
import { buildPreferenceAck } from "@/lib/orchestrator/preference-engine/preferenceReply";

// 🔤 Vocabolario preferenze (V12)

// 🔎 Helper generico per parole chiave
const hasAny = (text: string, list: string[]) =>
  list.some((k) => text.includes(k.toLowerCase()));

/* =========================================================
   1) CLARIFICATION ENGINE — DOMANDE DI CHIARIMENTO
   ========================================================= */

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

  // Richiesta di obiettivo troppo vaga
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
/* =========================================================
   2) AUTO-PROMPT ENGINE v2.5 — SPIEGAZIONE AD ALTRE AI
   + Adattamento alle preferenze in memoria (sessione + utente)
   ========================================================= */

function buildAutoPrompt(
  intent: Intent,
  sessionMemory?: any,
  userMemory?: any
): string {
  const userText = intent.original.trim();

  // Se non vogliamo arricchire (casi ultra-semplici)
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

    // Fallback: se la sessione non ha ancora imparato nulla, usiamo la memoria utente persistente
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
// 🥇 PRIORITÀ MASSIMA → V12 Lexicon
let effectiveDetail: "low" | "medium" | "high";
if (intent.lexiconDetail) {
  effectiveDetail = intent.lexiconDetail;
}
// 🥈 Secondo livello → Memoria (sessione o utente)
else if (memoryDetail) {
  effectiveDetail = memoryDetail;
}
// 🥉 Fallback → Complessità del prompt
else {
  effectiveDetail =
    intent.complexity === "high"
      ? "high"
      : intent.complexity === "medium"
      ? "medium"
      : "low";
}

// 🔊 Priorità per il tono
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

  // 4️⃣ Tono suggerito (se la memoria ha imparato qualcosa)
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

  // 5️⃣ Identità di ANOVA da trasmettere alle AI
  const anovaIntro =
    "Tu sei un modello AI orchestrato da **ANOVA β**, un sistema cognitivo che coordina più intelligenze artificiali " +
    "per produrre risposte affidabili, strutturate e orientate all’obiettivo dell’utente. " +
    "ANOVA β fornisce un contesto standardizzato per migliorare la qualità della risposta.";

  // 6️⃣ (Facoltativo) Aggancio alla mini-memoria locale
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

  // 7️⃣ Template evoluto del prompt migliorato
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

/* =========================================================
   3) SMALL TALK ENGINE — SENZA CHIAMARE LE AI ESTERNE
   ========================================================= */

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

/* =========================================================
   4) INTENT ENGINE — CLASSIFICAZIONE E CLARITY
   ========================================================= */

export function analyzeIntent(prompt: string, userId?: string): Intent {
  const lower = prompt.toLowerCase().trim();

  // ⬇️ V12 LEXICON — interpretazione aggettivi semplici
const { detail: lexDetail, tone: lexTone } = analyzeTextPreferences(lower);
const words = lower.split(/\s+/).filter(Boolean);

// Assegniamo le preferenze direttamente all'intent
let lexiconDetail: "low" | "medium" | "high" | undefined = lexDetail;
let lexiconTone: "concise" | "neutral" | "rich" | undefined = lexTone;


  const codeHints = [
    "code",
    "typescript",
    "javascript",
    "bug",
    "function",
    "api",
    "firebase",
    "next.js",
    "errore",
  ];
  const factualHints = [
    "fonte",
    "citazione",
    "data",
    "numero",
    "prezzo",
    "legge",
    "statistica",
  ];
  const creativeHints = [
    "poesia",
    "stile",
    "narrazione",
    "metafora",
    "storytelling",
  ];
  const strategyHints = [
    "strategia",
    "piano",
    "roadmap",
    "kpi",
    "go-to-market",
    "pricing",
    "modello di business",
  ];

  let purpose: Intent["purpose"] = "logic";
  if (hasAny(lower, codeHints)) purpose = "code";
  else if (hasAny(lower, factualHints)) purpose = "factual";
  else if (hasAny(lower, creativeHints)) purpose = "creative";
  else if (hasAny(lower, strategyHints)) purpose = "strategy";

  const complexity: Intent["complexity"] =
    lower.length > 600 ? "high" : lower.length > 200 ? "medium" : "low";

  const isQuestion =
    lower.includes("?") ||
    hasAny(lower, ["cos'è", "cosa è", "spiegami", "che cos'", "perché", "perche "]);

  const isGreeting = hasAny(lower, [
    "ciao",
    "hey",
    "ehi",
    "buongiorno",
    "buonasera",
  ]);
  const asksWhoAreYou = hasAny(lower, ["chi sei", "chi sei tu"]);
  const mentionsAnova = lower.includes("anova");

  const isSmallTalk =
    (isGreeting || asksWhoAreYou) &&
    lower.length < 120 &&
    !hasAny(lower, ["bug", "errore", "firebase", "next.js"]);

  const wordCount = words.length;


  // —— Clarification Engine —— //
  let needsClarification = false;
  let clarificationType: Intent["clarificationType"] = undefined;

  // 1) Ambiguità specifica su ANOVA (statistica vs sistema)
  if (mentionsAnova && !lower.includes("statistica") && !lower.includes("varianza")) {
    if (hasAny(lower, ["cos'è", "cosa è", "spiegami", "che cos'"])) {
      needsClarification = true;
      clarificationType = "anova_ambiguous";
    }
  }

  // 2) Richieste estremamente corte e generiche (tipo “fammi una frase”)
  const genericImperative = hasAny(lower, [
    "fammi",
    "scrivimi",
    "dimmi",
    "dammi",
    "creami",
  ]);
  const hasNoConcreteTopic =
    !hasAny(lower, [
      "startup",
      "azienda",
      "codice",
      "programma",
      "app",
      "sito",
      "firebase",
      "next.js",
      "api",
      "map",
      "mappa",
      "atlas",
      "anova",
      "beta",
    ]);

  if (!needsClarification && wordCount <= 4 && genericImperative && hasNoConcreteTopic) {
    needsClarification = true;
    clarificationType = "vague_goal";
  }

  // 3) Altre richieste vaghe tipo "aiutami", "fammi un piano"
  const vagueGoalPatterns = [
    "fammi un piano",
    "fammi un progetto",
    "organizza",
    "aiutami",
    "dammi un piano",
    "cosa devo fare domani",
    "consigliami qualcosa",
  ];

  if (!needsClarification && hasAny(lower, vagueGoalPatterns) && lower.length < 200) {
    needsClarification = true;
    clarificationType = "vague_goal";
  }

  // 4) Fallback: prompt molto corto e generico senza punto di domanda
  if (
    !needsClarification &&
    !isQuestion &&
    !isSmallTalk &&
    wordCount <= 3 &&
    hasNoConcreteTopic
  ) {
    needsClarification = true;
    clarificationType = "generic";
  }

  const mode: Intent["mode"] =
    isSmallTalk ? "smalltalk" : isQuestion ? "question" : "chat";

  // 🔥 AutoPrompt Engine v2.5 — più aggressivo
  const autoPromptNeeded =
    purpose === "code" ||
    purpose === "strategy" ||
    complexity === "high" ||
    hasAny(lower, ["dettagliato", "step by step", "molto preciso", "analisi"]) ||
    (!isSmallTalk && !needsClarification && wordCount >= 4 && wordCount <= 60);

  const isSimpleQuestion =
    isQuestion && !isSmallTalk && complexity === "low" && !needsClarification;

 return {
  original: prompt,
  userId,

  purpose,
  complexity,

  // 🔤 Parole del prompt già pronte (split corretto)
  keywords: words,

  // 🎛 Preferenze lessicali V12
  lexiconDetail,
  lexiconTone,

  // 🧠 Flag intelligenti
  isSmallTalk,
  isSimpleQuestion,
  needsClarification,
  clarificationType,

  // Modalità rilevata
  mode,

  // L’auto-prompt è richiesto se non è smalltalk e non è domanda semplice
  autoPromptNeeded: !isSmallTalk && !isSimpleQuestion,
  
  // 🔧 tono base se la lexicon non decide diversamente
  tone: lexiconTone ?? "neutral",
};

}

/* =========================================================
   5) CORE — getAIResponse usata da /api/orchestrate
   ========================================================= */

export async function getAIResponse(
  prompt: string,
  userId?: string
): Promise<{
  fusion: FusionResult;
  raw: ProviderResponse[];
  meta: OrchestrationMeta;
  costThisRequest: number;
}> {
  const intent = analyzeIntent(prompt, userId);

  // 🧠 Memoria utente persistente (se abbiamo userId)
  const userMemory = userId ? await loadUserMemory(userId) : undefined;

  // 🔐 Mini-memoria di sessione (locale, lato server)
  updateSessionMemory(prompt, intent.purpose);
  const sessionMemory = getSessionMemory();
  
  // 💡 Preference Engine — intercetta frasi come “preferisco risposte lunghe”
  {
    const prefResult = detectUserPreferenceStatement(prompt);

    // Caso 1: il parser NON ha trovato nulla → si prosegue normalmente
    if (!prefResult.preference && !prefResult.needsClarification) {
      // non è una frase di stile, si continua con il flusso normale
    } else if (prefResult.needsClarification && prefResult.clarificationQuestion) {
      // Caso 2: frase ambigua → SOLO domanda di chiarimento, nessun salvataggio
      return {
        fusion: {
          finalText: prefResult.clarificationQuestion,
          fusionScore: 1,
          used: [],
        },
        raw: [],
        meta: {
          intent,
          smallTalkHandled: false,
          clarificationUsed: true,
          autoPromptUsed: false,
          // segnaliamo che era una frase di stile ma incerta
          preferenceDetected: false,
          stats: { callsThisRequest: 0, providersRequested: [] },
          memory: sessionMemory,
        },
        costThisRequest: 0,
      };
    } else if (prefResult.preference && prefResult.preference.confidence === "high") {
      // Caso 3: preferenza chiara → salviamo e rispondiamo subito

      const preferenceHit = prefResult.preference;

      // 1️⃣ Aggiorniamo sessionMemory → così l'autoPrompt la usa subito
      sessionMemory.preferences = {
        ...(sessionMemory.preferences || {}),
        detail: preferenceHit.detail ?? sessionMemory.preferences?.detail,
        tone: preferenceHit.tone ?? sessionMemory.preferences?.tone,
      };

      // 2️⃣ Aggiorniamo memoria utente persistente (se loggato)
      if (userId && preferenceHit.scope === "persistent") {
        try {
          const patch = {
            prefs: {
              detail: preferenceHit.detail,
              tone: preferenceHit.tone,
            },
          };

          await mergeSessionIntoUserMemory(userId, sessionMemory);
        } catch (err) {
          console.error("[ANOVA] Errore aggiornamento preferenze:", err);
        }
      }

      // 3️⃣ Risposta immediata, nessun provider chiamato
      const lastAnswerExists =
        sessionMemory.lastPrompts && sessionMemory.lastPrompts.length > 0;

      const ack = buildPreferenceAck(preferenceHit, lastAnswerExists);

      return {
        fusion: { finalText: ack, fusionScore: 1, used: [] },
        raw: [],
        meta: {
          intent,
          smallTalkHandled: false,
          clarificationUsed: false,
          autoPromptUsed: false,
          preferenceDetected: true,
          stats: { callsThisRequest: 0, providersRequested: [] },
          memory: sessionMemory,
        },
        costThisRequest: 0,
      };
    }
  }


  // 1️⃣ Small talk (nessuna AI esterna)
  if (intent.isSmallTalk) {
    const text = smallTalkResponse(prompt);

    const fusion: FusionResult = {
      finalText: text,
      fusionScore: 1,
      used: [],
    };

    const meta: OrchestrationMeta = {
      intent,
      smallTalkHandled: true,
      clarificationUsed: false,
      autoPromptUsed: false,
      stats: {
        callsThisRequest: 0,
        providersRequested: [],
      },
      memory: sessionMemory,
    };

    return {
      fusion,
      raw: [],
      meta,
      costThisRequest: 0,
    };
  }

  // 2️⃣ Richiesta ambigua → domanda di chiarimento (nessun provider chiamato)
  if (intent.needsClarification) {
    const text = buildClarificationQuestion(intent);

    const fusion: FusionResult = {
      finalText: text,
      fusionScore: 1,
      used: [],
    };

    const meta: OrchestrationMeta = {
      intent,
      smallTalkHandled: false,
      clarificationUsed: true,
      autoPromptUsed: false,
      stats: {
        callsThisRequest: 0,
        providersRequested: [],
      },
      memory: sessionMemory,
    };

    return {
      fusion,
      raw: [],
      meta,
      costThisRequest: 0,
    };
  }

  // 3️⃣ Preparazione dell’auto-prompt (prompt arricchito per le AI esterne)
  const improvedPrompt = buildAutoPrompt(intent, sessionMemory, userMemory);


  const intentForProviders: Intent = {
    ...intent,
    original: improvedPrompt,
  };

  // 4️⃣ Chiamate parallele alle AI (fanout con routing in base al dominio)
  const { results: raw, stats } = await fanout(intentForProviders);

  // 5️⃣ Log di performance
  await Promise.all(
    raw
      .filter((r) => r.success)
      .map((r) =>
        logPerformance({
          provider: r.provider,
          domain: intent.purpose,
          score: Math.min(1, Math.max(0, r.text.length / 2000)),
          latencyMs: r.latencyMs,
          ts: Date.now(),
        })
      )
  );

  // 6️⃣ Fusione risposte (ora consapevole del dominio)
  const fusion = fuse(raw, intent.purpose as any);

  // 7️⃣ Meta per pannello orchestratore
  const meta: OrchestrationMeta = {
    intent,
    smallTalkHandled: false,
    clarificationUsed: false,
    autoPromptUsed: !!intent.autoPromptNeeded,
    stats,
    autoPromptText: improvedPrompt,
    memory: sessionMemory,
  };

  // 8️⃣ Costo della singola richiesta (somma costi provider)
  const costThisRequest = raw.reduce(
    (acc, r) => acc + (r.estimatedCost ?? 0),
    0
  );
  // 9️⃣ Aggiornamento memoria utente persistente (best effort, non blocca la risposta)
  if (userId) {
    try {
      console.log("🧩 MERGE CALL → userId:", userId);
console.log("🧩 MERGE CALL → sessionMemory:", sessionMemory);

mergeSessionIntoUserMemory(userId, {
  prefs: sessionMemory.preferences || {},
  corrections: sessionMemory.corrections || [],
});


console.log("🧩 MERGE CALL → COMPLETED");

    } catch (err) {
      console.error("[ANOVA] Errore nel salvataggio della memoria utente:", err);
    }
  }

  return {
    fusion,
    raw,
    meta,
    costThisRequest,
  };

}

// ⬆️ FINE BLOCCO 13.1 — ANOVA_ORCHESTRATOR_V60_CORE
