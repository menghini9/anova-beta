// ⬇️ BLOCCO 3.5 — Web Search Provider (Skeleton)
// ANOVA_ORCHESTRATOR_V50_PROVIDER_WEB

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../types";
import { PROVIDER_TIMEOUT_MS } from "../policy";

export async function invokeWeb(prompt: string): Promise<ProviderResponse> {
  const key = process.env.WEB_SEARCH_API_KEY;
  if (!key) {
    return {
      provider: "web",
      text: "",
      success: false,
      error: "WEB_SEARCH_API_KEY missing",
      latencyMs: 0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }

  return invokeBase({
    provider: "web",

    exec: async () => {
      return {
        answer: "[Web Search non ancora collegata]",
        usage: { prompt_tokens: 0, completion_tokens: 0 },
      };
    },

    parse: (raw: any) => ({
      text: raw?.answer ?? "",
      promptTokens: raw?.usage?.prompt_tokens ?? 0,
      completionTokens: raw?.usage?.completion_tokens ?? 0,
    }),

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: () => 0,
  });
}

// ⬆️ FINE BLOCCO 3.5
