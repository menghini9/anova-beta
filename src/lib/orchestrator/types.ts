// ======================================================
// ANOVA_ORCHESTRATOR_TYPES_V50
// Tipi unificati e aggiornati per Intent, Provider, Fusion,
// Meta, Memoria e Debug.
// ======================================================

// ------------------------------------------------------
// PROVIDER
// ------------------------------------------------------
export type ProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "mistral"
  | "llama"
  | "web";

// ------------------------------------------------------
// DOMAINI
// ------------------------------------------------------
export type Domain =
  | "logic"
  | "code"
  | "creative"
  | "factual"
  | "strategy";

// ------------------------------------------------------
// INTENT (esteso e modernizzato)
// ------------------------------------------------------
export interface Intent {
  purpose: Domain;
  tone: "concise" | "neutral" | "rich";
  complexity: "low" | "medium" | "high";
  keywords: string[];
  original: string;
  userId?: string;

  lexiconDetail?: "low" | "medium" | "high";
  lexiconTone?: "concise" | "neutral" | "rich";

  mode?: "chat" | "question" | "task" | "smalltalk";
  isSmallTalk?: boolean;
  isSimpleQuestion?: boolean;
  needsClarification?: boolean;
  clarificationType?: "anova_ambiguous" | "vague_goal" | "generic";
  autoPromptNeeded?: boolean;
}

// ------------------------------------------------------
// PROVIDER RESPONSE (standardizzato)
// ------------------------------------------------------
export interface ProviderResponse {
  provider: ProviderId;
  text: string;
  latencyMs: number;
  success: boolean;
  error?: string;

  // opzioni per costi/token
  tokensUsed?: number;
  estimatedCost?: number;
  promptTokens?: number;
  completionTokens?: number;
}

// ------------------------------------------------------
// FUSION RESULT (risultato della fusione AI)
// ------------------------------------------------------
export interface FusionResult {
  finalText: string;
  fusionScore: number; // 0..1

  // elenco provider usati con punteggi → richiesto dal pannello Fusion
  used: Array<{
    provider: ProviderId;
    score: number;
    latencyMs: number;
  }>;
}

// ------------------------------------------------------
// USER PROFILE (preferenze persistenti)
// ------------------------------------------------------
export interface UserProfile {
  userId: string;
  prefs?: {
    prefer?: Partial<Record<Domain, ProviderId[]>>;
    tone?: Intent["tone"];
    detail?: "low" | "medium" | "high";
  };
}

// ------------------------------------------------------
// PERFORMANCE SAMPLES (per il futuro performance map)
// ------------------------------------------------------
export interface PerformanceSample {
  provider: ProviderId;
  domain: Domain;
  score: number;      // 0..1
  latencyMs: number;
  ts: number;         // timestamp
}

// ------------------------------------------------------
// FUSION DEBUG (nuovo formato semplificato + coerente con UI)
// ------------------------------------------------------
export interface FusionDebug {
  score: number;              // punteggio finale fusione
  usedProviders: string[];    // provider utilizzati
  discardedProviders: string[]; // provider scartati
  domain: string;             // dominio finale scelto
  finalTextPreview: string;   // anteprima testo fuso
}

// ------------------------------------------------------
// ORCHESTRATION META (meta pannello tecnico)
// ------------------------------------------------------
export interface OrchestrationMeta {
  intent: Intent;

  smallTalkHandled: boolean;
  clarificationUsed: boolean;
  autoPromptUsed: boolean;

  stats?: {
    callsThisRequest: number;
    providersRequested: ProviderId[];
  };

  // pannello Fusion
  fusionDebug?: FusionDebug;

  autoPromptText?: string;
  memory?: any;

  // preferenze utente intercettate a runtime
  preferenceDetected?: boolean;
}

// ======================================================
// FINE TYPES V50
// ======================================================
