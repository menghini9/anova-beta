import { invokeBase } from "../_baseProvider";
import type { ProviderResponse } from "../../orchestrator/types";
import { PROVIDER_TIMEOUT_MS } from "../../../../_deprecated/lib/policy";

export async function invokeGeminiEconomic(prompt: string): Promise<ProviderResponse> {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return {
      provider: "gemini:econ",
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
    provider: "gemini:econ",

    exec: async () => {
      const model = "models/gemini-1.5-flash";

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const text = await res.text();
      if (!res.ok) return { error: text };
      return JSON.parse(text);
    },

    parse: (raw) => ({
      text:
        raw?.candidates?.[0]?.content?.parts?.[0]?.text ??
        raw?.outputText ??
        "",
      promptTokens: raw?.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: raw?.usageMetadata?.candidatesTokenCount ?? 0,
    }),

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: ({ promptTokens, completionTokens }) =>
      promptTokens * 0.00000008 + completionTokens * 0.00000025,
  });
}
