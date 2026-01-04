// ======================================================
// ANOVA — API ORCHESTRATE (V5 — SIMPLE + CONTRACT + JOB)
// Path: /src/app/api/orchestrate/route.ts
//
// Obiettivo:
// - L’utente scrive -> AI risponde subito.
// - Usa il CONTRATTO derivato dai brief (1, 2, 3).
// - Max 3 domande SOLO se mancano dati critici.
// - Mai: recap contratto / “Contratto completo…” / “Avvia Produzione”.
// - Ritorna anche contractSections per sidebar orchestratore.
// ======================================================

import { NextResponse } from "next/server";

// ✅ Provider diretti (stabili)
import { invokeOpenAIEconomic, invokeOpenAIBalanced } from "@/lib/providers/openai";

// ✅ EMAIL SINGOLA — tipi + builders
import type { EmailSingolaBrief1 } from "@/lib/jobs/scrittura/email/email_singola/brief1";
import type { EmailSingolaBrief2 } from "@/lib/jobs/scrittura/email/email_singola/brief2";
import type { EmailSingolaBrief3 } from "@/lib/jobs/scrittura/email/email_singola/brief3";

import { buildEmailContractAll } from "@/lib/jobs/scrittura/email/email_singola/contract";
import { buildEmailBrief3Sections } from "@/lib/jobs/scrittura/email/email_singola/brief3";

// -------------------------
// Tipi payload
// -------------------------
type ProjectPacket = {
  projectId?: string;
  intent?: string;
  job?: string; // es: "email_singola"
  stage?: string; // OPEN_CHAT | PRODUCTION | ...
  brief?: {
    round1?: unknown;
    round2?: unknown;
    round3?: unknown;
  };
};

type ContractSection = { title: string; lines: string[] };

type ProviderRow = {
  provider: string;
  text: string;
  success: boolean;
  error?: string;
  latencyMs: number;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCost?: number;
};

// -------------------------
// Contract builder (UI + Prompt)
// -------------------------
function buildContractSections(brief1: unknown, brief2: unknown, brief3: unknown): ContractSection[] {
  try {
    const base = buildEmailContractAll(
      (brief1 ?? {}) as EmailSingolaBrief1,
      (brief2 ?? {}) as EmailSingolaBrief2
    );

    const baseSections: ContractSection[] = (Array.isArray(base) ? base : []).map((s: any) => ({
      title: String(s?.title ?? "Sezione"),
      lines: Array.isArray(s?.lines) ? s.lines.map((l: any) => String(l)) : [],
    }));

    const extra3 = buildEmailBrief3Sections((brief3 ?? {}) as EmailSingolaBrief3);

    return [...baseSections, ...extra3];
  } catch {
    return [
      {
        title: "BRIEF_JSON (fallback)",
        lines: [JSON.stringify({ brief1, brief2, brief3 }, null, 2)],
      },
    ];
  }
}

function contractToText(sections: ContractSection[]): string {
  return sections
    .map((s) => {
      const lines = (s.lines ?? []).map((l) => `- ${l}`).join("\n");
      return `# ${s.title}\n${lines}`;
    })
    .join("\n\n");
}

// -------------------------
// Stage instruction (SIMPLE)
// -------------------------
function buildStageInstruction(stage?: string) {
  return [
    "=== REGOLE ANOVA (OBBLIGATORIE) ===",
    "1) La RICHIESTA UTENTE è la priorità: usa parole e dettagli del prompt.",
    "2) Il CONTRATTO è vincolante: se un dato è nel contratto, NON chiederlo.",
    "3) Se mancano dati davvero critici per eseguire: fai domande numerate (max 3) e fermati.",
    "4) Se NON mancano dati critici: produci direttamente l’output richiesto.",
    "5) VIETATO: recap del contratto, '✅ Contratto completo', 'Avvia Produzione', o frasi da procedura.",
    "6) Mantieni la risposta concreta e collegata al testo utente (cita 1–2 dettagli reali del prompt).",
    "",
    `Stage (solo contesto interno): ${stage ?? "n/a"}`,
  ].join("\n");
}

export async function POST(req: Request) {
  const t0 = Date.now();

  try {
    const body = (await req.json()) as {
      prompt?: unknown;
      userId?: string;
      sessionId?: string;
      projectPacket?: ProjectPacket;
    };

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "missing_prompt" }, { status: 400 });
    }

    const projectPacket = body.projectPacket;
    const isProject = Boolean(projectPacket?.projectId);

    const stage = String(projectPacket?.stage ?? "GENERIC");
    const job = String(projectPacket?.job ?? "n/a");

    const brief1 = projectPacket?.brief?.round1 ?? null;
    const brief2 = projectPacket?.brief?.round2 ?? null;
    const brief3 = projectPacket?.brief?.round3 ?? null;

    // ✅ Contratto: oggi supportiamo email_singola (gli altri job in futuro)
    const canBuildContract = isProject && job === "email_singola";

    const contractSections = canBuildContract ? buildContractSections(brief1, brief2, brief3) : [];
    const contractText = canBuildContract ? contractToText(contractSections) : "";
    const stageInstruction = isProject ? buildStageInstruction(stage) : "";

    // ✅ Prompt completo: contratto + regole + richiesta utente
    const effectivePrompt = isProject
      ? [
          "=== ANOVA — CONTESTO PROGETTO (NON COPIARE IN OUTPUT) ===",
          `ProjectId: ${projectPacket?.projectId ?? "n/a"}`,
          `Intent: ${projectPacket?.intent ?? "n/a"}`,
          `Job: ${job}`,
          `Stage: ${stage}`,
          "",
          canBuildContract ? "--- CONTRATTO (DA BRIEF) ---" : "--- CONTRATTO ---",
          canBuildContract ? contractText : "(Contratto non disponibile per questo job, usa solo richiesta utente.)",
          "",
          stageInstruction,
          "",
          "=== RICHIESTA UTENTE (QUESTA È LA PARTE PIÙ IMPORTANTE) ===",
          prompt,
        ]
          .filter(Boolean)
          .join("\n")
      : prompt;

    // ✅ Provider: in PRODUCTION usi balanced, altrimenti econ
    const out =
      isProject && stage === "PRODUCTION"
        ? await invokeOpenAIBalanced(effectivePrompt)
        : await invokeOpenAIEconomic(effectivePrompt);

    const latencyMs = out?.latencyMs ?? Date.now() - t0;

    const raw: ProviderRow[] = [
      {
        provider:
          out?.provider ?? (isProject && stage === "PRODUCTION" ? "openai:mid" : "openai:econ"),
        text: out?.text ?? "",
        success: out?.success ?? true,
        error: out?.error,
        latencyMs,
        tokensUsed: out?.tokensUsed ?? 0,
        promptTokens: out?.promptTokens ?? 0,
        completionTokens: out?.completionTokens ?? 0,
        estimatedCost: out?.estimatedCost ?? 0,
      },
    ];

    return NextResponse.json(
      {
        fusion: {
          finalText: raw[0].text?.trim() ? raw[0].text : "⚠️ Risposta vuota dal provider.",
          fusionScore: 1,
          used: [raw[0].provider],
        },
        raw,
        meta: {
          contract: {
            sections: contractSections, // ✅ sidebar orchestratore
          },
          context: {
            projectId: projectPacket?.projectId ?? null,
            intent: projectPacket?.intent ?? null,
            job,
            stage,
            hasBrief: Boolean(brief1 || brief2 || brief3),
            userId: body.userId ?? null,
            sessionId: body.sessionId ?? null,
          },
          stats: {
            callsThisRequest: 1,
            providersRequested: [raw[0].provider],
          },
          tags: {
            api: "orchestrate_v5_contract_job",
            isProject,
          },
        },
        costThisRequest: raw[0].estimatedCost ?? 0,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[ANOVA] /api/orchestrate error:", e);
    return NextResponse.json({ error: e?.message ?? "server_error" }, { status: 500 });
  }
}
