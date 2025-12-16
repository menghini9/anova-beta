// ANOVA_CONTROL_ADAPTER_V2
// Traduce ManifestoOutput -> ControlBlock (con execution obbligatorio)

import type { ProviderId } from "../types";
import type {
  ControlBlock,
  RequestType,
  RequestStage,
  NextAction,
  ProviderLevel,
  ConfidenceLevel,
  ContextRequirements,
  ExecutionPolicy,
} from "./control-block";

export interface ManifestoOutput {
  category: "INFORMATIVE" | "OPERATIVE" | "DEBUG" | "DECISIONAL" | "PREFERENCES";
  confidence?: number; // 0..1
  phaseNext:
    | "UNDERSTAND"
    | "CHECKLIST"
    | "CLARIFY"
    | "SUPERPROMPT"
    | "EXECUTE"
    | "REFINE"
    | "DONE";
  needsUserInput?: boolean;
  questions?: string[];
  checklist?: Array<{ title: string; items: string[]; priority?: "P1" | "P2" | "P3" }>;
  superPrompt?: string;
  finalAnswer?: string;
  notesForOrchestrator?: string[];
}

export interface AdaptedControlResult {
  control: ControlBlock;
  payload: {
    superPrompt?: string;
    finalAnswer?: string;
    notesForOrchestrator?: string[];
  };
}

const isNonEmpty = (x: any) => typeof x === "string" && x.trim().length > 0;

function mapCategory(cat: ManifestoOutput["category"]): RequestType {
  switch (cat) {
    case "INFORMATIVE": return "INFORMATIVA";
    case "OPERATIVE": return "OPERATIVA";
    case "DEBUG": return "TRASFORMATIVA";
    case "DECISIONAL": return "DECISIONALE";
    case "PREFERENCES": return "DIALOGICA";
    default: return "INFORMATIVA";
  }
}

function mapConfidence(conf?: number): ConfidenceLevel {
  if (conf === undefined) return "medium";
  if (conf >= 0.75) return "high";
  if (conf >= 0.4) return "medium";
  return "low";
}

function mapPhaseToStage(phase: ManifestoOutput["phaseNext"]): RequestStage {
  switch (phase) {
    case "CLARIFY":
    case "UNDERSTAND":
    case "CHECKLIST":
      return "CLARIFICATION";
    case "SUPERPROMPT":
      return "READY_FOR_EXEC";
    case "EXECUTE":
      return "EXECUTION";
    case "REFINE":
    case "DONE":
      return "REVIEW";
    default:
      return "INITIAL";
  }
}

function mapPhaseToNextAction(
  phase: ManifestoOutput["phaseNext"],
  hasSuperPrompt: boolean,
  hasFinalAnswer: boolean
): NextAction {
  if (hasFinalAnswer && !hasSuperPrompt) return "REFINE_OUTPUT";
  switch (phase) {
    case "CLARIFY":
    case "UNDERSTAND": return "ASK_USER";
    case "CHECKLIST": return "GENERATE_CHECKLIST";
    case "SUPERPROMPT": return "GENERATE_SUPER_PROMPT";
    case "EXECUTE": return "EXECUTE_TASK";
    case "REFINE":
    case "DONE": return "REFINE_OUTPUT";
    default: return "ASK_USER";
  }
}

function suggestTier(category: ManifestoOutput["category"], conf: ConfidenceLevel): ProviderLevel {
  if (category === "INFORMATIVE" || category === "PREFERENCES") return "econ";
  if (category === "OPERATIVE" || category === "DECISIONAL") return conf === "high" ? "mid" : "econ";
  return "econ";
}

function buildExecutionPolicy(preferredTier: ProviderLevel): ExecutionPolicy {
  const providersByTier: Record<ProviderLevel, ProviderId[]> = {
    econ: ["openai:econ"],
    mid: ["openai:mid"],
    max: ["openai:max"],
  };

  return {
    preferredTier,
    maxFanout: 1,
    providersByTier,
    escalation: {
      allowEscalation: true,
      minConfidenceForMid: "medium",
      minConfidenceForMax: "high",
      forceMidForOperative: true,
      forceMaxForHighRisk: false,
    },
    notes: "default_exec_policy_openai_only",
  };
}

export function adaptManifestoToControlBlock(manifesto: ManifestoOutput): AdaptedControlResult {
  const confidenceLevel = mapConfidence(manifesto.confidence);

  const hasSuperPrompt = isNonEmpty(manifesto.superPrompt);
  const hasFinalAnswer = isNonEmpty(manifesto.finalAnswer);

  const tier = suggestTier(manifesto.category, confidenceLevel);

  const control: ControlBlock = {
    request_type: mapCategory(manifesto.category),
    request_stage: mapPhaseToStage(manifesto.phaseNext),
    clarity_status: manifesto.needsUserInput === false ? "CLEAR" : "PARTIALLY_CLEAR",

    checklist:
      manifesto.checklist?.flatMap((c) =>
        c.items.map((item) => ({
          item,
          description: c.title,
          required: c.priority === "P1",
        }))
      ) ?? [],

    missing_information: manifesto.questions ?? [],

    user_input_sufficiency: manifesto.needsUserInput === false ? "SUFFICIENT" : "INSUFFICIENT",
    next_action: mapPhaseToNextAction(manifesto.phaseNext, hasSuperPrompt, hasFinalAnswer),

    suggested_provider_level: tier,
    confidence_level: confidenceLevel,
    context_requirements: manifesto.category === "OPERATIVE" ? "high" : "medium",

    // ✅ fondamentale: senza questo il validator boccia
    execution: buildExecutionPolicy(tier),

    memory_update: undefined,
  };

  return {
    control,
    payload: {
      superPrompt: manifesto.superPrompt,
      finalAnswer: manifesto.finalAnswer,
      notesForOrchestrator: manifesto.notesForOrchestrator,
    },
  };
}
