// ======================================================
// MEMORY — Token Estimator (cheap approximation)
// Path: src/lib/memory/estimate.ts
// Nota: stima grezza ~4 chars/token (IT/EN mixed).
// ======================================================

export function approxTokensFromText(txt: string): number {
  const s = (txt ?? "").trim();
  if (!s) return 0;
  return Math.ceil(s.length / 4);
}

export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return "";
  }
}
