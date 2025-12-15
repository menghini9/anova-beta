// ANOVA_CONTROL_VALIDATOR_V3
// Validatore runtime: ANOVA accetta SOLO Control Block coerenti
// con lo stato operativo manifesto-driven.

import type {
  ControlWrappedOutput,
  ControlBlock,
  ChecklistItem,
} from "./control-block";

import type { ProviderId } from "../types";

// --------------------------------------------------
// RESULT TYPES
// --------------------------------------------------
type ValidationOk = { ok: true; value: ControlWrappedOutput };
type ValidationFail = { ok: false; error: string; raw?: unknown };

// --------------------------------------------------
// HELPERS BASE
// --------------------------------------------------
const isStr = (x: unknown) => typeof x === "string" && x.trim().length > 0;
const isArr = (x: unknown) => Array.isArray(x);
const isNum = (x: unknown) => typeof x === "number" && !Number.isNaN(x);

function oneOf<T extends string>(x: unknown, allowed: readonly T[]): x is T {
  return typeof x === "string" && (allowed as readonly string[]).includes(x);
}

// --------------------------------------------------
// CHECKLIST
// --------------------------------------------------
function isChecklistItem(x: unknown): x is ChecklistItem {
  return (
    typeof x === "object" &&
    x !== null &&
    isStr((x as any).item) &&
    isStr((x as any).description) &&
    typeof (x as any).required === "boolean"
  );
}

// --------------------------------------------------
// ENUMS
// --------------------------------------------------
const REQUEST_TYPE = [
  "INFORMATIVA",
  "OPERATIVA",
  "DECISIONALE",
  "TRASFORMATIVA",
  "DIALOGICA",
] as const;

const REQUEST_STAGE = [
  "INITIAL",
  "CLARIFICATION",
  "READY_FOR_EXEC",
  "EXECUTION",
  "REVIEW",
] as const;

const CLARITY = ["CLEAR", "PARTIALLY_CLEAR", "UNCLEAR"] as const;
const SUFF = ["INSUFFICIENT", "SUFFICIENT", "OPTIMAL"] as const;

const NEXT = [
  "ASK_USER",
  "GENERATE_CHECKLIST",
  "GENERATE_SUPER_PROMPT",
  "EXECUTE_TASK",
  "REFINE_OUTPUT",
] as const;

const LEVEL = ["econ", "mid", "max"] as const;
const CONF = ["low", "medium", "high"] as const;
const CTX = ["low", "medium", "high"] as const;

// --------------------------------------------------
// EXECUTION VALIDATION
// --------------------------------------------------
function isProviderArray(x: unknown): x is ProviderId[] {
  return isArr(x) && x.every(isStr);
}

function validateExecution(exec: unknown): boolean {
  if (!exec || typeof exec !== "object") return false;

  const e = exec as any;

  if (!oneOf(e.preferredTier, LEVEL)) return false;
  if (!isNum(e.maxFanout) || e.maxFanout <= 0) return false;

  if (!e.providersByTier || typeof e.providersByTier !== "object")
    return false;

  for (const tier of LEVEL) {
    if (!isProviderArray(e.providersByTier[tier])) return false;
  }

  const esc = e.escalation;
  if (!esc || typeof esc !== "object") return false;

  if (typeof esc.allowEscalation !== "boolean") return false;
  if (!oneOf(esc.minConfidenceForMid, CONF)) return false;
  if (!oneOf(esc.minConfidenceForMax, CONF)) return false;
  if (typeof esc.forceMidForOperative !== "boolean") return false;
  if (typeof esc.forceMaxForHighRisk !== "boolean") return false;

  return true;
}

// --------------------------------------------------
// CONTROL BLOCK VALIDATION
// --------------------------------------------------
function validateControlBlock(c: unknown): c is ControlBlock {
  if (!c || typeof c !== "object") return false;

  const cb = c as any;

  if (!oneOf(cb.request_type, REQUEST_TYPE)) return false;
  if (!oneOf(cb.request_stage, REQUEST_STAGE)) return false;
  if (!oneOf(cb.clarity_status, CLARITY)) return false;

  if (!isArr(cb.checklist) || !cb.checklist.every(isChecklistItem)) return false;
  if (!isArr(cb.missing_information) || !cb.missing_information.every(isStr))
    return false;

  if (!oneOf(cb.user_input_sufficiency, SUFF)) return false;
  if (!oneOf(cb.next_action, NEXT)) return false;

  if (!oneOf(cb.suggested_provider_level, LEVEL)) return false;
  if (!oneOf(cb.confidence_level, CONF)) return false;
  if (!oneOf(cb.context_requirements, CTX)) return false;

  // ------------------------------
  // EXECUTION POLICY: CONDIZIONALE
  // ------------------------------
  if (cb.next_action === "EXECUTE_TASK") {
    if (!validateExecution(cb.execution)) return false;
  } else {
    // Se non stiamo eseguendo, execution NON deve esserci
    if (cb.execution !== undefined) return false;
  }

  // ------------------------------
  // MEMORY UPDATE (opzionale)
  // ------------------------------
  if (cb.memory_update) {
    const mu = cb.memory_update;
    if (mu.session && !isArr(mu.session)) return false;
    if (mu.user && !isArr(mu.user)) return false;
  }

  return true;
}

// --------------------------------------------------
// PARSE + VALIDATE
// --------------------------------------------------
export function parseAndValidateControl(
  rawText: string
): ValidationOk | ValidationFail {
  let obj: unknown;

  try {
    obj = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      error: "CONTROL non è JSON valido",
      raw: rawText,
    };
  }

  if (
    !obj ||
    typeof obj !== "object" ||
    !("CONTROL" in obj)
  ) {
    return {
      ok: false,
      error: "Chiave CONTROL mancante",
      raw: obj,
    };
  }

  const control = (obj as any).CONTROL;

  if (!validateControlBlock(control)) {
    return {
      ok: false,
      error: "CONTROL presente ma non conforme allo schema V3",
      raw: obj,
    };
  }

  return { ok: true, value: obj as ControlWrappedOutput };
}
