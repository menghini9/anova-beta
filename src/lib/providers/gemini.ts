// ⬇️ BLOCCO — Gemini Provider (Versione Corretta con Gemini 2.5)
// ANOVA_ORCHESTRATOR_V53_GEMINI_PROVIDER

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../orchestrator/types";
import { PROVIDER_TIMEOUT_MS } from "../orchestrator/policy";

export async function invokeGemini(prompt: string): Promise<ProviderResponse> {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return {
      provider: "gemini",
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
    provider: "gemini",

    exec: async () => {
      const MODEL = "models/gemini-2.5-flash"; // <--- MODELLO CORRETTO

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${key}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        const rawText = await res.text();

        console.log(
          "🔥 GEMINI HTTP RAW:",
          res.status,
          res.statusText,
          rawText.slice(0, 500)
        );

        if (!res.ok) {
          return { error: `HTTP ${res.status} — ${res.statusText} — ${rawText}` };
        }

        let json: any;
        try {
          json = JSON.parse(rawText);
        } catch {
          return { error: "Invalid JSON response: " + rawText.slice(0, 200) };
        }

        return json;
      } catch (err: any) {
        return { error: err?.message ?? "fetch_failed" };
      }
    },

    parse: (raw: any) => {
      let text = "";

      try {
        text =
          raw?.candidates?.[0]?.content?.parts?.[0]?.text ??
          raw?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text ??
          raw?.outputText ??
          "";
      } catch {
        text = "";
      }

      const usage = raw?.usageMetadata || {};

      return {
        text,
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
      };
    },

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: ({ promptTokens, completionTokens }) => {
      const promptCost = promptTokens * 0.00000010;
      const completionCost = completionTokens * 0.00000040;
      return promptCost + completionCost;
    },
  });
}

// ⬆️ FINE BLOCCO GEMINI V53
