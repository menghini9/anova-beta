// ======================================================
// API — chat-reply (KPI Contract Stable)
// Path: src/app/api/chat-reply/route.ts
// ======================================================

import { NextResponse } from "next/server";

import { openAIReply } from "@/lib/ai/openai";
import { geminiReply } from "@/lib/ai/gemini";
import { claudeReply } from "@/lib/ai/claude";

import { computeProviderCost } from "@/lib/utils/cost";

export const dynamic = "force-dynamic";

// =========================
// TIPI (stabili per UI)
// =========================
type UsageLite = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type CostLite = {
  totalCost: number;
  currency: "EUR";
};

// =========================
// HELPERS — numeri sicuri
// =========================
function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

// =========================
// NORMALIZER — usage
// Supporta vari formati (OpenAI/Gemini/Claude/altro)
// =========================
function normalizeUsage(raw: any): UsageLite {
  const pt =
    raw?.prompt_tokens ??
    raw?.input_tokens ??
    raw?.promptTokenCount ??
    raw?.promptTokens ??
    0;

  const ct =
    raw?.completion_tokens ??
    raw?.output_tokens ??
    raw?.candidatesTokenCount ??
    raw?.completionTokens ??
    0;

  const tt =
    raw?.total_tokens ??
    raw?.totalTokenCount ??
    raw?.totalTokens ??
    n(pt) + n(ct);

  return {
    prompt_tokens: n(pt),
    completion_tokens: n(ct),
    total_tokens: n(tt),
  };
}

// =========================
// NORMALIZER — cost
// =========================
function normalizeCost(raw: any): CostLite {
  const total = raw?.totalCost ?? raw?.total_cost ?? raw?.eur ?? 0;

  return {
    totalCost: n(total),
    currency: "EUR",
  };
}

// =========================
// PROVIDER PICKER — semplice e robusto
// body.provider: "openai" | "gemini" | "claude"
// fallback: openai
// =========================
function pickProvider(v: any): "openai" | "gemini" | "claude" {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "gemini") return "gemini";
  if (s === "claude" || s === "anthropic") return "claude";
  return "openai";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "").trim();
    const rules = String(body?.rules ?? "").trim();
    const provider = pickProvider(body?.provider);

    if (!prompt) {
      return NextResponse.json(
        {
          finalText: "⚠️ Prompt vuoto.",
          provider,
          model: null,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          cost: { totalCost: 0, currency: "EUR" },
        },
        { status: 400 }
      );
    }

    // 1) Provider reply
    let text = "";
    let usage: any = null;
    let model: string | null = null;

    if (provider === "gemini") {
      const r = await geminiReply({ prompt, rules });
      text = r.text;
      usage = r.usage;
      model = r.model;
    } else if (provider === "claude") {
      const r = await claudeReply({ prompt, rules });
      text = r.text;
      usage = r.usage;
      model = r.model;
    } else {
      const r = await openAIReply({ prompt, rules });
      text = r.text;
      usage = r.usage;
      model = r.model;
    }

    // 2) Provider cost — server-side
    const costRaw = computeProviderCost({
      provider, // 👈 ora dinamico
      model,
      usage,
    });

    // 3) Normalizzazione definitiva (contratto stabile)
    const usageNorm = normalizeUsage(usage);
    const costNorm = normalizeCost(costRaw);

    return NextResponse.json({
      finalText: text,
      provider,
      model: model ?? null,
      usage: usageNorm,
      cost: costNorm,
    });
  } catch (err: any) {
    // fallback provider: prova a leggerlo dal body? non serve: qui mettiamo "openai"
    return NextResponse.json(
      {
        finalText: "❌ Errore API.",
        provider: "openai",
        model: null,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        cost: { totalCost: 0, currency: "EUR" },
        error: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
