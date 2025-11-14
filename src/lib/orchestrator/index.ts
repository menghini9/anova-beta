// ⬇️ BLOCCO 13.1 — /src/lib/orchestrator/index.ts
// ANOVA_ORCHESTRATOR_V42_INTENT_REFINER

import type { Intent, FusionResult, ProviderResponse, OrchestrationMeta } from "./types";
import { fanout } from "./router";
import { fuse } from "./fusion";
import { logPerformance } from "./learn";

// 🔎 Heuristica semplice per parole chiave
const hasAny = (text: string, list: string[]) =>
  list.some((k) => text.includes(k));

function buildClarificationQuestion(intent: Intent): string {
  const lower = intent.original.toLowerCase();
  const mentionsAnova = lower.includes("anova");

  if (intent.clarificationType === "anova_ambiguous" || mentionsAnova) {
    return (
      'Quando scrivi "ANOVA", ti riferisci alla tecnica statistica ' +
      '(Analysis of Variance) oppure ad **Anova β**, il sistema cognitivo che stai usando ora? ' +
      "Dimmi quale delle due, così posso allinearmi a quello che ti serve davvero."
    );
  }

  if (intent.clarificationType === "vague_goal") {
    return (
      "La tua richiesta è molto aperta e può voler dire tante cose. " +
      "Per aiutarti meglio, specifica:\n" +
      "• ambito (personale, business, tecnico)\n" +
      "• obiettivo principale\n" +
      "• vincoli o risorse che hai\n\n" +
      "Con questi tre punti, posso costruire un piano molto più preciso."
    );
  }

  return (
    "Posso interpretare la tua richiesta in più modi. " +
    "Puoi aggiungere qualche dettaglio in più (contesto, obiettivo, livello di dettaglio) " +
    "così ottimizzo meglio la risposta?"
  );
}

function buildAutoPrompt(intent: Intent): string {
  if (!intent.autoPromptNeeded) return intent.original;

  // 🧠 Auto-prompt: ANOVA spiega alle AI cosa sta succedendo
  return (
    "Agisci come ANOVA β, un orchestratore che usa più modelli di intelligenza artificiale " +
    "per aiutare un utente umano.\n\n" +
    "Obiettivo: rispondere in modo chiaro, strutturato, pratico e non prolisso.\n" +
    "Se utile, suddividi la risposta in passi operativi.\n\n" +
    "Richiesta dell'utente:\n" +
    '"""' +
    intent.original +
    '"""'
  );
}

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

// 🧠 Analisi intenzione + flag intelligenti
export function analyzeIntent(prompt: string, userId?: string): Intent {
  const lower = prompt.toLowerCase();

  const codeHints = ["code", "typescript", "javascript", "bug", "function", "api", "firebase", "next.js", "errore"];
  const factualHints = ["fonte", "citazione", "data", "numero", "prezzo", "legge", "statistica"];
  const creativeHints = ["poesia", "stile", "narrazione", "metafora", "storytelling"];
  const strategyHints = ["strategia", "piano", "roadmap", "kpi", "go-to-market", "pricing", "modello di business"];

  let purpose: Intent["purpose"] = "logic";
  if (hasAny(lower, codeHints)) purpose = "code";
  else if (hasAny(lower, factualHints)) purpose = "factual";
  else if (hasAny(lower, creativeHints)) purpose = "creative";
  else if (hasAny(lower, strategyHints)) purpose = "strategy";

  const complexity: Intent["complexity"] =
    lower.length > 600 ? "high" : lower.length > 200 ? "medium" : "low";

  const isQuestion = lower.includes("?") || hasAny(lower, ["cos'è", "cosa è", "spiegami", "che cos'", "perché"]);
  const isGreeting = hasAny(lower, ["ciao", "hey", "ehi", "buongiorno", "buonasera"]);
  const asksWhoAreYou = hasAny(lower, ["chi sei", "chi sei tu"]);
  const mentionsAnova = lower.includes("anova");

  const isSmallTalk =
    (isGreeting || asksWhoAreYou) &&
    lower.length < 120 &&
    !hasAny(lower, ["bug", "errore", "firebase", "next.js"]);

  // 🔍 Ambiguità specifica su ANOVA
  let needsClarification = false;
  let clarificationType: Intent["clarificationType"] = undefined;

  if (mentionsAnova && !lower.includes("statistica") && !lower.includes("varianza")) {
    if (hasAny(lower, ["cos'è", "cosa è", "spiegami", "che cos'"])) {
      needsClarification = true;
      clarificationType = "anova_ambiguous";
    }
  }

  // Richieste vaghe del tipo "fammi un piano", "aiutami per domani"
  const vagueGoalPatterns = ["fammi un piano", "organizza", "aiutami", "dammi un piano", "cosa devo fare domani"];
  if (!needsClarification && hasAny(lower, vagueGoalPatterns) && lower.length < 120) {
    needsClarification = true;
    clarificationType = "vague_goal";
  }

  const mode: Intent["mode"] =
    isSmallTalk ? "smalltalk" : isQuestion ? "question" : "chat";

  const autoPromptNeeded =
    purpose === "code" ||
    purpose === "strategy" ||
    complexity === "high" ||
    hasAny(lower, ["dettagliato", "step by step", "molto preciso", "analisi"]);

  const isSimpleQuestion =
    isQuestion && !isSmallTalk && complexity === "low" && !needsClarification;

  return {
    purpose,
    tone: "neutral",
    complexity,
    keywords: [],
    original: prompt,
    userId,
    mode,
    isSmallTalk,
    isSimpleQuestion,
    needsClarification,
    clarificationType,
    autoPromptNeeded,
  };
}

// 🚀 Funzione principale usata dalla API /api/orchestrate
export async function getAIResponse(
  prompt: string,
  userId?: string
): Promise<{
  fusion: FusionResult;
  raw: ProviderResponse[];
  meta: OrchestrationMeta;
}> {

  const intent = analyzeIntent(prompt, userId);

  // 1️⃣ Small talk: risposta locale, nessuna chiamata esterna
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
    };

    return { fusion, raw: [], meta };
  }

  // 2️⃣ Richiesta ambigua: prima chiedo chiarimenti, poi eventualmente userò le AI
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
    };

    return { fusion, raw: [], meta };
  }


  // 3️⃣ Costruisco eventuale auto-prompt per le AI
  const intentForProviders: Intent = {
    ...intent,
    original: buildAutoPrompt(intent),
  };

  const raw = await fanout(intentForProviders);

  // log minimo performance (solo success)
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

  const fusion = fuse(raw);

  const meta: OrchestrationMeta = {
    intent,
    smallTalkHandled: false,
    clarificationUsed: false,
    autoPromptUsed: !!intent.autoPromptNeeded,
  };

  return { fusion, raw, meta };
}

// ⬆️ FINE BLOCCO 13.1
