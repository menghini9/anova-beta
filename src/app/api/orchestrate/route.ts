// ======================================================
// ANOVA — API ORCHESTRATE (V6 — NO LEGACY)
// Path: /src/app/api/orchestrate/route.ts
//
// Obiettivo:
// - Chat immediata (open chat) + supporto projectPacket
// - NESSUNA dipendenza da _legacy
// - ContractSections sempre disponibili (sidebar orchestratore)
// - Se mancano dati critici: max 3 domande numerate
// ======================================================

import { NextResponse } from "next/server";

// ✅ Provider diretti (stabili)
import { invokeOpenAIEconomic, invokeOpenAIBalanced } from "@/lib/providers/openai";

// -------------------------
// Tipi payload (NO legacy)
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

  // OPTIONAL: se la UI te lo passa, lo usiamo come "contratto operativo"
  thread?: {
    id?: string;
    title?: string;
    provider?: string;
    rules?: string;
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
// Contract builder (NO legacy)
// - Prima fonte: thread.rules (regole per tab)
// - Seconda fonte: brief JSON (round1/2/3) se presente
// -------------------------
function buildContractSectionsNoLegacy(args: {
  job?: string;
  stage?: string;
  threadRules?: string;
  brief1?: unknown;
  brief2?: unknown;
  brief3?: unknown;
}): ContractSection[] {
  const { job, stage, threadRules, brief1, brief2, brief3 } = args;

  const sections: ContractSection[] = [];

  const rulesClean = (threadRules ?? "").trim();
  if (rulesClean) {
    sections.push({
      title: "REGOLE (TAB)",
      lines: rulesClean
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    });
  }

  // Se esiste un brief, lo mostriamo in modo “auditabile”
  const hasBrief = Boolean(brief1 || brief2 || brief3);
  if (hasBrief) {
    sections.push({
      title: "BRIEF_JSON",
      lines: [JSON.stringify({ job, stage, brief1, brief2, brief3 }, null, 2)],
    });
  }

  if (sections.length === 0) {
    sections.push({
      title: "CONTRATTO",
      lines: ["(Nessun contratto disponibile: usa solo richiesta utente e regole di stage.)"],
    });
  }

  return sections;
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

      // ✅ compat: a volte arriva "thread" dalla chat
      thread?: { id?: string; title?: string; provider?: string; rules?: string };

      // ✅ compat: progetto/brief
      projectPacket?: ProjectPacket;
    };

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return NextResponse.json({ error: "missing_prompt" }, { status: 400 });

    const projectPacket = body.projectPacket;
    const isProject = Boolean(projectPacket?.projectId);

    const stage = String(projectPacket?.stage ?? "GENERIC");
    const job = String(projectPacket?.job ?? "n/a");

    const brief1 = projectPacket?.brief?.round1 ?? null;
    const brief2 = projectPacket?.brief?.round2 ?? null;
    const brief3 = projectPacket?.brief?.round3 ?? null;

    // regole: priorità a thread.rules (tab), poi projectPacket.thread.rules
    const threadRules =
      String(body.thread?.rules ?? "") ||
      String(projectPacket?.thread?.rules ?? "");

    // ✅ ContractSections sempre disponibili
    const contractSections = buildContractSectionsNoLegacy({
      job,
      stage,
      threadRules,
      brief1,
      brief2,
      brief3,
    });

    const contractText = contractToText(contractSections);
    const stageInstruction = isProject ? buildStageInstruction(stage) : buildStageInstruction("OPEN_CHAT");

    // ✅ Prompt completo: contratto + regole + richiesta utente
    const effectivePrompt = [
      "=== ANOVA — CONTESTO (NON COPIARE IN OUTPUT) ===",
      `SessionId: ${body.sessionId ?? "n/a"}`,
      `UserId: ${body.userId ?? "n/a"}`,
      isProject ? `ProjectId: ${projectPacket?.projectId ?? "n/a"}` : "ProjectId: n/a",
      isProject ? `Intent: ${projectPacket?.intent ?? "n/a"}` : "Intent: n/a",
      `Job: ${job}`,
      `Stage: ${stage}`,
      "",
      "--- CONTRATTO / REGOLE ---",
      contractText,
      "",
      stageInstruction,
      "",
      "=== RICHIESTA UTENTE (QUESTA È LA PARTE PIÙ IMPORTANTE) ===",
      prompt,
    ]
      .filter(Boolean)
      .join("\n");

    // ✅ Provider: in PRODUCTION usi balanced, altrimenti econ
    const out =
      isProject && stage === "PRODUCTION"
        ? await invokeOpenAIBalanced(effectivePrompt)
        : await invokeOpenAIEconomic(effectivePrompt);

    const latencyMs = out?.latencyMs ?? Date.now() - t0;

    const raw: ProviderRow[] = [
      {
        provider:
          out?.provider ??
          (isProject && stage === "PRODUCTION" ? "openai:mid" : "openai:econ"),
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
            api: "orchestrate_v6_no_legacy",
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
