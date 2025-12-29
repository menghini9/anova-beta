// ======================================================
// ANOVA_ORCHESTRATOR_CORE_V5
// Path: /src/lib/orchestrator/index.ts
// Orchestratore manifesto-driven: orchestra, valida, route, fonde.
// ======================================================

import type {
  FusionResult,
  ProviderResponse,
  OrchestrationMeta,
  ProviderId,
} from "./types";

// =========================
// MEMORY
// =========================
import { initMemoryEngine, persistMemoryEngine } from "./memory/memory-core";

// =========================
// MANIFEST & CONTROL
// =========================
import { ANOVA_MANIFESTO_TEXT } from "./manifesto/manifesto";
import { parseAndValidateControl } from "./control/validate-control";

// =========================
// ROUTING & FUSION
// =========================
import { runRoutingEngine } from "./engines/routing-engine";
import { runFusionEngine } from "./engines/fusion-engine";

// =========================
// PROVIDERS
// =========================
import {
  invokeOpenAIEconomic,
  invokeOpenAIBalanced,
  invokeOpenAIPremium,
} from "../providers/openai";

import {
  invokeAnthropicEconomic,
  invokeAnthropicBalanced,
  invokeAnthropicPremium,
} from "../providers/anthropic";

import {
  invokeGeminiEconomic,
  invokeGeminiBalanced,
  invokeGeminiPremium,
} from "../providers/gemini";

// ======================================================
// CONFIG (cost control)
// ======================================================
const DEBUG = process.env.ANOVA_DEBUG === "1";
const ALLOW_CONTROL_FINAL_ANSWER = process.env.ANOVA_ALLOW_CONTROL_FINAL_ANSWER !== "0";

// Provider disponibili REALI (per ora: solo OpenAI finché stabilizziamo)
const AVAILABLE_PROVIDERS: ProviderId[] = ["openai:econ", "openai:mid", "openai:max"];

// ======================================================
// PROVIDER EXECUTOR
// ======================================================
async function executeProviders(
  providers: ProviderId[],
  prompt: string
): Promise<ProviderResponse[]> {
  const calls: Promise<ProviderResponse>[] = [];

  for (const p of providers) {
    try {
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

        default:
          calls.push(
            Promise.resolve({
              provider: p,
              text: "",
              success: false,
              error: "provider_not_supported",
              latencyMs: 0,
              tokensUsed: 0,
              promptTokens: 0,
              completionTokens: 0,
              estimatedCost: 0,
            })
          );
          break;
      }
    } catch (e: any) {
      calls.push(
        Promise.resolve({
          provider: p,
          text: "",
          success: false,
          error: e?.message ?? "provider_failure",
          latencyMs: 0,
          tokensUsed: 0,
          promptTokens: 0,
          completionTokens: 0,
          estimatedCost: 0,
        })
      );
    }
  }

  return Promise.all(
    calls.map((c, i) =>
      c.catch((e) => ({
        provider: providers[i],
        text: "",
        success: false,
        error: e?.message ?? "provider_failure",
        latencyMs: 0,
        tokensUsed: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCost: 0,
      }))
    )
  );
}

// ======================================================
// HELPERS
// ======================================================
function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractPayload(parsed: any): { superPrompt?: string; finalAnswer?: string } | null {
  if (!parsed || typeof parsed !== "object") return null;

  // Nuovo schema (Manifesto V2)
  const payload = parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null;

  // Compat legacy: alcuni modelli sputano finalAnswer/superPrompt dentro CONTROL
  const legacy = parsed.CONTROL && typeof parsed.CONTROL === "object" ? parsed.CONTROL : null;

  const finalAnswer =
    (typeof payload?.finalAnswer === "string" ? payload.finalAnswer : "") ||
    (typeof legacy?.finalAnswer === "string" ? legacy.finalAnswer : "");

  const superPrompt =
    (typeof payload?.superPrompt === "string" ? payload.superPrompt : "") ||
    (typeof legacy?.superPrompt === "string" ? legacy.superPrompt : "");

  return {
    finalAnswer: finalAnswer?.trim() ? finalAnswer.trim() : undefined,
    superPrompt: superPrompt?.trim() ? superPrompt.trim() : undefined,
  };
}

function sumCost(rows: ProviderResponse[]): number {
  return rows.reduce((a, r) => a + (r.estimatedCost ?? 0), 0);
}

// =========================
// CORE API
// =========================
export async function getAIResponse(
  userInput: string,
  userId?: string
): Promise<{
  fusion: FusionResult;
  raw: ProviderResponse[];
  meta: OrchestrationMeta;
  costThisRequest: number;
}> {
  // --------------------------------------------------
  // 1) INIT MEMORY
  // --------------------------------------------------
  let sessionMemory: any;
  try {
    const init = await initMemoryEngine(userInput, null as any, userId);
    sessionMemory = init.session;
  } catch (e: any) {
    // fallback “no-crash”: meglio una memoria vuota che un 500
    sessionMemory = { context: {} };
    if (DEBUG) console.error("❌ initMemoryEngine failed:", e?.message ?? e);
  }

  // --------------------------------------------------
  // 2) CONTROL PROMPT (LEAN)
  // --------------------------------------------------
  const ctx = sessionMemory?.context ?? {};
  const ctxStr = JSON.stringify(ctx, null, 2);

  const controlPrompt = `${ANOVA_MANIFESTO_TEXT}

--- CONTEXT ---
${ctxStr}

--- USER INPUT ---
"${userInput}"

Rispondi SOLO JSON valido con root { "CONTROL": ..., "payload": ... }.
`;

  // --------------------------------------------------
  // 3) CONTROL PHASE (OPENAI ECON)
  // --------------------------------------------------
  const controlProviders: ProviderId[] = ["openai:econ"];
  const controlRaw = await executeProviders(controlProviders, controlPrompt);

  // Se hai 1 provider, il “fusion” qui è solo una formalità
  const { fusion: controlFusion } = runFusionEngine(controlRaw, "logic");
  const controlText = (controlFusion.finalText ?? "").trim();

  if (DEBUG) {
    console.log("📦 CONTROL RAW PROVIDERS:", controlRaw.map(r => ({ p: r.provider, ok: r.success, err: r.error })));
    console.log("📦 CONTROL RAW TEXT:", controlText);
  }

  const baseStats = {
    callsThisRequest: controlRaw.length,
    providersRequested: controlProviders,
  };

  // --------------------------------------------------
  // 3.1) VALIDATION (NO EXECUTION IF INVALID)
  // --------------------------------------------------
  const parsed = parseAndValidateControl(controlText);

  if (!parsed.ok) {
    // Se lo schema non torna, NON lanciamo execution (stop costi inutili).
    // Proviamo comunque a “salvare” una risposta se esiste nel payload.
    const loose = safeJsonParse(controlText);
    const rescued = extractPayload(loose);

    if (rescued?.finalAnswer && ALLOW_CONTROL_FINAL_ANSWER) {
      return {
        fusion: { finalText: rescued.finalAnswer, fusionScore: 0.7, used: [] },
        raw: controlRaw,
        meta: { memory: sessionMemory, stats: baseStats, tags: { control_valid: false, rescued_answer: true } },
        costThisRequest: sumCost(controlRaw),
      };
    }

    return {
      fusion: {
        finalText: "⚠️ CONTROL non valido: stop esecuzione per evitare costi. Riprova o riformula la richiesta.",
        fusionScore: 0,
        used: [],
      },
      raw: controlRaw,
      meta: { memory: sessionMemory, stats: baseStats, tags: { control_valid: false } },
      costThisRequest: sumCost(controlRaw),
    };
  }

  const control = parsed.value.CONTROL;
  const payload = (parsed.value as any).payload ?? null;
  const extracted = extractPayload({ CONTROL: control, payload });

  // --------------------------------------------------
  // 4) CLARIFICATION
  // --------------------------------------------------
  if (control.request_stage === "CLARIFICATION" || control.next_action === "ASK_USER") {
    const questions = Array.isArray(control.missing_information) && control.missing_information.length > 0
      ? control.missing_information
      : ["Specifica meglio cosa ti serve (obiettivo, vincoli, formato output)."];

    return {
      fusion: { finalText: questions.join("\n"), fusionScore: 1, used: [] },
      raw: controlRaw,
      meta: { memory: sessionMemory, stats: baseStats, tags: { stage: "clarification" } },
      costThisRequest: sumCost(controlRaw),
    };
  }

  // --------------------------------------------------
  // 4.1) DIRECT ANSWER FROM CONTROL (cheap mode)
  // --------------------------------------------------
  if (ALLOW_CONTROL_FINAL_ANSWER && extracted?.finalAnswer && !extracted?.superPrompt) {
    return {
      fusion: { finalText: extracted.finalAnswer, fusionScore: 1, used: [] },
      raw: controlRaw,
      meta: { memory: sessionMemory, stats: baseStats, tags: { stage: "direct_from_control" } },
      costThisRequest: sumCost(controlRaw),
    };
  }

   // --------------------------------------------------
  // 5) EXECUTION (ONLY IF superPrompt EXISTS)
  // --------------------------------------------------
  const superPrompt = extracted?.superPrompt;

  if (!superPrompt) {
    // Regola d’acciaio: niente superPrompt = niente execution
    return {
      fusion: {
        finalText:
          "⚠️ CONTROL valido ma superPrompt mancante: esecuzione bloccata per evitare costi inutili.",
        fusionScore: 0,
        used: [],
      },
      raw: controlRaw,
      meta: {
        memory: sessionMemory,
        stats: baseStats,
        tags: { stage: "blocked_no_superprompt" },
      },
      costThisRequest: sumCost(controlRaw),
    };
  }

  // ✅ ROUTING: runRoutingEngine ritorna ProviderId[]
  const routedProviders: ProviderId[] = runRoutingEngine(control);

  // ✅ Cost control: usa solo provider realmente disponibili (oggi: OpenAI)
  const allowed = new Set<ProviderId>(AVAILABLE_PROVIDERS);
  const filteredProviders: ProviderId[] = routedProviders.filter((p) => allowed.has(p));

  // fallback “ragionevole”
  const safeExecutionProviders: ProviderId[] =
    filteredProviders.length > 0 ? filteredProviders : ["openai:mid"];

  // ✅ routing meta derivata (per pannelli/costi)
  const tierUsed: "econ" | "mid" | "max" =
    safeExecutionProviders.some((p) => p.endsWith(":max"))
      ? "max"
      : safeExecutionProviders.some((p) => p.endsWith(":mid"))
        ? "mid"
        : "econ";

  const fanoutCount = safeExecutionProviders.length;

  const suggestedTier = (control as any)?.suggested_provider_level as
    | "econ"
    | "mid"
    | "max"
    | undefined;

  const escalationApplied = suggestedTier ? tierUsed !== suggestedTier : false;

  if (DEBUG) {
    console.log("🧭 ROUTING providers:", routedProviders);
    console.log("🏭 EXEC providers:", safeExecutionProviders);
    console.log("📦 ROUTING meta:", {
      tierUsed,
      fanoutCount,
      escalationApplied,
      suggestedTier,
    });
    console.log("🧾 EXEC superPrompt length:", superPrompt.length);
  }

  const executionRaw = await executeProviders(safeExecutionProviders, superPrompt);

  if (DEBUG) {
    console.log(
      "🏭 EXEC RAW:",
      executionRaw.map((r) => ({
        p: r.provider,
        ok: r.success,
        t: (r.text ?? "").slice(0, 120),
        err: r.error,
        cost: r.estimatedCost ?? 0,
      }))
    );
  }

  const { fusion } = runFusionEngine(
    executionRaw,
    control.request_type === "OPERATIVA" ? "code" : "logic"
  );

  // --------------------------------------------------
  // 6) MEMORY PERSIST (safe)
  // --------------------------------------------------
  if (userId && control.memory_update) {
    try {
      sessionMemory.context = {
        ...(sessionMemory.context ?? {}),
        ...Object.fromEntries(
          control.memory_update.session?.map((x: any) => [x.key, x.value]) ?? []
        ),
      };

      await persistMemoryEngine(userId, sessionMemory);
    } catch (e: any) {
      if (DEBUG) console.error("❌ persistMemoryEngine failed:", e?.message ?? e);
    }
  }

  // --------------------------------------------------
  // 7) COST & META
  // --------------------------------------------------
  const costThisRequest = sumCost([...controlRaw, ...executionRaw]);

  return {
    fusion,
    raw: executionRaw,
    meta: {
      memory: sessionMemory,
      stats: {
        callsThisRequest: controlRaw.length + executionRaw.length,
        providersRequested: safeExecutionProviders,
      },
      tags: {
        stage: "executed",
        tierUsed,
        fanout: fanoutCount,
        escalationApplied,
      },
    },
    costThisRequest,
  };
}
