// ⬇️ BLOCCO 1 — Base Provider V1
// ANOVA_ORCHESTRATOR_V50_PROVIDER_BASE

import { withTimeout } from "./_base";
import type { ProviderResponse } from "../orchestrator/types";
import type { ProviderKey } from "../orchestrator/types/ai";


interface BaseInvokeConfig {
  provider: ProviderKey;
  exec: () => Promise<any>;       // funzione che esegue la chiamata API reale
  parse: (raw: any) => {          // parser per estrarre il testo
    text: string;
    promptTokens?: number;
    completionTokens?: number;
  };
  timeoutMs: number;
  cost: (usage: {
    promptTokens: number;
    completionTokens: number;
  }) => number;                   // funzione per calcolare il costo
}

export async function invokeBase(config: BaseInvokeConfig): Promise<ProviderResponse> {
  const t0 = Date.now();

  try {
    // 1️⃣ ESECUZIONE CON TIMEOUT
    const raw = await withTimeout(config.exec(), config.timeoutMs);

    // 2️⃣ PARSING NORMALIZZATO
    const parsed = config.parse(raw);
    const text = parsed.text ?? "";

    // 3️⃣ TOKEN NORMALIZZATI
    const promptTokens = parsed.promptTokens ?? 0;
    const completionTokens = parsed.completionTokens ?? 0;
    const tokensUsed = promptTokens + completionTokens;

    // 4️⃣ COSTO
    const estimatedCost = config.cost({
      promptTokens,
      completionTokens,
    });

    return {
      provider: config.provider,
      text,
      success: Boolean(text),
      error: text ? undefined : "empty_response",

      latencyMs: Date.now() - t0,
      tokensUsed,
      promptTokens,
      completionTokens,
      estimatedCost,
    };
  } catch (e: any) {
    return {
      provider: config.provider,
      text: "",
      success: false,
      error: e?.message ?? "unknown_error",

      latencyMs: Date.now() - t0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }
}
// ⬆️ FINE BLOCCO 1
