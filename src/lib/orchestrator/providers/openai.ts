// ⬇️ BLOCCO 4 — /src/lib/orchestrator/providers/openai.ts
// ANOVA_ORCHESTRATOR_V43_COST_TRACKING

import { withTimeout } from "./_base";
import type { ProviderResponse } from "../types";
import { PROVIDER_TIMEOUT_MS } from "../policy";

export async function invokeOpenAI(prompt: string): Promise<ProviderResponse> {
  const t0 = Date.now();
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY missing");

    const r = await withTimeout(
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
      PROVIDER_TIMEOUT_MS
    );

    const text =
      r?.choices?.[0]?.message?.content ??
      r?.choices?.[0]?.text ??
      "";

    // -------------------------------
    // 📌 TOKEN + COSTO STIMATO
    // -------------------------------
    const usage = r?.usage || {};
    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;
    const totalTokens = promptTokens + completionTokens;

    // Prezzi indicativi GPT-4o-mini (base OpenAI, simulazione)
    // Prompt: 0.00000015$ / token — Completion: 0.00000060$ / token
    const cost =
      promptTokens * 0.00000015 +
      completionTokens * 0.00000060;

    return {
      provider: "openai",
      text,
      latencyMs: Date.now() - t0,
      success: Boolean(text),
      error: text ? undefined : "empty_response",

      // 🆕 CAMPI AGGIUNTI
      tokensUsed: totalTokens,
      estimatedCost: cost,
      promptTokens,
      completionTokens,
    };
  } catch (e: any) {
    return {
      provider: "openai",
      text: "",
      latencyMs: Date.now() - t0,
      success: false,
      error: e?.message ?? "unknown",

      // In caso di errore forniamo dati vuoti
      tokensUsed: 0,
      estimatedCost: 0,
      promptTokens: 0,
      completionTokens: 0,
    };
  }
}
// ⬆️ FINE BLOCCO 4
