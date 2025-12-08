// ⬇️ BLOCCO — Anthropic Provider (Versione Completa)
// ANOVA_ORCHESTRATOR_V51_ANTHROPIC_PROVIDER

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../orchestrator/types";
import { PROVIDER_TIMEOUT_MS } from "../orchestrator/policy";

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
      try {
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
        raw?.content?.[0]?.text ??
        raw?.choices?.[0]?.message?.content ??
        "";

      const usage = raw?.usage || {};

      return {
        text,
        promptTokens: usage.input_tokens ?? 0,
        completionTokens: usage.output_tokens ?? 0,
      };
    },

    timeoutMs: PROVIDER_TIMEOUT_MS,

    // Claude Haiku → prezzi reali
    cost: ({ promptTokens, completionTokens }) => {
      const promptCost = promptTokens * 0.00000025;
      const completionCost = completionTokens * 0.00000125;
      return promptCost + completionCost;
    },
  });
}
