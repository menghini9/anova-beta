// ======================================================
// API - chat-reply (KPI Contract Stable + MEMORY V2)
// Path: src/app/api/chat-reply/route.ts
// ======================================================

import { NextResponse } from "next/server";

import { openAIReply } from "@/lib/ai/openai";
import { geminiReply } from "@/lib/ai/gemini";
import { claudeReply } from "@/lib/ai/claude";

import { computeProviderCost } from "@/lib/utils/cost";

// =========================
// MEMORY V2
// =========================
import type { MemoryState, MemoryPacketV2 } from "@/lib/memory/types";
import { MEMORY_POLICY } from "@/lib/memory/policy";
import { approxTokensFromText } from "@/lib/memory/estimate";
import { compressToMemoryPacketV2 } from "@/lib/memory/compress";

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
// HELPERS - numeri sicuri
// =========================
function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
// =========================
// MEMORY - safe stringify (guard)
// evita packet enormi o JSON rotti
// =========================
function safeStringify(
  obj: any,
  maxChars: number
): { ok: boolean; text: string } {
  try {
    const text = JSON.stringify(obj);
    if (text.length > maxChars) return { ok: false, text: "" };
    return { ok: true, text };
  } catch {
    return { ok: false, text: "" };
  }
}

// =========================
// NORMALIZER - usage
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
// NORMALIZER - cost
// =========================
function normalizeCost(raw: any): CostLite {
  const total = raw?.totalCost ?? raw?.total_cost ?? raw?.eur ?? 0;

  return {
    totalCost: n(total),
    currency: "EUR",
  };
}

// =========================
// PROVIDER PICKER - robusto
// body.provider: "openai" | "gemini" | "claude"
// fallback: openai
// =========================
function pickProvider(v: any): "openai" | "gemini" | "claude" {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "gemini") return "gemini";
  if (s === "claude" || s === "anthropic") return "claude";
  return "openai";
}

// =========================
// MEMORY - default state
// =========================
function emptyMemoryState(): MemoryState {
  return {
    rawBuffer: "",
    pendingCompression: false,
    compressedMemory: null,
    memoryVersion: 0,
    approxContextTokens: 0,
  };
}



// =========================
// MEMORY - build prompt
// Regola: dopo compressione NON reinviamo history lunga.
// Il client deve inviare solo ultimi 1-2 turni in historyText.
// =========================
// ======================================================
// MEMORY - build prompt (RAW + PACKET aware)
// Regola:
// - se c'e compressedMemory -> usa SOLO quello
// - se NON c'e -> usa rawBuffer come contesto lungo
// - historyText = ultimi 1-2 turni (micro-delta)
// ======================================================
function buildAssembledPrompt(args: {
  memoryPacket: MemoryPacketV2 | null;
  rawBuffer: string;
  historyText: string;
  sharedContext: string;
  agentRules: string;
  userPrompt: string;
}): string {

const { memoryPacket, rawBuffer, historyText, sharedContext, agentRules, userPrompt } = args;

// Attenzione: qui niente pippone fisso.
// Solo un header micro (se serve) e SOLO quando sharedContext esiste.
const sc = sharedContext ? `\n${sharedContext}\n\n` : "";


// Rules: solo ruolo agente, niente "obbligo operativo"
const r = agentRules ? `\nAGENT_RULES:\n${agentRules}\n\n` : "";

const mem = memoryPacket ? `${JSON.stringify(memoryPacket)}\n\n` : "";
const raw = !memoryPacket && rawBuffer ? `${rawBuffer}\n\n` : "";
const last = historyText ? `${historyText}\n\n` : "";

return mem + raw + sc + r + last + userPrompt;
}
// ======================================================
// MEMORY - token estimate (cheap, coerente col prompt)
// ======================================================
function estimateContextTokens(args: {
  memoryPacket: MemoryPacketV2 | null;
  rawBuffer: string;
  historyText: string;
  rules: string;
  userPrompt: string;
}): number {
  const memoryHeader = args.memoryPacket
    ? `MEMORY_PACKET:\n${JSON.stringify(args.memoryPacket)}\n\n`
    : "";

  const rawHeader =
    !args.memoryPacket && args.rawBuffer
      ? `CONTEXT_LOG:\n${args.rawBuffer}\n\n`
      : "";

  return (
    approxTokensFromText(memoryHeader) +
    approxTokensFromText(rawHeader) +
    approxTokensFromText(args.historyText) +
    approxTokensFromText(args.rules) +
    approxTokensFromText(args.userPrompt)
  );
}


export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

const userPrompt = String(body?.prompt ?? "").trim();
const rules = String(body?.rules ?? "").trim();
const provider = pickProvider(body?.provider);
const sharedContext = String(body?.sharedContext ?? "").trim();

    // MEMORY inputs (retrocompatibili)
    const tabId = String(body?.tabId ?? "tab_default").trim();
    const historyText = String(body?.historyText ?? "").trim();
    const incomingMemoryState: MemoryState =
      (body?.memoryState as MemoryState) ?? emptyMemoryState();
// ======================================================
// MEMORY - EDIT input (opzionale)
// Il client puo sostituire la memoria compressa
// ======================================================
const memoryEdit = body?.memoryEdit ?? null;

    const memoryPacket = (incomingMemoryState?.compressedMemory ??
      null) as MemoryPacketV2 | null;

    if (!userPrompt) {
      return NextResponse.json(
        {
          finalText: "Prompt vuoto.",
          provider,
          model: null,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          cost: { totalCost: 0, currency: "EUR" },

          // extra safe
          tabId,
          memoryState: incomingMemoryState,
          memoryMeta: {
            approxContextTokens: incomingMemoryState?.approxContextTokens ?? 0,
            pendingCompression: Boolean(incomingMemoryState?.pendingCompression),
            memoryVersion: Number(incomingMemoryState?.memoryVersion ?? 0),
            warn: { yellow: false, red: false },
          },
        },
        { status: 400 }
      );
    }

    // ======================================================
    // A) MEMORY - triggers + compression
    // ======================================================
const approxContextTokens = estimateContextTokens({
  memoryPacket,
  rawBuffer: String(incomingMemoryState?.rawBuffer ?? ""),
  historyText,
  rules,
  userPrompt,
});
// ======================================================
// MEMORY - UI EVENT (compressione / edit)
// ======================================================
let memoryEvent:
  | {
      type: "compressed";
      reason: "SOFT" | "HARD";
      beforeTokens: number;
      afterVersion: number;
    }
  | {
      type: "edited";
      note?: string;
      afterVersion: number;
    }
  | null = null;


const nextState: MemoryState = {
  pendingCompression: Boolean(incomingMemoryState?.pendingCompression),
  compressedMemory: memoryPacket ?? null,
  memoryVersion: Number(incomingMemoryState?.memoryVersion ?? 0),
  approxContextTokens,

  // rawBuffer resta lato client, ma lo portiamo avanti nello state
  rawBuffer: String(incomingMemoryState?.rawBuffer ?? ""),
};
// ======================================================
// MEMORY - APPLY USER EDIT (replace packet)
// Nota: versione incrementata, rawBuffer svuotato
// ======================================================
if (memoryEdit?.mode === "replace_packet" && memoryEdit?.packet) {
  const check = safeStringify(memoryEdit.packet, 60_000);
  if (check.ok) {
    nextState.compressedMemory = memoryEdit.packet as MemoryPacketV2;
    nextState.rawBuffer = "";
    nextState.pendingCompression = false;
    nextState.memoryVersion = (nextState.memoryVersion ?? 0) + 1;

    memoryEvent = {
      type: "edited",
      note: String(memoryEdit?.note ?? "").trim() || undefined,
      afterVersion: nextState.memoryVersion,
    };
  }
}


    // Soft trigger: arma compressione
    if (approxContextTokens >= MEMORY_POLICY.LIMIT_TOKENS_SOFT) {
      nextState.pendingCompression = true;
    }

    // Hard trigger: comprimi subito
    const mustCompressNow =
      approxContextTokens >= MEMORY_POLICY.LIMIT_TOKENS_HARD;

    // Just-in-time: se pendingCompression true, comprimi prima di rispondere
    const shouldCompress =
      mustCompressNow || Boolean(nextState.pendingCompression);

if (shouldCompress) {
  const nextVersion = (nextState.memoryVersion ?? 0) + 1;

  const textToCompress = String(nextState.rawBuffer ?? "");

  const callProvider = async (p: string) => {
    if (provider === "gemini") {
      const r = await geminiReply({ prompt: p, rules: "OUTPUT JSON ONLY." });
      return { text: r.text };
    }
    if (provider === "claude") {
      const r = await claudeReply({ prompt: p, rules: "OUTPUT JSON ONLY." });
      return { text: r.text };
    }
    const r = await openAIReply({ prompt: p, rules: "OUTPUT JSON ONLY." });
    return { text: r.text };
  };

  try {
    const newPacket = await compressToMemoryPacketV2(
      {
        existingMemory: nextState.compressedMemory,
        historyText: textToCompress,
        userMessage: "",
        nextVersion,
      },
      callProvider
    );

    nextState.compressedMemory = newPacket;
    nextState.memoryVersion = nextVersion;
    nextState.pendingCompression = false;

    // Svuota rawBuffer: ora e tutto nel packet
    nextState.rawBuffer = "";
        // ======================================================
    // MEMORY - EVENT: compressione avvenuta
    // ======================================================
    memoryEvent = {
      type: "compressed",
      reason: mustCompressNow ? "HARD" : "SOFT",
      beforeTokens: approxContextTokens,
      afterVersion: nextState.memoryVersion,
    };

  } catch (e) {
    nextState.pendingCompression = true;
  }
}



    // ======================================================
    // B) Provider reply - usa assembledPrompt
    // ======================================================
const assembledPrompt = buildAssembledPrompt({
  memoryPacket: nextState.compressedMemory,
  rawBuffer: String(nextState?.rawBuffer ?? ""),
  historyText,
  sharedContext,
  agentRules: rules,
  userPrompt,
});


    let text = "";
    let usage: any = null;
    let model: string | null = null;

    if (provider === "gemini") {
      const r = await geminiReply({ prompt: assembledPrompt, rules });
      text = r.text;
      usage = r.usage;
      model = r.model;
    } else if (provider === "claude") {
      const r = await claudeReply({ prompt: assembledPrompt, rules });
      text = r.text;
      usage = r.usage;
      model = r.model;
    } else {
      const r = await openAIReply({ prompt: assembledPrompt, rules });
      text = r.text;
      usage = r.usage;
      model = r.model;
    }

// ======================================================
// C) Usage norm (contratto stabile)
// ======================================================
const usageNorm = normalizeUsage(usage);

// ======================================================
// D) Cost - calcolo coerente (provider-agnostic)
// computeProviderCost legge input/output/total
// ======================================================
const usageForCost = {
  input_tokens: usageNorm.prompt_tokens,
  output_tokens: usageNorm.completion_tokens,
  total_tokens: usageNorm.total_tokens,
};

const costRaw = computeProviderCost({
  provider,
  model,
  usage: usageForCost,
});

// ======================================================
// E) Cost norm (contratto stabile)
// ======================================================
const costNorm = normalizeCost(costRaw);
// ======================================================
// DEBUG - PROVIDER PACKET PREVIEW (trasparenza UI)
// ======================================================
const providerPacketPreview = {
  provider,
  model: model ?? null,
  rules,
  memoryPacket: nextState.compressedMemory,
  historyText,
  userPrompt,
};

    return NextResponse.json({
      // =========================
      // KPI CONTRACT (immutabile)
      // =========================
      finalText: text,
      provider,
      model: model ?? null,
      usage: usageNorm,
      cost: costNorm,

      // =========================
      // MEMORY V2 (extra UI-safe)
      // =========================
      tabId,
      memoryState: nextState,
      memoryMeta: {
        approxContextTokens: nextState.approxContextTokens,
        pendingCompression: nextState.pendingCompression,
        memoryVersion: nextState.memoryVersion,
        warn: {
          yellow:
            nextState.approxContextTokens >=
            MEMORY_POLICY.LIMIT_TOKENS_SOFT * MEMORY_POLICY.WARN_YELLOW_RATIO,
          red:
            nextState.approxContextTokens >=
            MEMORY_POLICY.LIMIT_TOKENS_SOFT * MEMORY_POLICY.WARN_RED_RATIO,
        },
      },
memoryEvent,
providerPacketPreview,

    });
  } catch (err: any) {
    return NextResponse.json(
      {
        finalText: "Errore API.",
        provider: "openai",
        model: null,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        cost: { totalCost: 0, currency: "EUR" },
        tabId: "tab_default",
        memoryState: emptyMemoryState(),
        memoryMeta: {
          approxContextTokens: 0,
          pendingCompression: false,
          memoryVersion: 0,
          warn: { yellow: false, red: false },
        },
        error: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
