// ANOVA_CONTROL_ADAPTER_V2
// Traduce l’output del Manifesto nel ControlBlock interno di ANOVA
// Nessuna interpretazione semantica: solo mapping + completamento campi obbligatori.

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

import type { ProviderId } from "../types";

/* ------------------------------------------
 * Tipi input (dal Manifesto)
 * ------------------------------------------ */

export interface ManifestoOutput {
  category: "INFORMATIVE" | "OPERATIVE" | "DEBUG" | "DECISIONAL" | "PREFERENCES";
  confidence?: number; // 0.0 - 1.0
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
  checklist?: Array<{
    title: string;
    items: string[];
    priority?: "P1" | "P2" | "P3";
  }>;
  superPrompt?: string;
  finalAnswer?: string;
  notesForOrchestrator?: string[];
}

/* ------------------------------------------
 * Mapping helpers
 * ------------------------------------------ */

function mapCategory(cat: ManifestoOutput["category"]): RequestType {
  switch (cat) {
    case "INFORMATIVE":
      return "INFORMATIVA";
    case "OPERATIVE":
      return "OPERATIVA";
    case "DEBUG":
      return "TRASFORMATIVA";
    case "DECISIONAL":
      return "DECISIONALE";
    case "PREFERENCES":
      return "DIALOGICA";
    default:
      return "INFORMATIVA";
  }
}

function mapPhaseToStage(phase: ManifestoOutput["phaseNext"]): RequestStage {
  switch (phase) {
    case "UNDERSTAND":
    case "CHECKLIST":
    case "CLARIFY":
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
  phase: ManifestoOutput["phaseNext"]
): NextAction {
  switch (phase) {
    case "UNDERSTAND":
    case "CLARIFY":
      return "ASK_USER";
    case "CHECKLIST":
      return "GENERATE_CHECKLIST";
    case "SUPERPROMPT":
      return "GENERATE_SUPER_PROMPT";
    case "EXECUTE":
      return "EXECUTE_TASK";
    case "REFINE":
    case "DONE":
      return "REFINE_OUTPUT";
    default:
      return "ASK_USER";
  }
}

function mapConfidence(conf?: number): ConfidenceLevel {
  if (conf === undefined) return "medium";
  if (conf >= 0.75) return "high";
  if (conf >= 0.4) return "medium";
  return "low";
}

function suggestProviderLevel(
  category: ManifestoOutput["category"],
  confidence: ConfidenceLevel
): ProviderLevel {
  if (category === "INFORMATIVE" || category === "PREFERENCES") {
    return "econ";
  }

  if (category === "OPERATIVE" || category === "DECISIONAL") {
    return confidence === "high" ? "mid" : "econ";
  }

  return "mid";
}

function mapContextRequirements(
  category: ManifestoOutput["category"]
): ContextRequirements {
  switch (category) {
    case "OPERATIVE":
    case "DECISIONAL":
      return "high";
    case "DEBUG":
      return "medium";
    default:
      return "low";
  }
}

/* ------------------------------------------
 * Execution default (deterministico)
 * ------------------------------------------ */

function buildDefaultExecutionPolicy(
  providerLevel: ProviderLevel
): ExecutionPolicy {
  const byTier: Record<ProviderLevel, ProviderId[]> = {
    econ: ["openai:econ", "anthropic:econ", "gemini:econ"],
    mid: ["openai:mid", "anthropic:mid", "gemini:mid"],
    max: ["openai:max", "anthropic:max", "gemini:max"],
  };

  return {
    preferredTier: providerLevel,
    maxFanout: 2,
    providersByTier: byTier,
    escalation: {
      allowEscalation: true,
      minConfidenceForMid: "medium",
      minConfidenceForMax: "high",
      forceMidForOperative: true,
      forceMaxForHighRisk: false,
    },
  };
}

/* ------------------------------------------
 * MAIN ADAPTER
 * ------------------------------------------ */

export function adaptManifestoToControlBlock(
  manifesto: ManifestoOutput
): ControlBlock {
  const confidenceLevel = mapConfidence(manifesto.confidence);
  const nextAction = mapPhaseToNextAction(manifesto.phaseNext);
  const suggestedLevel = suggestProviderLevel(
    manifesto.category,
    confidenceLevel
  );

  const control: ControlBlock = {
    request_type: mapCategory(manifesto.category),
    request_stage: mapPhaseToStage(manifesto.phaseNext),

    clarity_status:
      manifesto.needsUserInput === false ? "CLEAR" : "PARTIALLY_CLEAR",

    checklist:
      manifesto.checklist?.flatMap((c) =>
        c.items.map((item) => ({
          item,
          description: c.title,
          required: c.priority === "P1",
        }))
      ) ?? [],

    missing_information: manifesto.questions ?? [],

    user_input_sufficiency:
      manifesto.needsUserInput === false ? "SUFFICIENT" : "INSUFFICIENT",

    next_action: nextAction,

    suggested_provider_level: suggestedLevel,
    confidence_level: confidenceLevel,
    context_requirements: mapContextRequirements(manifesto.category),
  };

  // 🔹 Execution SOLO se serve davvero
  if (nextAction === "EXECUTE_TASK") {
    control.execution = buildDefaultExecutionPolicy(suggestedLevel);
  }

  return control;
}
