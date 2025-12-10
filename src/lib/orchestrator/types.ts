// ======================================================
// ANOVA_ORCHESTRATOR_TYPES_V50
// Tipi unificati e aggiornati per Intent, Provider, Fusion,
// Meta, Memoria e Debug.
// ======================================================

// ------------------------------------------------------
// PROVIDER
// ------------------------------------------------------

// ID di base (senza tier) — usati da policy & scoring
export type CoreProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "mistral"
  | "llama"
  | "web";

// ID completi con tier (usati ovunque nel core)
export type ProviderId =
  | "openai:econ"
  | "openai:mid"
  | "openai:max"
  | "anthropic:econ"
  | "anthropic:mid"
  | "anthropic:max"
  | "gemini:econ"
  | "gemini:mid"
  | "gemini:max"
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

  used: Array<{
    provider: ProviderId;
    score: number;
    latencyMs: number;
  }>;
}

// ------------------------------------------------------
// USER PROFILE
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
// PERFORMANCE SAMPLES
// ------------------------------------------------------
export interface PerformanceSample {
  provider: ProviderId;
  domain: Domain;
  score: number;
  latencyMs: number;
  ts: number;
}

// ------------------------------------------------------
// FUSION DEBUG
// ------------------------------------------------------
export interface FusionDebug {
  score: number;
  usedProviders: string[];
  discardedProviders: string[];
  domain: string;
  finalTextPreview: string;
}

// ------------------------------------------------------
// ORCHESTRATION META
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

  fusionDebug?: FusionDebug;

  autoPromptText?: string;
  memory?: any;

  preferenceDetected?: boolean;
}

// ======================================================
// FINE TYPES V50
// ======================================================
