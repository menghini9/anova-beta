// ======================================================
// API — CHAT REPLY (NEW / MOCK)
// Path: src/app/api/chat-reply/route.ts
// ======================================================

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { prompt?: unknown; rules?: unknown };

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const rules = typeof body.rules === "string" ? body.rules.trim() : "";

    if (!prompt) return NextResponse.json({ error: "missing_prompt" }, { status: 400 });

    // ✅ MOCK (per verificare wiring UI + Firestore)
    const text =
      rules
        ? `Ricevuto. (regole attive)\n\nHai scritto: ${prompt}`
        : `Ricevuto.\n\nHai scritto: ${prompt}`;

    return NextResponse.json(
      {
        finalText: text,
        meta: { used: "mock" },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
