// ⬇️ BLOCCO 14 — /src/app/api/orchestrate/route.ts
// ANOVA_ORCHESTRATOR_V42

import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/orchestrator";

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "missing_prompt" }, { status: 400 });
    }
    const out = await getAIResponse(prompt, userId);
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
// ⬆️ FINE BLOCCO 14
