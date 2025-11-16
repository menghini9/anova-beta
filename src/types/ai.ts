// ⬇️ BLOCCO TYPES AI — /src/types/ai.ts

export type ProviderKey = "openai" | "anthropic" | "gemini" | "mistral" | "llama" | "web";

export interface ProviderUsage {
  calls: number;
  costUsd: number;
  tokens: number;
}

export interface AiUsage {
  totalCalls: number;
  totalCostUsd: number;
  totalTokens: number;
  perProvider: Record<ProviderKey, ProviderUsage>;
}

export const EMPTY_AI_USAGE: AiUsage = {
  totalCalls: 0,
  totalCostUsd: 0,
  totalTokens: 0,
  perProvider: {
    openai: { calls: 0, costUsd: 0, tokens: 0 },
    anthropic: { calls: 0, costUsd: 0, tokens: 0 },
    gemini: { calls: 0, costUsd: 0, tokens: 0 },
    mistral: { calls: 0, costUsd: 0, tokens: 0 },
    llama: { calls: 0, costUsd: 0, tokens: 0 },
    web: { calls: 0, costUsd: 0, tokens: 0 },
  },
};

// ⬆️ FINE BLOCCO TYPES AI
