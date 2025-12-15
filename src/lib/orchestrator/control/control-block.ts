// ANOVA_CONTROL_BLOCK_V3
// Unica fonte di verità operativa accettata da ANOVA.
// Stato = CONTROL, non meta, non codice.
// Manifesto-driven, execution-aware.

import type { ProviderId } from "../types";

// ------------------------------
// 1) CLASSIFICAZIONI ALTE
// ------------------------------
export type RequestType =
  | "INFORMATIVA"
  | "OPERATIVA"
  | "DECISIONALE"
  | "TRASFORMATIVA"
  | "DIALOGICA";

export type RequestStage =
  | "INITIAL"
  | "CLARIFICATION"
  | "READY_FOR_EXEC"
  | "EXECUTION"
  | "REVIEW";

export type ClarityStatus = "CLEAR" | "PARTIALLY_CLEAR" | "UNCLEAR";
export type Sufficiency = "INSUFFICIENT" | "SUFFICIENT" | "OPTIMAL";

export type NextAction =
  | "ASK_USER"
  | "GENERATE_CHECKLIST"
  | "GENERATE_SUPER_PROMPT"
  | "EXECUTE_TASK"
  | "REFINE_OUTPUT";

export type ProviderLevel = "econ" | "mid" | "max";
export type ConfidenceLevel = "low" | "medium" | "high";
export type ContextRequirements = "low" | "medium" | "high";

// ------------------------------
// 2) CHECKLIST
// ------------------------------
export interface ChecklistItem {
  item: string;
  description: string;
  required: boolean;
}

// ------------------------------
// 3) MEMORY UPDATE (comandi)
// ------------------------------
export interface MemoryUpdate {
  session?: Array<{ key: string; value: unknown }>;
  user?: Array<{ key: string; value: unknown }>;
}

// ------------------------------
// 4) EXECUTION POLICY
// ------------------------------
// Presente SOLO quando next_action = EXECUTE_TASK
export interface ExecutionPolicy {
  preferredTier: ProviderLevel;
  maxFanout: number;
  providersByTier: Record<ProviderLevel, ProviderId[]>;

  escalation: {
    allowEscalation: boolean;
    minConfidenceForMid: ConfidenceLevel;
    minConfidenceForMax: ConfidenceLevel;
    forceMidForOperative: boolean;
    forceMaxForHighRisk: boolean;
  };

  notes?: string;
}

// ------------------------------
// 5) CONTROL BLOCK
// ------------------------------
export interface ControlBlock {
  // Stato operativo
  request_type: RequestType;
  request_stage: RequestStage;
  clarity_status: ClarityStatus;

  // Checklist
  checklist: ChecklistItem[];
  missing_information: string[];

  // Sufficienza e azione
  user_input_sufficiency: Sufficiency;
  next_action: NextAction;

  // Opinioni AI (non decisioni)
  suggested_provider_level: ProviderLevel;
  confidence_level: ConfidenceLevel;
  context_requirements: ContextRequirements;

  // 🔹 Execution: opzionale, obbligatoria solo per EXECUTE_TASK
  execution?: ExecutionPolicy;

  // Memoria (comandi)
  memory_update?: MemoryUpdate;
}

// ------------------------------
// 6) OUTPUT WRAPPED
// ------------------------------
export interface ControlWrappedOutput {
  CONTROL: ControlBlock;
  payload?: unknown;
}
