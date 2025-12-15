// ⬇️ BLOCCO 1 — Base Provider V2 (Robusto)
// ANOVA_ORCHESTRATOR_V52_PROVIDER_BASE

import { withTimeout } from "./_base";
import type { ProviderResponse, ProviderId } from "../orchestrator/types";

// ------------------------------
// Tipi interni di errore standard
// ------------------------------
type ExecErrorType = "http" | "timeout" | "parse" | "provider" | "unknown";

type ExecOk = { ok: true; raw: any };
type ExecFail = { ok: false; type: ExecErrorType; message: string; raw?: any };
type ExecResult = ExecOk | ExecFail;

// ------------------------------
// Config
// ------------------------------
export interface BaseInvokeConfig {
  provider: ProviderId;
  exec: () => Promise<ExecResult>; // ⬅️ ora deve ritornare ExecResult
  parse: (raw: any) => {
    text: string;
    promptTokens?: number;
    completionTokens?: number;
  };
  timeoutMs: number;
  cost: (usage: { promptTokens: number; completionTokens: number }) => number;
}

// ------------------------------
// Helper
// ------------------------------
function safeStr(x: any, max = 400) {
  const s = typeof x === "string" ? x : JSON.stringify(x);
  return s.length > max ? s.slice(0, max) + "..." : s;
}

// ------------------------------
// MAIN
// ------------------------------
export async function invokeBase(
  config: BaseInvokeConfig
): Promise<ProviderResponse> {
  const t0 = Date.now();

  try {
    // 1) Esecuzione con timeout
    const execResult = await withTimeout(config.exec(), config.timeoutMs);

    // 2) Se exec ha fallito → NON è empty_response
    if (!execResult.ok) {
      return {
        provider: config.provider,
        text: "",
        success: false,
        error: `[${execResult.type}] ${execResult.message}`,
        latencyMs: Date.now() - t0,
        tokensUsed: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCost: 0,
      };
    }

    // 3) Parse normalizzato
    let parsed;
    try {
      parsed = config.parse(execResult.raw);
    } catch (e: any) {
      return {
        provider: config.provider,
        text: "",
        success: false,
        error: `[parse] ${e?.message ?? "parse_failed"} — raw: ${safeStr(execResult.raw)}`,
        latencyMs: Date.now() - t0,
        tokensUsed: 0,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCost: 0,
      };
    }

    const text = (parsed.text ?? "").trim();

    // 4) Token/costo
    const promptTokens = parsed.promptTokens ?? 0;
    const completionTokens = parsed.completionTokens ?? 0;
    const tokensUsed = promptTokens + completionTokens;
    const estimatedCost = config.cost({ promptTokens, completionTokens });

    // 5) Empty response = caso vero, non “errore mascherato”
    const isEmpty = text.length === 0;

    return {
      provider: config.provider,
      text,
      success: !isEmpty,
      error: isEmpty ? "empty_response" : undefined,
      latencyMs: Date.now() - t0,
      tokensUsed,
      promptTokens,
      completionTokens,
      estimatedCost,
    };
  } catch (e: any) {
    const msg = e?.message ?? "unknown_error";
    const type: ExecErrorType = msg.toLowerCase().includes("timeout")
      ? "timeout"
      : "unknown";

    return {
      provider: config.provider,
      text: "",
      success: false,
      error: `[${type}] ${msg}`,
      latencyMs: Date.now() - t0,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }
}

// ⬆️ FINE BLOCCO 1
