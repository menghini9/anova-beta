// ⬇️ BLOCCO 3.3 — Mistral Provider (Skeleton)
// ANOVA_ORCHESTRATOR_V50_PROVIDER_MISTRAL

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../types";
import { PROVIDER_TIMEOUT_MS } from "../policy";

export async function invokeMistral(prompt: string): Promise<ProviderResponse> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    return {
      provider: "mistral",
      text: "",
      success: false,
      error: "MISTRAL_API_KEY missing",
      latencyMs: 0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }

  return invokeBase({
    provider: "mistral",

    exec: async () => {
      return {
        choices: [{ message: "[Mistral non ancora collegata]" }],
        usage: { prompt_tokens: 0, completion_tokens: 0 },
      };
    },

    parse: (raw: any) => ({
      text: raw?.choices?.[0]?.message ?? "",
      promptTokens: raw?.usage?.prompt_tokens ?? 0,
      completionTokens: raw?.usage?.completion_tokens ?? 0,
    }),

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: () => 0,
  });
}

// ⬆️ FINE BLOCCO 3.3
