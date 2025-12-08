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
import { invokeOpenAI } from "@/lib/providers/openai";
import { invokeAnthropic } from "@/lib/providers/anthropic";
import { invokeGemini } from "@/lib/providers/gemini";
import { invokeMistral } from "@/lib/providers/mistral";
import { invokeLlama } from "@/lib/providers/llama";
import { invokeWeb } from "@/lib/providers/web";

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
      case "openai":
        calls.push(invokeOpenAI(prompt));
        break;
      case "anthropic":
        calls.push(invokeAnthropic(prompt));
        break;
      case "gemini":
        calls.push(invokeGemini(prompt));
        break;
      case "mistral":
        calls.push(invokeMistral(prompt));
        break;
      case "llama":
        calls.push(invokeLlama(prompt));
        break;
      case "web":
        calls.push(invokeWeb(prompt));
        break;
      default:
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
