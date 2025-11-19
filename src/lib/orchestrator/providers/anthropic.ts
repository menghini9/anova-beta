// ⬇️ BLOCCO 3.1 — Anthropic Provider (Skeleton)
// ANOVA_ORCHESTRATOR_V50_PROVIDER_ANTHROPIC

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../types";
import { PROVIDER_TIMEOUT_MS } from "../policy";
import type { ProviderKey } from "../../../types/ai";

export async function invokeAnthropic(prompt: string): Promise<ProviderResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      provider: "anthropic",
      text: "",
      success: false,
      error: "ANTHROPIC_API_KEY missing",
      latencyMs: 0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }

  return invokeBase({
    provider: "anthropic",

    exec: async () => {
      // 👇 Endpoint reale verrà aggiunto successivamente
      return {
        choices: [{ text: "[Anthropic non ancora collegata]" }],
        usage: { prompt_tokens: 0, completion_tokens: 0 },
      };
    },

    parse: (raw: any) => ({
      text: raw?.choices?.[0]?.text ?? "",
      promptTokens: raw?.usage?.prompt_tokens ?? 0,
      completionTokens: raw?.usage?.completion_tokens ?? 0,
    }),

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: () => 0, // costi nulli finché non integriamo l'API reale
  });
}

// ⬆️ FINE BLOCCO 3.1
