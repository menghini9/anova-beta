// ⬇️ BLOCCO — Mistral Provider
// ANOVA_ORCHESTRATOR_V51_MISTRAL_PROVIDER

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../orchestrator/types";
import { PROVIDER_TIMEOUT_MS } from "../orchestrator/policy";

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
      try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!res.ok) {
          return { error: `HTTP ${res.status} — ${res.statusText}` };
        }

        let json: any;
        try {
          json = await res.json();
        } catch {
          return { error: "Invalid JSON response" };
        }

        return json;
      } catch (err: any) {
        return { error: err?.message ?? "fetch_failed" };
      }
    },

    parse: (raw: any) => {
      const text =
        raw?.choices?.[0]?.message?.content ??
        "";

      const usage = raw?.usage || {};

      return {
        text,
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
      };
    },

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: ({ promptTokens, completionTokens }) => {
      const promptCost = promptTokens * 0.00000020;
      const completionCost = completionTokens * 0.00000060;
      return promptCost + completionCost;
    },
  });
}
