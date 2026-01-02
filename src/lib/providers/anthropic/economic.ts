import { invokeBase } from "../_baseProvider";
import type { ProviderResponse } from "../../orchestrator/types";
import { PROVIDER_TIMEOUT_MS } from "../../../../_deprecated/lib/policy";

export async function invokeAnthropicEconomic(prompt: string): Promise<ProviderResponse> {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return {
      provider: "anthropic:econ",
      text: "",
      success: false,
      error: "ANTHROPIC_API_KEY missing",
      latencyMs: 0,
      promptTokens: 0,
      completionTokens: 0,
      tokensUsed: 0,
      estimatedCost: 0,
    };
  }

  return invokeBase({
    provider: "anthropic:econ",

    exec: async () => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) return { error: `HTTP ${res.status}` };
      return res.json();
    },

    parse: (raw) => ({
      text: raw?.content?.[0]?.text ?? "",
      promptTokens: raw?.usage?.input_tokens ?? 0,
      completionTokens: raw?.usage?.output_tokens ?? 0,
    }),

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: ({ promptTokens, completionTokens }) =>
      promptTokens * 0.00000025 + completionTokens * 0.00000125,
  });
}
