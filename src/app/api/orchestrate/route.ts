// ⬇️ BLOCCO 14 — /src/app/api/orchestrate/route.ts
// ANOVA_ORCHESTRATOR_V44 — Stage-aware (OPEN_CHAT vs PRODUCTION)

import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/orchestrator";

type ProjectPacket = {
  projectId?: string;
  intent?: string;
  mode?: string;   // breve | guidato
  stage?: string;  // OPEN_CHAT | PRODUCTION | ...
  briefContract?: string;
  contextText?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, userId, sessionId, projectPacket } = body as {
      prompt: string;
      userId?: string;
      sessionId?: string;
      projectPacket?: ProjectPacket;
    };

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "missing_prompt" }, { status: 400 });
    }

    const isProject = Boolean(projectPacket?.projectId);
    const stage = projectPacket?.stage;

    const stageInstruction =
      isProject && stage === "OPEN_CHAT"
        ? [
            "=== ISTRUZIONI STAGE: OPEN_CHAT (NO PRODUZIONE) ===",
            "Obiettivo: raccogliere contesto in modo pratico e verificare coerenza col brief.",
            "Se c'è incoerenza (es. email vs post social) chiedi UNA conferma secca.",
            "Non produrre l'output finale. Concludi dicendo: 'Quando vuoi, premi Avvia Produzione.'",
          ].join("\n")
        : isProject && stage === "PRODUCTION"
        ? [
            "=== ISTRUZIONI STAGE: PRODUZIONE ===",
            "Ora devi consegnare l'output finale secondo il brief.",
            "Se mode=breve: consegna 1 versione richiesta + 1 alternativa standard.",
            "Se mancano dati critici: fai UNA domanda secca e blocca lì.",
          ].join("\n")
        : "";

    const effectivePrompt = isProject
      ? [
          "=== ANOVA — CONTESTO PROGETTO (non copiare in output) ===",
          `Intent: ${projectPacket?.intent ?? "n/a"}`,
          `Mode: ${projectPacket?.mode ?? "n/a"}`,
          `Stage: ${projectPacket?.stage ?? "n/a"}`,
          projectPacket?.briefContract ? `\n--- BRIEF CONFERMATO (CONTRATTO) ---\n${projectPacket.briefContract}` : "",
          projectPacket?.contextText ? `\n--- CONTESTO UTENTE ---\n${projectPacket.contextText}` : "",
          stageInstruction ? `\n${stageInstruction}` : "",
          "\n=== RICHIESTA UTENTE ===",
          prompt,
        ]
          .filter(Boolean)
          .join("\n")
      : prompt;

    const out = await getAIResponse(effectivePrompt, userId);
    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("[ANOVA] /api/orchestrate error:", e);
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}

// ⬆️ FINE BLOCCO 14
