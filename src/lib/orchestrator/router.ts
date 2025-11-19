// ⬇️ BLOCCO 4 — fanout V50
// ANOVA_ORCHESTRATOR_V50_FANOUT

import type { ProviderResponse } from "./types";
import type { ProviderKey } from "@/types/ai";

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

export async function fanout(intent: any): Promise<FanoutResult> {
  const requested: ProviderKey[] = [];
  const promises: Promise<ProviderResponse>[] = [];

  // 🔵 PROVIDER: OPENAI
  if (providerIsAvailable(process.env.OPENAI_API_KEY)) {
    requested.push("openai");
    promises.push(invokeOpenAI(intent.original));
  }

  // 🔵 PROVIDER: ANTHROPIC
  if (providerIsAvailable(process.env.ANTHROPIC_API_KEY)) {
    requested.push("anthropic");
    promises.push(invokeAnthropic(intent.original));
  }

  // 🔵 PROVIDER: GEMINI
  if (providerIsAvailable(process.env.GEMINI_API_KEY)) {
    requested.push("gemini");
    promises.push(invokeGemini(intent.original));
  }

  // 🔵 PROVIDER: MISTRAL
  if (providerIsAvailable(process.env.MISTRAL_API_KEY)) {
    requested.push("mistral");
    promises.push(invokeMistral(intent.original));
  }

  // 🔵 PROVIDER: LLAMA
  if (providerIsAvailable(process.env.LLAMA_API_KEY)) {
    requested.push("llama");
    promises.push(invokeLlama(intent.original));
  }

  // 🔵 PROVIDER: WEB SEARCH
  if (providerIsAvailable(process.env.WEB_SEARCH_API_KEY)) {
    requested.push("web");
    promises.push(invokeWeb(intent.original));
  }

  // 🛡 Nessun provider attivo → risposta fittizia
  if (promises.length === 0) {
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

  // 🔥 ESECUZIONE PARALLELA
const results = await Promise.all(
  promises.map((p, i) =>
    p.catch((e: any) =>
      ({
        provider: requested[i], // provider corretto
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

// ⬆️ FINE BLOCCO 4
