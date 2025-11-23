// ⬇️ BLOCCO 4 — fanout V60
// ANOVA_ORCHESTRATOR_V60_FANOUT_ROUTED

import type { ProviderResponse } from "./types";
import type { ProviderKey } from "@/types/ai";
import type { Domain } from "./types";

import { BASE_WEIGHTS, PARALLEL_FANOUT } from "./policy";

import { invokeOpenAI } from "./providers/openai";
import { invokeAnthropic } from "./providers/anthropic";
import { invokeGemini } from "./providers/gemini";
import { invokeMistral } from "./providers/mistral";
import { invokeLlama } from "./providers/llama";
import { invokeWeb } from "./providers/web";

interface FanoutResult {
  results: ProviderResponse[];
  stats: {
    callsThisRequest: number;
    providersRequested: ProviderKey[];
  };
}

function providerIsAvailable(key: string | undefined): boolean {
  return key !== undefined && key !== null && key !== "";
}

type ProviderConfig = {
  id: ProviderKey;
  envKey: string | undefined;
  weight: number;
};

export async function fanout(intent: any): Promise<FanoutResult> {
  const domain: Domain = (intent?.purpose as Domain) ?? "logic";

  const baseWeights = BASE_WEIGHTS[domain] ?? {};

  // 🔵 1) Costruiamo la lista di provider CANDIDATI (solo quelli con API key)
  const candidates: ProviderConfig[] = [];

  const openaiKey = process.env.OPENAI_API_KEY;
  if (providerIsAvailable(openaiKey)) {
    candidates.push({
      id: "openai",
      envKey: openaiKey,
      weight: (baseWeights.openai as number | undefined) ?? 0.9,
    });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (providerIsAvailable(anthropicKey)) {
    candidates.push({
      id: "anthropic",
      envKey: anthropicKey,
      weight: (baseWeights.anthropic as number | undefined) ?? 0.85,
    });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (providerIsAvailable(geminiKey)) {
    candidates.push({
      id: "gemini",
      envKey: geminiKey,
      weight: (baseWeights.gemini as number | undefined) ?? 0.8,
    });
  }

  const mistralKey = process.env.MISTRAL_API_KEY;
  if (providerIsAvailable(mistralKey)) {
    candidates.push({
      id: "mistral",
      envKey: mistralKey,
      weight: (baseWeights.mistral as number | undefined) ?? 0.7,
    });
  }

  const llamaKey = process.env.LLAMA_API_KEY;
  if (providerIsAvailable(llamaKey)) {
    candidates.push({
      id: "llama",
      envKey: llamaKey,
      weight: (baseWeights.llama as number | undefined) ?? 0.6,
    });
  }

  const webKey = process.env.WEB_SEARCH_API_KEY;
  if (providerIsAvailable(webKey)) {
    candidates.push({
      id: "web",
      envKey: webKey,
      weight: (baseWeights.web as number | undefined) ?? 0.85,
    });
  }

  // 🔴 Nessun provider attivo → risposta fittizia
  if (candidates.length === 0) {
    return {
      results: [
        {
          provider: "openai",
          text: "",
          success: false,
          error: "no_providers_available",
          latencyMs: 0,
          tokensUsed: 0,
          promptTokens: 0,
          completionTokens: 0,
          estimatedCost: 0,
        },
      ],
      stats: {
        callsThisRequest: 0,
        providersRequested: [],
      },
    };
  }

  // 🔵 2) Ordiniamo i provider per peso (policy) e limitiamo il fanout
  const sorted = candidates.sort((a, b) => b.weight - a.weight);

  const maxFanout =
    PARALLEL_FANOUT && PARALLEL_FANOUT > 0
      ? PARALLEL_FANOUT
      : Math.min(3, sorted.length);

  const selected = sorted.slice(0, maxFanout);

  const requested: ProviderKey[] = [];
  const promises: Promise<ProviderResponse>[] = [];

  // 🔥 3) Creiamo le chiamate ai provider selezionati
  for (const cfg of selected) {
    requested.push(cfg.id);

    switch (cfg.id) {
      case "openai":
        promises.push(invokeOpenAI(intent.original));
        break;
      case "anthropic":
        promises.push(invokeAnthropic(intent.original));
        break;
      case "gemini":
        promises.push(invokeGemini(intent.original));
        break;
      case "mistral":
        promises.push(invokeMistral(intent.original));
        break;
      case "llama":
        promises.push(invokeLlama(intent.original));
        break;
      case "web":
        promises.push(invokeWeb(intent.original));
        break;
      default:
        break;
    }
  }

  // 🛡 4) Esecuzione parallela con fallback su errore singolo provider
  const results = await Promise.all(
    promises.map((p, i) =>
      p.catch(
        (e: any) =>
          ({
            provider: requested[i],
            text: "",
            success: false,
            error: e?.message ?? "provider_failure",
            latencyMs: 0,
            tokensUsed: 0,
            promptTokens: 0,
            completionTokens: 0,
            estimatedCost: 0,
          } as ProviderResponse)
      )
    )
  );

  return {
    results,
    stats: {
      callsThisRequest: results.length,
      providersRequested: requested,
    },
  };
}

// ⬆️ FINE BLOCCO 4 — ANOVA_ORCHESTRATOR_V60_FANOUT_ROUTED
