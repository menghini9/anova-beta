// ======================================================
// ANOVA — API ORCHESTRATE (V2 CLEAN + CONTRACT)
// Path: /src/app/api/orchestrate/route.ts
// Obiettivo:
// - Sempre risposta
// - Usa CONTRATTO derivato dai brief
// - OPEN_CHAT: NO output finale, max 3 domande SOLO se mancano dati critici
// - PRODUCTION: output finale (1 + 1 alternativa), max 1 domanda se manca dato critico
// - Ritorna contractSections per sidebar orchestratore
// ======================================================

import { NextResponse } from "next/server";

// ✅ Provider diretti (stabili)
import { invokeOpenAIEconomic, invokeOpenAIBalanced } from "@/lib/providers/openai";

// ✅ Contratto (server-side) — usa la TUA struttura reale: breve/index.ts
import type { ScritturaBreveBrief1 } from "@/lib/brief/scrittura/breve/brief1";
import { buildScritturaBreveContractAll } from "@/lib/brief/scrittura/breve/brief2";


// ---------------------------
// Tipi payload in ingresso
// ---------------------------
type ProjectPacket = {
  projectId?: string;
  intent?: string;
  mode?: string; // breve | guidato | ...
  stage?: string; // OPEN_CHAT | PRODUCTION | ...
  brief?: {
    round1?: unknown;
    round2?: unknown;
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

// ---------------------------
// Contract builders
// ---------------------------
function buildContractSections(brief1: unknown, brief2: unknown): ContractSection[] {
  try {
    const sections = buildScritturaBreveContractAll(
      (brief1 ?? {}) as ScritturaBreveBrief1,
      (brief2 ?? {}) as any
    ) as any;

    return (Array.isArray(sections) ? sections : []).map((s: any) => ({
      title: String(s?.title ?? "Sezione"),
      lines: Array.isArray(s?.lines) ? s.lines.map((l: any) => String(l)) : [],
    }));
  } catch {
    return [
      {
        title: "BRIEF_JSON (fallback)",
        lines: [JSON.stringify({ brief1, brief2 }, null, 2)],
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

// ---------------------------
// Stage instruction
// ---------------------------
function buildStageInstruction(stage?: string) {
  if (stage === "OPEN_CHAT") {
    return [
      "=== STAGE: OPEN_CHAT (PRE-PRODUZIONE) ===",
      "Scopo: validare/completare il CONTRATTO. NON consegnare l'output finale.",
      "",
      "REGOLE (OBBLIGATORIE):",
      "- Il CONTRATTO è la fonte primaria: se un dato è nel contratto, NON chiederlo.",
      "- La RICHIESTA UTENTE è contesto operativo: usala per personalizzare, senza rifare recap.",
      "- Non fare recap del contratto (il contratto è mostrato in UI).",
      "- Fai AL MASSIMO 3 domande e SOLO se mancano dati DAVVERO critici per produrre bene.",
      "- Se non manca nulla: rispondi con UNA riga: '✅ Contratto completo. Pronto per PRODUCTION.'",
      "- Se noti mismatch col contratto: fai 1 domanda secca (SI/NO) e fermati.",
      "",
      "FORMATO OUTPUT:",
      "A) (Solo se necessario) Domande numerate (max 3)",
      "B) Oppure: '✅ Contratto completo. Pronto per PRODUCTION.'",
    ].join("\n");
  }

  if (stage === "PRODUCTION") {
    return [
      "=== STAGE: PRODUCTION ===",
      "Scopo: consegnare l'output finale seguendo il CONTRATTO.",
      "",
      "REGOLE (OBBLIGATORIE):",
      "- Se mode=breve: consegna 1 versione + 1 alternativa standard (subito).",
      "- NON fare domande se la risposta è nel contratto.",
      "- Se manca un dato critico: fai UNA domanda secca e fermati (niente output finché non risponde).",
    ].join("\n");
  }

  return [
    "=== STAGE: GENERIC ===",
    "Segui il contratto se presente e rispondi in modo utile.",
  ].join("\n");
}

// ---------------------------
// Prompt builder (ordine corretto)
// ---------------------------
function buildEffectivePrompt(args: {
  projectId: string;
  intent: string;
  mode: string;
  stage: string;
  contractText: string;
  stageInstruction: string;
  userPrompt: string;
}) {
  const {
    projectId,
    intent,
    mode,
    stage,
    contractText,
    stageInstruction,
    userPrompt,
  } = args;

  return [
    "=== ANOVA — CONTESTO PROGETTO (NON COPIARE IN OUTPUT) ===",
    `ProjectId: ${projectId}`,
    `Intent: ${intent}`,
    `Mode: ${mode}`,
    `Stage: ${stage}`,
    "",
    "--- CONTRATTO (DA BRIEF) ---",
    contractText,
    "",
    "=== PRIORITÀ INPUT (NON COPIARE IN OUTPUT) ===",
    "1) CONTRATTO = specifica (forma + vincoli + contenuto deciso).",
    "2) RICHIESTA UTENTE = contesto corrente: usala per personalizzare e scegliere cosa enfatizzare.",
    "3) Se la richiesta utente CONTRADDICE il contratto: 1 domanda secca di allineamento, poi stop.",
    "",
    stageInstruction,
    "",
    "=== RICHIESTA UTENTE ===",
    userPrompt,
  ].join("\n");
}

// ======================================================
// POST
// ======================================================
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
    const projectPacket = body.projectPacket;

    if (!prompt) {
      return NextResponse.json({ error: "missing_prompt" }, { status: 400 });
    }

    const isProject = Boolean(projectPacket?.projectId);
    const stage = String(projectPacket?.stage ?? "GENERIC");
    const mode = String(projectPacket?.mode ?? "n/a");

    const brief1 = projectPacket?.brief?.round1 ?? null;
    const brief2 = projectPacket?.brief?.round2 ?? null;

    const contractSections = isProject ? buildContractSections(brief1, brief2) : [];
    const contractText = isProject ? contractToText(contractSections) : "";
    const stageInstruction = isProject ? buildStageInstruction(stage) : "";

    const effectivePrompt = isProject
      ? buildEffectivePrompt({
          projectId: String(projectPacket?.projectId ?? "n/a"),
          intent: String(projectPacket?.intent ?? "n/a"),
          mode,
          stage,
          contractText,
          stageInstruction,
          userPrompt: prompt,
        })
      : prompt;

    // ✅ Provider: OPEN_CHAT economico, PRODUCTION più robusto
    const out =
      isProject && stage === "PRODUCTION"
        ? await invokeOpenAIBalanced(effectivePrompt)
        : await invokeOpenAIEconomic(effectivePrompt);

    const latencyMs = out?.latencyMs ?? Date.now() - t0;

    // ✅ ProviderId coerenti con la tua UI (openai:econ / openai:mid)
    const fallbackProvider =
      isProject && stage === "PRODUCTION" ? "openai:mid" : "openai:econ";

    const raw: ProviderRow[] = [
      {
        provider: out?.provider ?? fallbackProvider,
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
          // ✅ per sidebar orchestratore
          contract: {
            sections: contractSections,
          },
          // ✅ contesto utile (debug UI)
          context: {
            projectId: projectPacket?.projectId ?? null,
            intent: projectPacket?.intent ?? null,
            mode,
            stage,
            hasBrief: Boolean(brief1 || brief2),
            userId: body.userId ?? null,
            sessionId: body.sessionId ?? null,
          },
          stats: {
            callsThisRequest: 1,
            providersRequested: [raw[0].provider],
          },
          tags: {
            api: "orchestrate_v2_clean",
            isProject,
          },
        },
        costThisRequest: raw[0].estimatedCost ?? 0,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[ANOVA] /api/orchestrate error:", e);
    return NextResponse.json(
      { error: e?.message ?? "server_error" },
      { status: 500 }
    );
  }
}
