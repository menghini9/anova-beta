// ⬇️ BLOCCO 1.1 — /src/lib/orchestrator/types.ts (Intent esteso)
// ANOVA_ORCHESTRATOR_V42_INTENT

export type ProviderId = "openai" | "anthropic" | "gemini" | "mistral" | "llama" | "web";

export type Domain =
  | "logic"
  | "code"
  | "creative"
  | "factual"
  | "strategy";

export interface Intent {
  purpose: Domain;          // es. "code"
  tone: "concise" | "neutral" | "rich";
  complexity: "low" | "medium" | "high";
  keywords: string[];
  original: string;         // prompt originale utente
  userId?: string;

  // 🔎 Nuovi campi intelligenti
  mode?: "chat" | "question" | "task" | "smalltalk";
  isSmallTalk?: boolean;        // es. "ciao", "come stai"
  isSimpleQuestion?: boolean;   // domanda semplice, oggettiva
  needsClarification?: boolean; // richiesta ambigua (serve domanda in più)
  clarificationType?: "anova_ambiguous" | "vague_goal" | "generic";
  autoPromptNeeded?: boolean;   // conviene migliorare il prompt prima di interrogare le AI
}

export interface ProviderResponse {
  provider: ProviderId;
  text: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface FusionResult {
  finalText: string;
  fusionScore: number;      // 0..1
  used: Array<{ provider: ProviderId; score: number; latencyMs: number }>;
}

export interface UserProfile {
  userId: string;
  prefs?: {
    prefer?: Partial<Record<Domain, ProviderId[]>>;
    tone?: Intent["tone"];
    detail?: "low" | "medium" | "high";
  };
}

export interface PerformanceSample {
  provider: ProviderId;
  domain: Domain;
  score: number;      // 0..1
  latencyMs: number;
  ts: number;
}
// ⬆️ FINE BLOCCO 1.1
// ⬇️ BLOCCO 1.2 — OrchestrationMeta (meta-informazioni per il pannello tecnico)
// ANOVA_ORCHESTRATOR_V42_PANEL

export interface OrchestrationMeta {
  intent: Intent;
  smallTalkHandled: boolean;     // true se la risposta è stata gestita localmente (no AI esterne)
  clarificationUsed: boolean;    // true se è stata fatta una domanda di chiarimento
  autoPromptUsed: boolean;       // true se è stato usato un auto-prompt arricchito per i provider
}
// ⬆️ FINE BLOCCO 1.2
