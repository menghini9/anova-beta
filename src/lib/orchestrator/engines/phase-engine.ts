// ANOVA_PHASE_ENGINE_V1
// Path: /src/lib/orchestrator/engines/phase-engine.ts

import type { ContextPacket, AnovaPhase } from "../context/context-packet";

// Regole deterministiche semplici: Anova non “capisce”, ma tiene il processo in carreggiata.
export function nextPhaseFromDirective(current: ContextPacket): AnovaPhase {
  const d = current.lastDirective;
  if (!d) return current.phase ?? "UNDERSTAND";

  // Se serve input utente, restiamo in CLARIFY (o UNDERSTAND) a seconda del directive
  if (d.needsUserInput) return d.phaseNext === "UNDERSTAND" ? "UNDERSTAND" : "CLARIFY";

  // Se abbiamo superPrompt → si passa a EXECUTE
  if (d.phaseNext === "SUPERPROMPT" && d.superPrompt) return "EXECUTE";

  // Fallback: segue la fase proposta
  return d.phaseNext ?? current.phase ?? "UNDERSTAND";
}
