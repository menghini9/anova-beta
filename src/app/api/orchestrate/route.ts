// ⬇️ BLOCCO 14 — /src/app/api/orchestrate/route.ts
// ANOVA_ORCHESTRATOR_V45 — Stage-aware + Server Coherence Gate (NO-AI)

import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/orchestrator";

// ✅ Brief tools (NO-AI)
import { checkScritturaBreveCoherence } from "@/lib/brief/scrittura/breve/brief2";
import { buildScritturaBreveContractAll } from "@/lib/brief/scrittura/breve/brief2";
import type { ScritturaBreveBrief1 } from "@/lib/brief/scrittura/breve/brief1";

type ProjectBriefPacket = {
  round1?: any; // ScritturaBreveBrief1 (quando intent=scrittura, mode=breve)
  round2?: any; // modulo brief2 (dipende da Q1)
};

type ProjectPacket = {
  projectId?: string;
  intent?: string;
  mode?: string; // breve | guidato
  stage?: string; // OPEN_CHAT | PRODUCTION | ...
  briefContract?: string; // opzionale (se lo mandi già pronto)
  contextText?: string; // opzionale
  brief?: ProjectBriefPacket; // ✅ nuovo: dati round1/round2
};

// ======================================================
// Helpers — Response Standard (per stop senza provider)
// ======================================================
function blockedResponse(args: {
  reason: string;
  verdict: "HARD_MISMATCH" | "SOFT_MISMATCH";
  stage?: string;
}) {
  return {
    fusion: {
      finalText:
        `⚠️ Coerenza brief: ${args.reason}\n` +
        `Vai in WORK → “Modifica brief” e allinea il brief prima di continuare.`,
    },
    meta: {
      blocked: true,
      blockedReason: "COHERENCE_MISMATCH",
      stage: args.stage ?? "n/a",
      coherence: { verdict: args.verdict, reason: args.reason },
    },
    raw: [],
    costThisRequest: 0,
  };
}

function normalizeStage(stage?: string) {
  if (!stage) return "";
  return String(stage).toUpperCase();
}

// ======================================================
// POST
// ======================================================
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
    const stage = normalizeStage(projectPacket?.stage);

    // ======================================================
    // 1) SERVER COHERENCE GATE (NO-AI) — Solo Scrittura/Breve
    // ======================================================
    if (isProject && projectPacket?.intent === "scrittura" && projectPacket?.mode === "breve") {
      const b1 = (projectPacket?.brief?.round1 ?? null) as ScritturaBreveBrief1 | null;
      const b2 = projectPacket?.brief?.round2 ?? {};

      // se manca round1 in PRODUCTION → blocco hard (sennò produci roba a caso)
      if (!b1) {
        if (stage === "PRODUCTION") {
          return NextResponse.json(
            blockedResponse({
              verdict: "HARD_MISMATCH",
              reason: "brief mancante (round1).",
              stage,
            }),
            { status: 200 }
          );
        }
        // in OPEN_CHAT: non blocco, ma segnalo sotto in meta (solo warning)
      } else {
        const res = checkScritturaBreveCoherence({
          brief1: b1 as any,
          brief2: b2 as any,
          userText: prompt,
        });

        // HARD → stop sempre
        if (res.verdict === "HARD_MISMATCH") {
          return NextResponse.json(
            blockedResponse({ verdict: "HARD_MISMATCH", reason: res.reason, stage }),
            { status: 200 }
          );
        }

        // SOFT → stop solo in PRODUCTION
        if (res.verdict === "SOFT_MISMATCH" && stage === "PRODUCTION") {
          return NextResponse.json(
            blockedResponse({ verdict: "SOFT_MISMATCH", reason: res.reason, stage }),
            { status: 200 }
          );
        }

        // se SOFT e OPEN_CHAT → non blocco, ma lo aggiungo al body per meta debug
        if (res.verdict === "SOFT_MISMATCH") {
          (body as any).__coherenceWarning = res.reason;
        }
      }
    }

    // ======================================================
    // 2) STAGE INSTRUCTIONS (come prima, ma più “tight”)
    // ======================================================
    const stageInstruction =
      isProject && stage === "OPEN_CHAT"
        ? [
            "=== ISTRUZIONI STAGE: OPEN_CHAT (NO PRODUZIONE) ===",
            "Obiettivo: raccogliere contesto in modo pratico e verificare coerenza col brief.",
            "Se c'è incoerenza col brief: chiedi UNA conferma secca (sì/no) su cosa produrre.",
            "Non produrre l'output finale.",
            "Concludi SEMPRE con: 'Quando vuoi, premi Avvia Produzione.'",
          ].join("\n")
        : isProject && stage === "PRODUCTION"
        ? [
            "=== ISTRUZIONI STAGE: PRODUZIONE ===",
            "Ora devi consegnare l'output finale secondo il brief.",
            "Se mode=breve: consegna 1 versione richiesta + 1 alternativa standard.",
            "Se mancano dati critici: fai UNA domanda secca e fermati lì.",
          ].join("\n")
        : "";

    // ======================================================
    // 3) BRIEF CONTRACT (se non lo mandi, provo a costruirlo)
    // ======================================================
    let briefContract = projectPacket?.briefContract ?? "";

    if (
      isProject &&
      projectPacket?.intent === "scrittura" &&
      projectPacket?.mode === "breve" &&
      !briefContract
    ) {
      const b1 = (projectPacket?.brief?.round1 ?? null) as ScritturaBreveBrief1 | null;
      const b2 = projectPacket?.brief?.round2 ?? {};
      if (b1) {
        // lo trasformo in “contratto” testuale breve
        const sections = buildScritturaBreveContractAll(b1, b2);
        briefContract = sections
          .map((s) => `# ${s.title}\n- ${s.lines.join("\n- ")}`)
          .join("\n\n");
      }
    }

    // ======================================================
    // 4) EFFECTIVE PROMPT (contesto progetto + brief + stage)
    // ======================================================
    const effectivePrompt = isProject
      ? [
          "=== ANOVA — CONTESTO PROGETTO (non copiare in output) ===",
          `ProjectId: ${projectPacket?.projectId ?? "n/a"}`,
          `Intent: ${projectPacket?.intent ?? "n/a"}`,
          `Mode: ${projectPacket?.mode ?? "n/a"}`,
          `Stage: ${stage || "n/a"}`,
          briefContract ? `\n--- BRIEF CONFERMATO (CONTRATTO) ---\n${briefContract}` : "",
          projectPacket?.contextText ? `\n--- CONTESTO UTENTE ---\n${projectPacket.contextText}` : "",
          stageInstruction ? `\n${stageInstruction}` : "",
          "\n=== RICHIESTA UTENTE ===",
          prompt,
        ]
          .filter(Boolean)
          .join("\n")
      : prompt;

    // ======================================================
    // 5) CALL ORCHESTRATOR / PROVIDER
    // ======================================================
    const out = await getAIResponse(effectivePrompt, userId);

    // ======================================================
    // 6) Inject meta warning (SOFT mismatch in OPEN_CHAT)
    // ======================================================
    if ((body as any).__coherenceWarning) {
      const reason = String((body as any).__coherenceWarning);
      (out as any).meta = (out as any).meta ?? {};
      (out as any).meta.coherence = { verdict: "SOFT_MISMATCH", reason };
    }

    // (opzionale) meta minima progetto
    if (isProject) {
      (out as any).meta = (out as any).meta ?? {};
      (out as any).meta.project = {
        projectId: projectPacket?.projectId ?? null,
        intent: projectPacket?.intent ?? null,
        mode: projectPacket?.mode ?? null,
        stage: stage ?? null,
      };
    }

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    console.error("[ANOVA] /api/orchestrate error:", e);
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}

// ⬆️ FINE BLOCCO 14
