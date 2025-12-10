import { invokeBase } from "../_baseProvider";
import type { ProviderResponse } from "../../orchestrator/types";
import { PROVIDER_TIMEOUT_MS } from "../../orchestrator/policy";

export async function invokeOpenAIBalanced(prompt: string): Promise<ProviderResponse> {
  const key = process.env.OPENAI_API_KEY;

  if (!key) return {
    provider: "openai:mid",
    text: "",
    success: false,
    error: "OPENAI_API_KEY missing",
    latencyMs: 0,
    tokensUsed: 0,
    promptTokens: 0,
    completionTokens: 0,
    estimatedCost: 0,
  };

  return invokeBase({
    provider: "openai:mid",

    exec: async () => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });

      if (!res.ok) return { error: `HTTP ${res.status}` };
      return res.json();
    },

    parse: (raw) => ({
      text: raw?.choices?.[0]?.message?.content ?? "",
      promptTokens: raw?.usage?.prompt_tokens ?? 0,
      completionTokens: raw?.usage?.completion_tokens ?? 0,
    }),

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: ({ promptTokens, completionTokens }) =>
      promptTokens * 0.0000008 + completionTokens * 0.000004,
  });
}
