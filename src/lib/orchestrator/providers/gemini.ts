// ⬇️ BLOCCO 3.2 — Gemini Provider (Skeleton)
// ANOVA_ORCHESTRATOR_V50_PROVIDER_GEMINI

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../types";
import { PROVIDER_TIMEOUT_MS } from "../policy";

export async function invokeGemini(prompt: string): Promise<ProviderResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      provider: "gemini",
      text: "",
      success: false,
      error: "GEMINI_API_KEY missing",
      latencyMs: 0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }

  return invokeBase({
    provider: "gemini",

    exec: async () => {
      return {
        candidates: [{ output: "[Gemini non ancora collegata]" }],
        usage: { prompt_tokens: 0, completion_tokens: 0 },
      };
    },

    parse: (raw: any) => ({
      text: raw?.candidates?.[0]?.output ?? "",
      promptTokens: raw?.usage?.prompt_tokens ?? 0,
      completionTokens: raw?.usage?.completion_tokens ?? 0,
    }),

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: () => 0,
  });
}

// ⬆️ FINE BLOCCO 3.2
