// ======================================================
// MEMORY — Compress (V2)
// Path: src/lib/memory/compress.ts
// ======================================================

import type { MemoryPacketV2 } from "./types";
import { ensureMemoryPacketV2 } from "./shape";

// NB: qui NON importiamo direttamente openai/gemini/claude.
// La route ci passa un "callProvider" già pronto.

type CompressArgs = {
  existingMemory: MemoryPacketV2 | null;
  historyText: string; // ultimi turni (testo)
  userMessage: string; // ultimo input user
  nextVersion: number;
};

export async function compressToMemoryPacketV2(
  args: CompressArgs,
  callProvider: (prompt: string) => Promise<{ text: string }>
): Promise<MemoryPacketV2> {
  const { existingMemory, historyText, userMessage, nextVersion } = args;

  const prompt = `
Sei ANOVA β — modulo MEMORY COMPRESSOR (V2).
Devi produrre SOLO JSON valido (niente markdown, niente testo extra).
Obiettivo: creare uno stato minimo sufficiente (non storia).

REGOLE FERREE:
- Output: un singolo oggetto JSON.
- Niente "storia", niente esempi, niente introduzioni.
- Rispetta massimi: facts<=8, decisions<=8, constraints<=8, open_threads<=5, todo_next<=5, do_not_forget<=5.
- constraints: priority "P0" o "P1".
- memory_version: numero.
- updated_at: ISO string.

INPUT:
A) existing_memory_json:
${existingMemory ? JSON.stringify(existingMemory) : "null"}

B) history_text (può essere breve):
${historyText ? historyText.slice(0, 6000) : ""}

C) last_user_message:
${userMessage.slice(0, 2000)}

OUTPUT JSON SCHEMA:
{
  "goal": "...",
  "facts": [{"k":"", "v":"", "conf":0.9}],
  "decisions": [{"d":"", "why":"", "date":"YYYY-MM-DD"}],
  "constraints": [{"c":"", "priority":"P0"}],
  "open_threads": [{"t":"", "owner":"user|anova", "status":"open|blocked"}],
  "todo_next": [{"a":"", "owner":"user|anova"}],
  "do_not_forget": ["..."],
  "tone_style": "...",
  "routing_hints": {"preferred_provider":"", "avoid":[], "notes":""},
  "memory_version": ${nextVersion},
  "updated_at": "${new Date().toISOString()}"
}
`.trim();

  const r = await callProvider(prompt);

  // Parse robusto: cerco il primo oggetto JSON
  const rawText = (r?.text ?? "").trim();
  const json = extractFirstJsonObject(rawText);

  return ensureMemoryPacketV2(json ?? {}, nextVersion);
}

// --------------------------
// Helpers
// --------------------------
function extractFirstJsonObject(s: string): any | null {
  // trova prima "{" e ultima "}" e prova parse
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b < 0 || b <= a) return null;

  const slice = s.slice(a, b + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}
