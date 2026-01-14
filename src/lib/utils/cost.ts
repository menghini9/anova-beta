// ======================================================
// COST ENGINE — Provider cost calculator (server-side)
// Path: src/lib/utils/cost.ts
// ======================================================

export type ProviderId = "openai" | "anthropic" | "gemini";

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
  // Costi in EUR (o valuta che decidi)
  inputCost: number;
  outputCost: number;
  totalCost: number;
};

// --------------------------
// PRICING TABLE (€/1M tokens)
// --------------------------
// Nota: mettila qui apposta per poterla rimuovere/alterare facilmente.
// Quando cambi modello o prezzi, tocchi SOLO questo file.
type Pricing = { inPer1M: number; outPer1M: number };

// ⚠️ Inserisci i tuoi prezzi reali qui.
// Se vuoi, puoi tenere questi come placeholder e aggiornarli dopo.
const OPENAI_PRICING_EUR_PER_1M: Record<string, Pricing> = {
  // esempi placeholder
  "gpt-5": { inPer1M: 5.0, outPer1M: 15.0 },
  "gpt-4.1": { inPer1M: 10.0, outPer1M: 30.0 },
  "gpt-4o-mini": { inPer1M: 1.0, outPer1M: 4.0 },
};

function roundMoney(n: number) {
  return Math.round(n * 10000) / 10000; // 4 decimali, abbastanza per micro-costi
}

function getPricing(provider: ProviderId, model: string): Pricing {
  if (provider === "openai") {
    return OPENAI_PRICING_EUR_PER_1M[model] ?? OPENAI_PRICING_EUR_PER_1M["gpt-5"];
  }
  // placeholder per futuri provider
  return { inPer1M: 0, outPer1M: 0 };
}

export function computeProviderCost(args: {
  provider: ProviderId;
  model: string;
  usage: Usage | null | undefined;
}): CostResult {
  const usage = args.usage ?? {};
  const inputTokens = Number(usage.input_tokens ?? 0);
  const outputTokens = Number(usage.output_tokens ?? 0);
  const totalTokens = Number(usage.total_tokens ?? inputTokens + outputTokens);

  const pricing = getPricing(args.provider, args.model);

  const inputCost = (inputTokens / 1_000_000) * pricing.inPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outPer1M;

  const totalCost = inputCost + outputCost;

  return {
    provider: args.provider,
    model: args.model,
    inputTokens,
    outputTokens,
    totalTokens,
    inputCost: roundMoney(inputCost),
    outputCost: roundMoney(outputCost),
    totalCost: roundMoney(totalCost),
  };
}
