// ⬇️ BLOCCO 10 — /src/lib/orchestrator/router.ts
// ANOVA_ORCHESTRATOR_V42

import { BASE_WEIGHTS, PARALLEL_FANOUT } from "./policy";
import type { Intent, ProviderId, ProviderResponse } from "./types";
import { invokeOpenAI } from "./providers/openai";
import { invokeAnthropic } from "./providers/anthropic";
import { invokeGemini } from "./providers/gemini";
import { invokeMistral } from "./providers/mistral";
import { invokeLlama } from "./providers/llama";
import { invokeWeb } from "./providers/web";

const INVOKERS: Record<ProviderId, (p: string) => Promise<ProviderResponse>> = {
  openai: invokeOpenAI,
  anthropic: invokeAnthropic,
  gemini: invokeGemini,
  mistral: invokeMistral,
  llama: invokeLlama,
  web: invokeWeb,
};

export function pickProviders(intent: Intent): ProviderId[] {
  const weights = BASE_WEIGHTS[intent.purpose] || {};
  const ranked = Object.entries(weights)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([pid]) => pid as ProviderId);
  return ranked.slice(0, PARALLEL_FANOUT);
}

// ⬇️ BLOCCO 10 — fanout ESTESO con logging chiamate AI
export async function fanout(intent: Intent): Promise<{
  results: ProviderResponse[];
  stats: {
    callsThisRequest: number;
    providersRequested: ProviderId[];
  };
}> {
  const providers = pickProviders(intent);

  const calls = providers.map((p) => INVOKERS[p](intent.original));

  const settled = await Promise.allSettled(calls);

  const results = settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : {
          provider: providers[i],
          text: "",
          latencyMs: 0,
          success: false,
          error: "rejected",
        }
  );

  return {
    results,
    stats: {
      callsThisRequest: providers.length,
      providersRequested: providers,
    },
  };
}

// ⬆️ FINE BLOCCO 10
