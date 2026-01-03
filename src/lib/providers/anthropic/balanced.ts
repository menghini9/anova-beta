// ======================================================
// PROVIDER — Anthropic (DISABLED STUB)
// Path: /src/lib/providers/anthropic/balanced.ts
// Scopo: mantenere la build green quando Anthropic non è in uso.
// ======================================================

export const anthropicBalancedProvider = {
  id: "anthropic",
  enabled: false,
  // firma minima per non rompere gli import altrove
  timeoutMs: 60_000,
  cost: () => 0,
  async call() {
    throw new Error("Anthropic provider is disabled (stub).");
  },
};
