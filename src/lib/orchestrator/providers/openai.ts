// ⬇️ BLOCCO 2 — OpenAI Provider (Versione Completa & Robusta)
// ANOVA_ORCHESTRATOR_V51_OPENAI_PROVIDER

import { invokeBase } from "./_baseProvider";
import type { ProviderResponse } from "../types";
import type { ProviderKey } from "../../../types/ai";
import { PROVIDER_TIMEOUT_MS } from "../policy";

export async function invokeOpenAI(prompt: string): Promise<ProviderResponse> {
  const key = process.env.OPENAI_API_KEY;

  // ⚠️ Nessuna API key → errore immediato
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

    // 1️⃣ CHIAMATA API — robusta, con gestione errori HTTP e JSON
    exec: async () => {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
        });

        // ❗ Se risposta HTTP non OK → ritorno errore leggibile
        if (!res.ok) {
          return {
            error: `HTTP ${res.status} — ${res.statusText}`,
          };
        }

        // ❗ Tentativo di decodifica JSON (protezione contro risposte vuote)
        let json: any;
        try {
          json = await res.json();
        } catch (err) {
          return { error: "Invalid JSON response" };
        }

        return json;
      } catch (err: any) {
        // ❗ Errori reali: rete, DNS, timeout fetch
        return {
          error: err?.message ?? "fetch_failed",
        };
      }
    },

    // 2️⃣ PARSER RISPOSTA — estrae testo + token
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

    // 3️⃣ TIMEOUT GLOBALE (configurato in /policy.ts)
    timeoutMs: PROVIDER_TIMEOUT_MS,

    // 4️⃣ COSTO GPT-4o-mini (valori reali)
    cost: ({ promptTokens, completionTokens }) => {
      const costPrompt = promptTokens * 0.00000015;
      const costCompletion = completionTokens * 0.00000060;
      return costPrompt + costCompletion;
    },
  });
}

// ⬆️ FINE BLOCCO 2 — OpenAI Provider v51
