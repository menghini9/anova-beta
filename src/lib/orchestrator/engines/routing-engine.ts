// ANOVA_ROUTING_ENGINE_V5
// Routing deterministico, esecutivo, manifesto-driven.
// NON decide cosa fare. Decide SOLO chi chiamare.

import type { ProviderId } from "../types";
import type { ControlBlock, ProviderLevel } from "../control/control-block";

// --------------------------------------------------
// Helpers
// --------------------------------------------------
const confidenceRank: Record<"low" | "medium" | "high", number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function shouldEscalate(
  current: ProviderLevel,
  target: ProviderLevel
): boolean {
  const rank: Record<ProviderLevel, number> = {
    econ: 0,
    mid: 1,
    max: 2,
  };
  return rank[target] > rank[current];
}

// --------------------------------------------------
// MAIN
// --------------------------------------------------
export function runRoutingEngine(control: ControlBlock): ProviderId[] {
  const exec = control.execution;

  // 🛑 Routing chiamato senza execution → nessuna chiamata
  if (!exec) return [];

  let tier: ProviderLevel = exec.preferredTier;
  let escalationApplied = false;

  // ------------------------------
  // Escalation rules
  // ------------------------------
  if (exec.escalation.allowEscalation) {
    // confidence-based
    if (
      shouldEscalate(tier, "mid") &&
      confidenceRank[control.confidence_level] <
        confidenceRank[exec.escalation.minConfidenceForMid]
    ) {
      tier = "mid";
      escalationApplied = true;
    }

    if (
      shouldEscalate(tier, "max") &&
      confidenceRank[control.confidence_level] <
        confidenceRank[exec.escalation.minConfidenceForMax]
    ) {
      tier = "max";
      escalationApplied = true;
    }

    // hard rules
    if (
      exec.escalation.forceMidForOperative &&
      control.request_type === "OPERATIVA" &&
      shouldEscalate(tier, "mid")
    ) {
      tier = "mid";
      escalationApplied = true;
    }

    if (
      exec.escalation.forceMaxForHighRisk &&
      control.context_requirements === "high" &&
      shouldEscalate(tier, "max")
    ) {
      tier = "max";
      escalationApplied = true;
    }
  }

  // ------------------------------
  // Provider selection
  // ------------------------------
  const allowed = exec.providersByTier[tier] ?? [];
  if (allowed.length === 0) return [];

  const fanout = Math.min(exec.maxFanout, allowed.length);

  // 🔹 Nota: qui puoi randomizzare o ruotare in futuro
  return allowed.slice(0, fanout);
}
