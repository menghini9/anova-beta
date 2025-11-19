// ⬇️ BLOCCO 2 — OpenAI Provider (Base-Driven)
// ANOVA_ORCHESTRATOR_V50_OPENAI_PROVIDER

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../types";
import type { ProviderKey } from "../../../types/ai";
import { PROVIDER_TIMEOUT_MS } from "../policy";

export async function invokeOpenAI(prompt: string): Promise<ProviderResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      provider: "openai",
      text: "",
      success: false,
      error: "OPENAI_API_KEY missing",
      latencyMs: 0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }

  return invokeBase({
    provider: "openai",

    // 1️⃣ ESECUZIONE DELLA CHIAMATA API
    exec: () =>
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      }).then((res) => res.json()),

    // 2️⃣ PARSER DELLA RISPOSTA
    parse: (raw: any) => {
      const text =
        raw?.choices?.[0]?.message?.content ??
        raw?.choices?.[0]?.text ??
        "";

      const usage = raw?.usage || {};
      return {
        text,
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
      };
    },

    // 3️⃣ TIMEOUT
    timeoutMs: PROVIDER_TIMEOUT_MS,

    // 4️⃣ CALCOLO COSTI
    cost: ({ promptTokens, completionTokens }) => {
      // Valori indicativi GPT-4o-mini
      const costPrompt = promptTokens * 0.00000015;
      const costCompletion = completionTokens * 0.00000060;
      return costPrompt + costCompletion;
    },
  });
}

// ⬆️ FINE BLOCCO 2
