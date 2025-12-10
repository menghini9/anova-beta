// ANOVA_ORCHESTRATOR_CORE_V1
// Nuovo core orchestratore modulare di ANOVA β.

// =========================
// 0) TIPI
// =========================
import type {
  Intent,
  FusionResult,
  ProviderResponse,
  OrchestrationMeta,
  Domain,
  ProviderId,
} from "./types";

// =========================
// 1) ENGINE — livello cognitivo
// =========================
import { runIntentEngine } from "./engines/intent-engine";
import { runClarityEngine } from "./engines/clarity-engine";
import { runChecklistEngine } from "./engines/checklist-engine";
import { runPromptEngine } from "./engines/prompt-engine";
import { runRoutingEngine } from "./engines/routing-engine";
import { runFusionEngine } from "./engines/fusion-engine";
import { runDomainClassifier } from "./engines/domain-classifier";
import { runDialogEngine } from "./engines/dialog-engine";

// =========================
// 2) QUANTUM MODEL
// =========================
import { buildQuantumState } from "./quantum/quantum-model";

// =========================
// 3) MEMORY SYSTEM
// =========================
import {
  initMemoryEngine,
  persistMemoryEngine,
} from "./memory/memory-core";

import { mergeSessionIntoUserMemory } from "./memory/userMemory";

// =========================
// 4) PREFERENCE ENGINE
// =========================
import { detectUserPreferenceStatement } from "./preference-engine/detectPreference";
import { buildPreferenceAck } from "./preference-engine/preferenceReply";

// =========================
// 5) PROVIDER REALI
// =========================
// OPENAI
import {
  invokeOpenAIEconomic,
  invokeOpenAIBalanced,
  invokeOpenAIPremium
} from "../providers/openai";

// ANTHROPIC
import {
  invokeAnthropicEconomic,
  invokeAnthropicBalanced,
  invokeAnthropicPremium
} from "../providers/anthropic";

// GEMINI
import {
  invokeGeminiEconomic,
  invokeGeminiBalanced,
  invokeGeminiPremium
} from "../providers/gemini";


// =========================
// 1) EXECUTOR PROVIDER
// =========================

async function executeProviders(
  providers: ProviderId[],
  prompt: string
): Promise<ProviderResponse[]> {
  if (!providers || providers.length === 0) return [];

  const calls: Promise<ProviderResponse>[] = [];

  for (const p of providers) {
switch (p) {
  case "openai:econ":
    calls.push(invokeOpenAIEconomic(prompt));
    break;

  case "openai:mid":
    calls.push(invokeOpenAIBalanced(prompt));
    break;

  case "openai:max":
    calls.push(invokeOpenAIPremium(prompt));
    break;

  case "anthropic:econ":
    calls.push(invokeAnthropicEconomic(prompt));
    break;

  case "anthropic:mid":
    calls.push(invokeAnthropicBalanced(prompt));
    break;

  case "anthropic:max":
    calls.push(invokeAnthropicPremium(prompt));
    break;

  case "gemini:econ":
    calls.push(invokeGeminiEconomic(prompt));
    break;

  case "gemini:mid":
    calls.push(invokeGeminiBalanced(prompt));
    break;

  case "gemini:max":
    calls.push(invokeGeminiPremium(prompt));
    break;
  }

  }

  const results = await Promise.all(
    calls.map((p, idx) =>
      p.catch(
        (e: any) =>
          ({
            provider: providers[idx],
            text: "",
            success: false,
            error: e?.message ?? "provider_failure",
            latencyMs: 0,
            tokensUsed: 0,
            promptTokens: 0,
            completionTokens: 0,
            estimatedCost: 0,
          } as ProviderResponse)
      )
    )
  );

  return results;
}

// =========================
// 2) CORE API — getAIResponse
// =========================

export async function getAIResponse(
  prompt: string,
  userId?: string
): Promise<{
  fusion: FusionResult;
  raw: ProviderResponse[];
  meta: OrchestrationMeta;
  costThisRequest: number;
}> {
  // 1️⃣ Intent di base
  const { intent } = runIntentEngine(prompt, userId);

  // 2️⃣ Memoria (sessione + utente)
  const { session: sessionMemory, user: userMemory } = await initMemoryEngine(
    prompt,
    intent,
    userId
  );

  // 3️⃣ Preference Engine — intercetta frasi tipo "preferisco risposte lunghe"
  {
    const prefResult = detectUserPreferenceStatement(prompt);

    if (!prefResult.preference && !prefResult.needsClarification) {
      // Nessuna preferenza esplicita → si prosegue
    } else if (prefResult.needsClarification && prefResult.clarificationQuestion) {
      // Frase ambigua → solo domanda di chiarimento, nessun provider
      const fusion: FusionResult = {
        finalText: prefResult.clarificationQuestion,
        fusionScore: 1,
        used: [],
      };

      const meta: OrchestrationMeta = {
        intent,
        smallTalkHandled: false,
        clarificationUsed: true,
        autoPromptUsed: false,
        preferenceDetected: false,
        stats: { callsThisRequest: 0, providersRequested: [] },
        memory: sessionMemory,
      };

      return {
        fusion,
        raw: [],
        meta,
        costThisRequest: 0,
      };
    } else if (prefResult.preference && prefResult.preference.confidence === "high") {
      // Preferenza chiara → salviamo e rispondiamo subito
      const preferenceHit = prefResult.preference;

      // Aggiorniamo sessionMemory
      sessionMemory.preferences = {
        ...(sessionMemory.preferences || {}),
        detail: preferenceHit.detail ?? sessionMemory.preferences?.detail,
        tone: preferenceHit.tone ?? sessionMemory.preferences?.tone,
      };

      // Persistenza se scope = persistent
      if (userId && preferenceHit.scope === "persistent") {
        try {
          await mergeSessionIntoUserMemory(userId, {
            prefs: {
              detail: preferenceHit.detail,
              tone: preferenceHit.tone,
            },
          });
        } catch (err) {
          console.error("[ANOVA] Errore aggiornamento preferenze:", err);
        }
      }

      const lastAnswerExists =
        sessionMemory.lastPrompts && sessionMemory.lastPrompts.length > 0;

      const ack = buildPreferenceAck(preferenceHit, lastAnswerExists);

      const fusion: FusionResult = {
        finalText: ack,
        fusionScore: 1,
        used: [],
      };

      const meta: OrchestrationMeta = {
        intent,
        smallTalkHandled: false,
        clarificationUsed: false,
        autoPromptUsed: false,
        preferenceDetected: true,
        stats: { callsThisRequest: 0, providersRequested: [] },
        memory: sessionMemory,
      };

      return {
        fusion,
        raw: [],
        meta,
        costThisRequest: 0,
      };
    }
  }

  // 4️⃣ Small talk → gestito dal dialog-engine
  const dialog = runDialogEngine(intent);
  if (dialog.handled && dialog.text) {
    const fusion: FusionResult = {
      finalText: dialog.text,
      fusionScore: 1,
      used: [],
    };

    const meta: OrchestrationMeta = {
      intent,
      smallTalkHandled: true,
      clarificationUsed: false,
      autoPromptUsed: false,
      stats: { callsThisRequest: 0, providersRequested: [] },
      memory: sessionMemory,
    };

    return {
      fusion,
      raw: [],
      meta,
      costThisRequest: 0,
    };
  }

  // 5️⃣ Clarity Engine → domanda di chiarimento se necessario
  const clarity = runClarityEngine(intent);
  if (clarity.needsClarification && clarity.question) {
    const fusion: FusionResult = {
      finalText: clarity.question,
      fusionScore: 1,
      used: [],
    };

    const meta: OrchestrationMeta = {
      intent,
      smallTalkHandled: false,
      clarificationUsed: true,
      autoPromptUsed: false,
      stats: { callsThisRequest: 0, providersRequested: [] },
      memory: sessionMemory,
    };

    return {
      fusion,
      raw: [],
      meta,
      costThisRequest: 0,
    };
  }

  // 6️⃣ Quantum model + dominio finale
  const quantum = buildQuantumState(intent);
  const domainResult = runDomainClassifier(intent, quantum);
  const finalDomain: Domain = domainResult.domain;

  // 7️⃣ Checklist (per ora solo preparazione, niente blocco)
  const checklist = runChecklistEngine(intent);
  // checklist.items può essere usato in futuro per domande guidate

  // 8️⃣ Prompt Engine → super-prompt per i provider
  const { prompt: improvedPrompt } = runPromptEngine({
    intent,
    sessionMemory,
    userMemory,
  });
// ================================
// 🔍 DEBUG LOG — Prompt Injected
// Mostra il super-prompt finale (solo in sviluppo)
// ================================
if (process.env.NODE_ENV === "development") {
  console.log("🔧 [ANOVA_DEBUG] Super-prompt generato:");
  console.log(improvedPrompt);
}

  // 9️⃣ Routing Engine → scelta provider
  const routingDecision = runRoutingEngine(intent, quantum);

  if (!routingDecision.selected || routingDecision.selected.length === 0) {
    const fusion: FusionResult = {
      finalText: "Nessun provider disponibile (API key mancanti o disattivate).",
      fusionScore: 0,
      used: [],
    };

    const meta: OrchestrationMeta = {
      intent,
      smallTalkHandled: false,
      clarificationUsed: false,
      autoPromptUsed: !!intent.autoPromptNeeded,
      stats: { callsThisRequest: 0, providersRequested: [] },
      autoPromptText: improvedPrompt,
      memory: sessionMemory,
    };

    return {
      fusion,
      raw: [],
      meta,
      costThisRequest: 0,
    };
  }

  // 🔟 Esecuzione provider
  const raw = await executeProviders(routingDecision.selected, improvedPrompt);

  // 1️⃣1️⃣ Fusione risposte
  const { fusion } = runFusionEngine(raw, finalDomain);

  // ================================
// 🔍 Fusion Debug Info (sviluppo)
// ================================
// 🧠 Fusion Debug per pannello tecnico
const fusionDebug = {
  score: fusion.fusionScore,
  usedProviders: fusion.used.map(u => u.provider),     // ← string[]
  discardedProviders: routingDecision.selected
    .filter(p => !fusion.used.map(u => u.provider).includes(p)),  // ← string[]
  domain: finalDomain,
  finalTextPreview: fusion.finalText.slice(0, 200) + "…",
};



  // 1️⃣2️⃣ Costo totale richiesta
  const costThisRequest = raw.reduce(
    (acc, r) => acc + (r.estimatedCost ?? 0),
    0
  );

  // 1️⃣3️⃣ Persistenza memoria utente
  if (userId) {
    await persistMemoryEngine(userId, sessionMemory);
  }

  // 1️⃣4️⃣ Meta per pannello orchestratore
const meta: OrchestrationMeta = {
  intent,
  smallTalkHandled: false,
  clarificationUsed: false,
  autoPromptUsed: !!intent.autoPromptNeeded,
  stats: {
    callsThisRequest: raw.length,
    providersRequested: routingDecision.selected,
  },
  autoPromptText: improvedPrompt,
  memory: sessionMemory,
  preferenceDetected: false,
  fusionDebug,          // ← ora è valido
};


  return {
    fusion,
    raw,
    meta,
    costThisRequest,
  };
}

// =========================
// 3) Re-export tipi legacy (compatibilità)
// =========================

export type {
  Intent,
  FusionResult,
  ProviderResponse,
  OrchestrationMeta,
} from "./types";
