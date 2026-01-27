import type { ProviderId } from "@/lib/chat/types";


// =========================
// 1) USAGE — formato interno (provider-agnostic)
// =========================
export type Usage = {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

export type CostResult = {
  provider: ProviderId;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  // Costi in EUR
  inputCost: number;
  outputCost: number;
  totalCost: number;
};
// FX semplice (aggiornalo quando vuoi)
const USD_TO_EUR = 0.92;
const usdToEur = (v: number) => v * USD_TO_EUR;

// =========================
// 2) PRICING TABLE (€/1M tokens)
// =========================
type Pricing = { inPer1M: number; outPer1M: number };

// --- OpenAI (placeholder: metti i tuoi reali)
const OPENAI_PRICING_EUR_PER_1M: Record<string, Pricing> = {
  "gpt-5": { inPer1M: 5.0, outPer1M: 15.0 },
  "gpt-4.1": { inPer1M: 10.0, outPer1M: 30.0 },
  "gpt-4o-mini": { inPer1M: 1.0, outPer1M: 4.0 },
};

// --- Gemini (EUR / 1M tokens)
const GEMINI_PRICING_EUR_PER_1M: Record<string, Pricing> = {
  "gemini-2.5-flash": { inPer1M: 0.3, outPer1M: 0.6 },
  "gemini-2.5-pro": { inPer1M: 3.0, outPer1M: 6.0 },
  "gemini-2.5-flash-lite": { inPer1M: 0.1, outPer1M: 0.2 },
};


// --- Claude (placeholder)
const CLAUDE_PRICING_EUR_PER_1M: Record<string, Pricing> = {
  "claude-3-5-sonnet-20241022": { inPer1M: usdToEur(3.0), outPer1M: usdToEur(15.0) },
  "claude-3-5-haiku-20241022":  { inPer1M: usdToEur(1.0), outPer1M: usdToEur(5.0) },
};


// =========================
// 3) HELPERS
// =========================
function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function roundMoney(v: number) {
  return Math.round(v * 10000) / 10000; // 4 decimali
}

// Se il model non è noto, fallback coerente per provider
function getPricing(provider: ProviderId, model: string): Pricing {
  if (provider === "openai") {
    return OPENAI_PRICING_EUR_PER_1M[model] ?? OPENAI_PRICING_EUR_PER_1M["gpt-4o-mini"];
  }
  if (provider === "gemini") {
    return (
      GEMINI_PRICING_EUR_PER_1M[model] ??
      GEMINI_PRICING_EUR_PER_1M["gemini-2.5-flash"] ??
      { inPer1M: 0, outPer1M: 0 }
    );
  }
  // provider === "claude"
  return (
    CLAUDE_PRICING_EUR_PER_1M[model] ??
    CLAUDE_PRICING_EUR_PER_1M["claude-3-5-haiku-20241022"] ??
    { inPer1M: 0, outPer1M: 0 }
  );
}

// =========================
// 4) MAIN — computeProviderCost
// NOTE: model può essere null/undefined (route/edge cases) -> fallback sicuro
// =========================
export function computeProviderCost(args: {
  provider: ProviderId;
  model: string | null | undefined;
  usage: Usage | null | undefined;
}): CostResult {
  const usage = args.usage ?? {};

  const inputTokens = n(usage.input_tokens ?? 0);
  const outputTokens = n(usage.output_tokens ?? 0);
  const totalTokens = n(usage.total_tokens ?? inputTokens + outputTokens);

  const model = String(args.model ?? "unknown");

  const pricing = getPricing(args.provider, model);

  const inputCost = (inputTokens / 1_000_000) * pricing.inPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outPer1M;
  const totalCost = inputCost + outputCost;

  return {
    provider: args.provider,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    inputCost: roundMoney(inputCost),
    outputCost: roundMoney(outputCost),
    totalCost: roundMoney(totalCost),
  };
}
