// ⬇️ BLOCCO TEST 1.0 — Orchestrator Diagnostics (Base)
import { getAIResponse } from "../index";

export async function runOrchestratorTests() {
  const results: any[] = [];

  // Helper per eseguire un singolo test
  async function run(name: string, input: string, expected: any) {
    const res = await getAIResponse(input);

    const pass =
      (expected.smallTalkHandled === undefined ||
        res.meta.smallTalkHandled === expected.smallTalkHandled) &&
      (expected.clarificationUsed === undefined ||
        res.meta.clarificationUsed === expected.clarificationUsed) &&
      (expected.autoPromptUsed === undefined ||
        res.meta.autoPromptUsed === expected.autoPromptUsed);

    results.push({
      name,
      input,
      expected,
      received: res.meta,
      status: pass ? "PASS" : "FAIL"
    });
  }

  // --- TEST REALI ---
  await run("SmallTalk - ciao", "ciao", {
    smallTalkHandled: true
  });

  await run("Clarificazione - cos'è anova?", "cos'è anova?", {
    clarificationUsed: true
  });

  await run("AutoPrompt - richiesta tecnica", "progettami un sistema multi-ai come anova beta", {
    autoPromptUsed: true
  });

  return results;
}
// ⬆️ FINE BLOCCO TEST 1.0
