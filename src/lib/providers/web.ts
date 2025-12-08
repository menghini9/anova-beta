// ⬇️ BLOCCO — WebSearch Provider
// ANOVA_ORCHESTRATOR_V51_WEB_PROVIDER

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../orchestrator/types";
import { PROVIDER_TIMEOUT_MS } from "../orchestrator/policy";

export async function invokeWeb(prompt: string): Promise<ProviderResponse> {
  const key = process.env.WEB_SEARCH_API_KEY;

  if (!key) {
    return {
      provider: "web",
      text: "",
      success: false,
      error: "WEB_SEARCH_API_KEY missing",
      latencyMs: 0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }

  return invokeBase({
    provider: "web",

    exec: async () => {
      try {
        // Il tuo eventuale motore di ricerca custom
        const res = await fetch("https://api.example.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ query: prompt }),
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
      const text = raw?.results?.[0]?.summary ?? "";
      return {
        text,
        promptTokens: 0,
        completionTokens: 0,
      };
    },

    timeoutMs: PROVIDER_TIMEOUT_MS,

    cost: () => 0,
  });
}
