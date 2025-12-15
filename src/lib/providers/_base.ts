// PROVIDER_BASE_V1
import type { ProviderResponse, ProviderId } from "../orchestrator/types";
// ANOVA_PROVIDER_UTILS_V1
// Utility condivise tra tutti i provider

/**
 * Esegue una promise con timeout forzato.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("timeout"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export interface BaseInvokeConfig {
  provider: ProviderId;
  exec: () => Promise<any>;
  parse: (raw: unknown) => {
    text: string;
    promptTokens?: number;
    completionTokens?: number;
  };
  timeoutMs: number;
  cost: (usage: {
    promptTokens: number;
    completionTokens: number;
  }) => number;
}

export async function invokeBase(
  config: BaseInvokeConfig
): Promise<ProviderResponse> {
  const start = Date.now();

  try {
    const raw = await Promise.race([
      config.exec(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), config.timeoutMs)
      ),
    ]);

    const parsed = config.parse(raw);

    const promptTokens = parsed.promptTokens ?? 0;
    const completionTokens = parsed.completionTokens ?? 0;

    return {
      provider: config.provider,
      text: parsed.text ?? "",
      success: Boolean(parsed.text),
      error: parsed.text ? undefined : "empty_response",
      latencyMs: Date.now() - start,
      tokensUsed: promptTokens + completionTokens,
      promptTokens,
      completionTokens,
      estimatedCost: config.cost({
        promptTokens,
        completionTokens,
      }),
    };
  } catch (err: any) {
    return {
      provider: config.provider,
      text: "",
      success: false,
      error: err?.message ?? "provider_error",
      latencyMs: Date.now() - start,
      tokensUsed: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedCost: 0,
    };
  }
}
