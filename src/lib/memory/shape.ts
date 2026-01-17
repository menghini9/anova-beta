// ======================================================
// MEMORY — Shape + Clamps
// Path: src/lib/memory/shape.ts
// ======================================================

import type { MemoryPacketV2 } from "./types";

function isoNow() {
  return new Date().toISOString();
}

function clampArr<T>(a: T[] | undefined | null, max: number): T[] {
  const arr = Array.isArray(a) ? a : [];
  return arr.slice(0, max);
}

export function ensureMemoryPacketV2(
  raw: any,
  nextVersion: number
): MemoryPacketV2 {
  const m: MemoryPacketV2 = {
    goal: String(raw?.goal ?? "").slice(0, 200),

    facts: clampArr(raw?.facts, 8).map((x: any) => ({
      k: String(x?.k ?? "").slice(0, 80),
      v: String(x?.v ?? "").slice(0, 180),
      conf: typeof x?.conf === "number" ? x.conf : 0.9,
    })),

    decisions: clampArr(raw?.decisions, 8).map((x: any) => ({
      d: String(x?.d ?? "").slice(0, 180),
      why: String(x?.why ?? "").slice(0, 180),
      date: String(x?.date ?? "").slice(0, 20),
    })),

    constraints: clampArr(raw?.constraints, 8).map((x: any) => ({
      c: String(x?.c ?? "").slice(0, 180),
      priority: x?.priority === "P0" ? "P0" : "P1",
    })),

    open_threads: clampArr(raw?.open_threads, 5).map((x: any) => ({
      t: String(x?.t ?? "").slice(0, 180),
      owner: x?.owner === "user" ? "user" : "anova",
      status: x?.status === "blocked" ? "blocked" : "open",
    })),

    todo_next: clampArr(raw?.todo_next, 5).map((x: any) => ({
      a: String(x?.a ?? "").slice(0, 180),
      owner: x?.owner === "user" ? "user" : "anova",
    })),

    do_not_forget: clampArr(raw?.do_not_forget, 5).map((x: any) =>
      String(x ?? "").slice(0, 200)
    ),

    tone_style: raw?.tone_style ? String(raw.tone_style).slice(0, 250) : undefined,

    routing_hints: raw?.routing_hints
      ? {
          preferred_provider: raw?.routing_hints?.preferred_provider
            ? String(raw.routing_hints.preferred_provider).slice(0, 40)
            : undefined,
          avoid: Array.isArray(raw?.routing_hints?.avoid)
            ? raw.routing_hints.avoid.slice(0, 6).map((s: any) => String(s).slice(0, 40))
            : [],
          notes: raw?.routing_hints?.notes
            ? String(raw.routing_hints.notes).slice(0, 200)
            : undefined,
        }
      : undefined,

    memory_version: typeof raw?.memory_version === "number" ? raw.memory_version : nextVersion,
    updated_at: raw?.updated_at ? String(raw.updated_at) : isoNow(),
  };

  // enforce version + timestamp
  m.memory_version = nextVersion;
  m.updated_at = isoNow();

  return m;
}
