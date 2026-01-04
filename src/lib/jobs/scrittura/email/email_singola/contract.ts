// ======================================================
// EMAIL SINGOLA — CONTRACT BUILDER (UI) + KERNEL AGGREGATOR
// Path: src/lib/brief/scrittura/jobs/email_singola/contract.ts
//
// Obiettivo:
// - UI: sezioni leggibili per conferme (ContractSection[])
// - Kernel: regole PURE (no scelte) da passare al provider
// ======================================================

import type { EmailSingolaBrief3, EmailSingolaKernel3V1 } from "./brief3";
import { buildEmailSingolaKernel3V1 } from "./brief3";

// Se hai già brief1/brief2 con kernel builder, li importiamo.
// Se NON esistono ancora, il file compila lo stesso (fallback).
// ⛔ Non inventiamo: solo fallback neutri.
let buildEmailSingolaKernel1V1: ((b1: any) => any) | null = null;
let buildEmailSingolaKernel2V1: ((b2: any) => any) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m1 = require("./brief1");
  if (typeof m1.buildEmailSingolaKernel1V1 === "function") buildEmailSingolaKernel1V1 = m1.buildEmailSingolaKernel1V1;
} catch {}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m2 = require("./brief2");
  if (typeof m2.buildEmailSingolaKernel2V1 === "function") buildEmailSingolaKernel2V1 = m2.buildEmailSingolaKernel2V1;
} catch {}

/* =========================
   TIPI
========================= */
export type ContractSection = {
  title: string;
  lines: string[];
};

// Kernel aggregato (pacchetto unico per orchestratore/provider)
export type EmailSingolaKernelAllV1 = {
  kind: "email_singola_kernel_all";
  version: 1;

  round1: any; // kernel giro 1 (regole)
  round2: any; // kernel giro 2 (regole)
  round3: EmailSingolaKernel3V1; // kernel giro 3 (contesto reale)
};

/* =========================
   1) UI CONTRACT — Giro 1 + Giro 2
   - Qui mostriamo SOLO in forma umana per conferma
   - NON è il kernel
========================= */

// Helper: stampa una riga “Key: Value” se value esiste
function pushKV(lines: string[], label: string, value: any) {
  const v = String(value ?? "").trim();
  if (!v) return;
  lines.push(`${label}: ${v}`);
}

// ✅ UI: costruisce sezioni leggibili per conferme 1–2
export function buildEmailContractAll(brief1: any, brief2: any): ContractSection[] {
  const b1 = brief1 ?? {};
  const b2 = brief2 ?? {};

  const s1: ContractSection = { title: "Giro 1 — Impostazioni", lines: [] };
  // Nota: qui mettiamo “valori scelti”, non le regole. Le regole vivono nel kernel.
  pushKV(s1.lines, "Lingua", b1.lang ?? b1.lingua);
  pushKV(s1.lines, "Struttura", b1.layout ?? b1.struttura);
  pushKV(s1.lines, "Lunghezza", b1.length ?? b1.lunghezza);
  pushKV(s1.lines, "Formalità", b1.formality ?? b1.formalita);
  pushKV(s1.lines, "Energia", b1.energy ?? b1.energia);
  pushKV(s1.lines, "Relazione", b1.relationship ?? b1.relazione);
  pushKV(s1.lines, "Ruolo destinatario", b1.recipientRole ?? b1.destinatario_ruolo);
  pushKV(s1.lines, "Persona", b1.persona);
  pushKV(s1.lines, "Output", b1.output);
  pushKV(s1.lines, "Oggetto (gestione)", b1.subjectMode ?? b1.oggetto_mode);
  pushKV(s1.lines, "Saluto", b1.greetingMode ?? b1.saluto_mode);
  pushKV(s1.lines, "Chiusura", b1.closingMode ?? b1.chiusura_mode);
  pushKV(s1.lines, "Firma", b1.signatureMode ?? b1.firma_mode);
  pushKV(s1.lines, "Formattazione", b1.formatting ?? b1.formattazione);

  const s2: ContractSection = { title: "Giro 2 — Scopo e vincoli", lines: [] };
  pushKV(s2.lines, "Scopo", b2.purpose ?? b2.scopo);
  pushKV(s2.lines, "Risultato desiderato", b2.desiredOutcome ?? b2.risultato_desiderato);

  // campi testuali multi-riga (max 3 righe ecc) li mostriamo “compattati”
  const obbl = (b2.mustIncludeLines ?? b2.contenuti_obbligatori ?? [])
    .filter(Boolean)
    .slice(0, 3);
  if (obbl.length) s2.lines.push(`Contenuti obbligatori: ${obbl.join(" | ")}`);

  const al = (b2.attachmentsOrLinks ?? b2.allegati_link ?? []).filter(Boolean);
  if (al.length) s2.lines.push(`Allegati/Link: ${al.join(" | ")}`);

  pushKV(s2.lines, "Scadenza/urgenza", b2.deadlineMode ?? b2.scadenza_mode);
  pushKV(s2.lines, "Follow-up", b2.followUpMode ?? b2.followup_mode);

  const vincoli = (b2.styleConstraints ?? b2.vincoli_stile ?? []).filter(Boolean);
  if (vincoli.length) s2.lines.push(`Vincoli stile: ${vincoli.join(" | ")}`);

  // Evita sezioni vuote “imbarazzanti”
  if (s1.lines.length === 0) s1.lines.push("—");
  if (s2.lines.length === 0) s2.lines.push("—");

  return [s1, s2];
}

/* =========================
   2) UI CONTRACT — Giro 3 (sezione leggibile)
========================= */
export function buildEmailBrief3Sections(brief3: EmailSingolaBrief3): ContractSection[] {
  const b3 = brief3 ?? {};

  const cosa = String(b3.cosa ?? "").trim();
  const materiale = String(b3.materiale ?? "").trim();

  const s3: ContractSection = {
    title: "Giro 3 — Contesto reale",
    lines: [],
  };

  if (cosa) s3.lines.push(`COSA: ${cosa.replace(/\n+/g, " / ")}`);
  else s3.lines.push("COSA: —");

  if (materiale) s3.lines.push(`Materiale: ${materiale.replace(/\n+/g, " / ")}`);

  return [s3];
}

/* =========================
   3) KERNEL — pacchetto unico (regole pure)
   - Questo è quello che vuoi passare al provider.
   - Qui NON mettiamo etichette “scelte”, solo regole.
========================= */
export function buildEmailKernelAllV1(brief1: any, brief2: any, brief3: EmailSingolaBrief3): EmailSingolaKernelAllV1 {
  const r1 =
    buildEmailSingolaKernel1V1?.(brief1) ??
    {
      kind: "email_singola_round1",
      version: 1,
      rules: ["Round1 kernel non ancora collegato (placeholder)."],
      data: brief1 ?? {},
    };

  const r2 =
    buildEmailSingolaKernel2V1?.(brief2) ??
    {
      kind: "email_singola_round2",
      version: 1,
      rules: ["Round2 kernel non ancora collegato (placeholder)."],
      data: brief2 ?? {},
    };

  const r3 = buildEmailSingolaKernel3V1(brief3 ?? {});

  return {
    kind: "email_singola_kernel_all",
    version: 1,
    round1: r1,
    round2: r2,
    round3: r3,
  };
}
