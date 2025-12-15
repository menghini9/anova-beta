// ANOVA_ORCHESTRATOR_CORE_V4
// Orchestratore manifesto-driven.
// ANOVA non interpreta contenuti: orchestra, valida, route, fonde.

import type {
  FusionResult,
  ProviderResponse,
  OrchestrationMeta,
  ProviderId,
} from "./types";

// =========================
// MEMORY
// =========================
import {
  initMemoryEngine,
  persistMemoryEngine,
} from "./memory/memory-core";

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

// =========================
// PROVIDER EXECUTOR
// =========================
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
        // Provider non gestito → fallimento controllato
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
    // 🔒 Se il provider lancia errori SINCRONI (es. API key mancante), non facciamo 500
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
  // 1️⃣ INIT MEMORY (NO INTENT)
  // --------------------------------------------------
const { session: sessionMemory } = await initMemoryEngine(
  userInput,
  null,
  userId
);



  // --------------------------------------------------
  // 2️⃣ CONTROL PROMPT (MANIFESTO)
  // --------------------------------------------------
  const controlPrompt = `
${ANOVA_MANIFESTO_TEXT}

--- CONTEXT ---
${JSON.stringify(sessionMemory.context ?? {}, null, 2)}

--- USER INPUT ---
"${userInput}"

Rispondi ESCLUSIVAMENTE in JSON valido con chiave CONTROL.
`;

  // --------------------------------------------------
  // 3️⃣ CONTROL PHASE — ECON PROVIDERS
  // --------------------------------------------------
  const controlProviders: ProviderId[] = [
    "openai:econ",
   // "anthropic:econ",
   // "gemini:econ",
  ];

  const controlRaw = await executeProviders(controlProviders, controlPrompt);

  const { fusion: controlFusion } = runFusionEngine(controlRaw, "logic");
console.log("📦 CONTROL RAW TEXT (fusion.finalText):", controlFusion.finalText);
console.log("📦 CONTROL RAW PROVIDERS:", controlRaw.map(r => ({ p: r.provider, ok: r.success, err: r.error })));

const parsed = parseAndValidateControl(controlFusion.finalText);

if (!parsed.ok) {
  console.error("❌ CONTROL VALIDATION FAILED:", parsed.error);
  console.error("❌ CONTROL RAW TEXT:", controlFusion.finalText);

  // ✅ Fallback pulito (no 500) — risposta diretta all'utente
  return {
    fusion: {
      finalText:
        "⚠️ Nessuna risposta utile dall’orchestratore (CONTROL non valido). Riprova o riformula la richiesta.",
      fusionScore: 0,
      used: [],
    },
    raw: controlRaw,
    meta: {
      memory: sessionMemory,
      stats: {
        callsThisRequest: controlRaw.length,
        providersRequested: controlProviders,
      },
      tags: { control_valid: false },
    },
    costThisRequest: controlRaw.reduce((a, r) => a + (r.estimatedCost ?? 0), 0),
  };
}


  const control = parsed.value.CONTROL;

  const baseStats = {
    callsThisRequest: controlRaw.length,
    providersRequested: controlProviders,
  };

  // --------------------------------------------------
  // 4️⃣ CLARIFICATION → DOMANDE UTENTE
  // --------------------------------------------------
  if (control.request_stage === "CLARIFICATION") {
    return {
      fusion: {
        finalText: control.missing_information.join("\n"),
        fusionScore: 1,
        used: [],
      },
      raw: controlRaw,
      meta: {
        memory: sessionMemory,
        stats: baseStats,
      },
      costThisRequest: controlRaw.reduce(
        (a, r) => a + (r.estimatedCost ?? 0),
        0
      ),
    };
  }
// --------------------------------------------------
// 5️⃣ EXECUTION PHASE
// --------------------------------------------------
const executionProviders = runRoutingEngine(control).filter((p) =>
  p.startsWith("openai:")
);

console.log("🧭 ROUTING — selected providers:", executionProviders);

// fallback se routing torna vuoto
const safeExecutionProviders: ProviderId[] =
  executionProviders.length > 0 ? executionProviders : ["openai:mid"];

const executionPrompt = controlFusion.finalText;

console.log("🧾 EXEC PROMPT length:", executionPrompt.length);
console.log("🧾 EXEC PROMPT preview:", executionPrompt.slice(0, 400));

const executionRaw = await executeProviders(
  safeExecutionProviders,
  executionPrompt
);

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



  const { fusion } = runFusionEngine(
    executionRaw,
    control.request_type === "OPERATIVA" ? "code" : "logic"
  );

  // --------------------------------------------------
  // 6️⃣ MEMORY PERSIST
  // --------------------------------------------------
  if (userId && control.memory_update) {
    sessionMemory.context = {
      ...(sessionMemory.context ?? {}),
      ...Object.fromEntries(
        control.memory_update.session?.map((x) => [x.key, x.value]) ?? []
      ),
    };

    await persistMemoryEngine(userId, sessionMemory);
  }

  // --------------------------------------------------
  // 7️⃣ COST & META
  // --------------------------------------------------
  const costThisRequest = [...controlRaw, ...executionRaw].reduce(
    (a, r) => a + (r.estimatedCost ?? 0),
    0
  );

  return {
    fusion,
    raw: executionRaw,
    meta: {
      memory: sessionMemory,
      stats: {
        callsThisRequest:
          controlRaw.length + executionRaw.length,
        providersRequested: executionProviders,
      },
    },
    costThisRequest,
  };
}
