import { invokeBase } from "../_baseProvider";
import type { ProviderResponse } from "../../orchestrator/types";
import { PROVIDER_TIMEOUT_MS } from "../../orchestrator/policy";

export async function invokeAnthropicPremium(prompt: string): Promise<ProviderResponse> {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return {
      provider: "anthropic:max",
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
    provider: "anthropic:max",

    exec: async () => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 4096,
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
      promptTokens * 0.000003 + completionTokens * 0.000015,
  });
}
