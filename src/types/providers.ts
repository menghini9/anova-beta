// ⬇️ BLOCCO PROVIDER RESPONSE — providers.ts
// ANOVA_ORCHESTRATOR_V50_PROVIDER_STANDARD

import type { ProviderKey } from "@/types/ai";

export interface ProviderResponse {
  provider: ProviderKey;       // "openai" | "anthropic" | ...
  text: string;                // Risposta testuale normalizzata
  success: boolean;            // true/false
  error?: string;              // stringa errore se presente

  latencyMs: number;           // tempo totale della chiamata
  tokensUsed: number;          // prompt + completion tokens
  promptTokens: number;        // input tokens (se disponibili)
  completionTokens: number;    // output tokens (se disponibili)
  estimatedCost: number;       // costo in USD stimato per la singola chiamata

  // Campo libero per futuri metadata provider-specifici
  meta?: Record<string, any>;
}
// ⬆️ FINE BLOCCO PROVIDER RESPONSE
