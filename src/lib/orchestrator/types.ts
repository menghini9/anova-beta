// ======================================================
// ANOVA_ORCHESTRATOR_TYPES_V51
// Tipi riallineati al modello manifesto-driven:
// - ANOVA non interpreta contenuto
// - Stato operativo = ControlBlock (non Meta)
// - Meta = tracciamento, KPI, debug, memoria
// ======================================================

// ------------------------------------------------------
// PROVIDER
// ------------------------------------------------------
export type CoreProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "mistral"
  | "llama"
  | "web";

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
export type Domain = "logic" | "code" | "creative" | "factual" | "strategy";

// ------------------------------------------------------
// INTENT (DEPRECATO nel flusso manifesto-driven)
// ------------------------------------------------------
// ⚠️ Non eliminato per compatibilità con parti vecchie,
// ma NON deve essere obbligatorio nel core manifesto-driven.
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
// PROVIDER RESPONSE
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
// FUSION RESULT
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
// DEBUG
// ------------------------------------------------------
export interface FusionDebug {
  score: number;
  usedProviders: string[];
  discardedProviders: string[];
  domain: string;
  finalTextPreview: string;
}

// ------------------------------------------------------
// MEMORY (soft-typed, niente più "any" a caso)
// ------------------------------------------------------
export interface SessionMemory {
  context?: Record<string, unknown>;
  history?: Array<{
    ts: number;
    role: "user" | "assistant" | "system";
    text: string;
  }>;
  // spazio per estensioni future senza rompere i tipi
  [k: string]: unknown;
}

// ------------------------------------------------------
// ORCHESTRATION META (manifesto-driven)
// ------------------------------------------------------
// Regola d’oro: meta NON contiene "phase" o stati operativi.
// Quello vive nel ControlBlock.
export interface OrchestrationMeta {
  // Compatibilità: alcuni pezzi vecchi possono ancora valorizzarlo.
  // Nel flusso manifesto-driven può restare undefined.
  intent?: Intent;

  // Flag legacy: tenuti opzionali, perché non fanno parte del nuovo core
  smallTalkHandled?: boolean;
  clarificationUsed?: boolean;
  autoPromptUsed?: boolean;

  // KPI minimi (qui si rompevano i tuoi errori)
  stats?: {
    callsThisRequest: number;
    providersRequested: ProviderId[];
  };

  fusionDebug?: FusionDebug;

  autoPromptText?: string;

  // Memoria tipizzata (soft)
  memory?: SessionMemory;

  preferenceDetected?: boolean;

  // Campo libero per telemetria senza “inventare” nuove interfacce ogni volta
  tags?: Record<string, string | number | boolean>;
}

// ======================================================
// FINE TYPES V51
// ======================================================
