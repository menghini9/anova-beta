// ⬇️ BLOCCO 3 — /src/lib/orchestrator/providers/_base.ts
// ANOVA_ORCHESTRATOR_V42

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const t = new Promise<never>((_, rej) => {
    timeoutId = setTimeout(() => rej(new Error("timeout")), ms);
  });
  const res = await Promise.race([p, t]);
  clearTimeout(timeoutId!);
  return res as T;
}
// ⬆️ FINE BLOCCO 3
