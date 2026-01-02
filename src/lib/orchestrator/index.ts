// ======================================================
// ANOVA_ORCHESTRATOR_THIN_V2
// Path: /src/lib/orchestrator/index.ts
// Obiettivo: 1 chiamata provider -> 1 risposta.
// Niente manifesto, niente control engine, niente routing/fusion legacy.
// ======================================================

import type {
  FusionResult,
  OrchestrationMeta,
  ProviderId,
  ProviderResponse,
} from "./types";

// ✅ usa SOLO provider OpenAI stabilizzati (routing lo fai a monte, non qui)
import { invokeOpenAIEconomic } from "@/lib/providers/openai";

// =========================
// Helpers
// =========================
function toFusion(
  text: string,
  usedProvider: ProviderId,
  latencyMs = 0
): FusionResult {
  return {
    finalText: text,
    fusionScore: 1,
    used: [
      {
        provider: usedProvider,
        score: 1,
        latencyMs,
      },
    ],
  };
}


function sumCost(rows: ProviderResponse[]): number {
  return rows.reduce((a, r) => a + (r.estimatedCost ?? 0), 0);
}


function safeText(v: any): string {
  return typeof v === "string" ? v : "";
}

// =========================
// CORE API (thin, compat)
// =========================
export async function getAIResponse(
  effectivePrompt: string,
  userId?: string
): Promise<{
  fusion: FusionResult;
  raw: ProviderResponse[];
  meta: OrchestrationMeta;
  costThisRequest: number;
}> {
  // --------------------------------------------------
  // 0) Guard rail input
  // --------------------------------------------------
  const prompt = safeText(effectivePrompt).trim();
  const provider = "openai:econ" as ProviderId;

  if (!prompt) {
    const rawEmpty: ProviderResponse[] = [
      {
        provider,
        text: "",
        success: false,
        error: "missing_prompt",
        latencyMs: 0,
        tokensUsed: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCost: 0,
      },
    ];

    const metaEmpty: OrchestrationMeta = {
      memory: { context: { userId: userId ?? null, orchestrator: "thin_v2" } } as any,
      stats: { callsThisRequest: 0, providersRequested: [provider] },
      tags: { orchestrator: "thin_v2", stage: "blocked_missing_prompt" } as any,
    };

    return {
     fusion: toFusion("⚠️ Prompt vuoto: invia una richiesta valida.", provider, 0),
      raw: rawEmpty,
      meta: metaEmpty,
      costThisRequest: 0,
    };
  }

  // --------------------------------------------------
  // 1) ESECUZIONE SEMPLICE (1 provider)
  // --------------------------------------------------
  let row: ProviderResponse;

  try {
    row = await invokeOpenAIEconomic(prompt);
  } catch (e: any) {
    row = {
      provider,
      text: "",
      success: false,
      error: e?.message ?? "provider_failure",
      latencyMs: 0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }

  const raw: ProviderResponse[] = [row];

  // --------------------------------------------------
  // 2) OUTPUT
  // --------------------------------------------------
  const text =
    row.success && row.text?.trim()
      ? row.text.trim()
      : "❌ Errore provider: nessuna risposta utile. Riprova.";

  const meta: OrchestrationMeta = {
    // non usiamo memoria qui, ma lasciamo un oggetto “safe” per la UI
    memory: { context: { userId: userId ?? null, orchestrator: "thin_v2" } } as any,
    stats: {
      callsThisRequest: 1,
      providersRequested: [provider],
    },
    tags: {
      orchestrator: "thin_v2",
      stage: "direct",
      userId: userId ? "present" : "none",
    } as any,
  };

  return {
  fusion: toFusion(text, provider, row.latencyMs ?? 0),
    raw,
    meta,
    costThisRequest: sumCost(raw),
  };
}
