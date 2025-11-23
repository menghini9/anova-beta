// ⬇️ BLOCCO — Llama Provider
// ANOVA_ORCHESTRATOR_V51_LLAMA_PROVIDER

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../types";
import { PROVIDER_TIMEOUT_MS } from "../policy";

export async function invokeLlama(prompt: string): Promise<ProviderResponse> {
  const key = process.env.LLAMA_API_KEY;

  if (!key) {
    return {
      provider: "llama",
      text: "",
      success: false,
      error: "LLAMA_API_KEY missing",
      latencyMs: 0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }

  return invokeBase({
    provider: "llama",

    exec: async () => {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "llama3-70b-8192",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
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
      const promptCost = promptTokens * 0.00000005;
      const completionCost = completionTokens * 0.00000010;
      return promptCost + completionCost;
    },
  });
}
