// ===========================
// ANOVA_RUN_V1
// Punto di accesso operativo di Anova β
// ===========================

import { getAIResponse } from "@/lib/orchestrator";

export async function runAnova(prompt: string, userId?: string) {
  const result = await getAIResponse(prompt, userId);

  return {
    text: result.fusion.finalText,
    raw: result.raw,
    meta: result.meta,
    cost: result.costThisRequest,
  };
}
