// ======================================================
// API — chat-reply
// Path: src/app/api/chat-reply/route.ts
// ======================================================

import { NextResponse } from "next/server";

import { openAIReply } from "@/lib/ai/openai";
import { computeProviderCost } from "@/lib/utils/cost";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "").trim();
    const rules = String(body?.rules ?? "").trim();

    if (!prompt) {
      return NextResponse.json(
        { finalText: "⚠️ Prompt vuoto.", cost: null },
        { status: 400 }
      );
    }

    // 1) Provider reply
    const { text, usage, model } = await openAIReply({ prompt, rules });

    // 2) Provider cost (€/token) — server-side
    const cost = computeProviderCost({
      provider: "openai",
      model,
      usage,
    });

return NextResponse.json({
  finalText: text,
  cost,
  usage: usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  model,
});


  } catch (err: any) {
    return NextResponse.json(
      {
        finalText: "❌ Errore API.",
        cost: null,
        error: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
