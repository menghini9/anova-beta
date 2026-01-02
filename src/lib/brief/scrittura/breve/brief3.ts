// ======================================================
// ANOVA — BRIEF 3 (DOMANDE APERTE)
// Path: /src/lib/brief/scrittura/breve/brief3.ts
//
// Scopo:
// - Giro 3: chi / cosa / come / perché (testo libero)
// - Fornisce: defaults, questions, validate
// - Coerente con brief1.ts (stesso pattern di export)
// ======================================================

export type ScritturaBreveBrief3 = {
  chi: string;
  cosa: string;
  come: string;
  perche: string;
};

// =========================
// Defaults
// =========================
export const SCRITTURA_BREVE_BRIEF3_DEFAULTS: ScritturaBreveBrief3 = {
  chi: "",
  cosa: "",
  come: "",
  perche: "",
};

// =========================
// Questions (UI schema)
// =========================
export type Brief3Question = {
  id: keyof ScritturaBreveBrief3;
  label: string;
  placeholder?: string;
  required?: boolean;
  maxLen?: number;
  rows?: number;
};

export const SCRITTURA_BREVE_BRIEF3_QUESTIONS: Brief3Question[] = [
  {
    id: "chi",
    label: "Chi",
    placeholder:
      "Chi parla e a chi è rivolto? (ruolo/azienda/target, contesto, eventuale brand/voce)",
    required: true,
    maxLen: 1500,
    rows: 4,
  },
  {
    id: "cosa",
    label: "Cosa",
    placeholder:
      "Cosa vuoi ottenere esattamente? (tipo di contenuto, elementi da includere, deliverable)",
    required: true,
    maxLen: 2000,
    rows: 4,
  },
  {
    id: "come",
    label: "Come",
    placeholder:
      "Come deve essere fatto? (tono, stile, vincoli, esempi, parole da usare/evitare, struttura)",
    required: true,
    maxLen: 2500,
    rows: 5,
  },
  {
    id: "perche",
    label: "Perché",
    placeholder:
      "Perché lo stai facendo? (obiettivo business, motivazione, KPI/risultato atteso)",
    required: true,
    maxLen: 1500,
    rows: 4,
  },
];

// =========================
// Validator
// =========================
function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function validateBrief3(input: Partial<ScritturaBreveBrief3>): string[] {
  const errors: string[] = [];

  for (const q of SCRITTURA_BREVE_BRIEF3_QUESTIONS) {
    if (!q.required) continue;
    const v = clean((input as any)[q.id]);
    if (!v) errors.push(`Compila: ${q.label}`);
  }

  return errors;
}
// =========================
// Contract section builder (per /api/orchestrate sidebar + prompt)
// =========================
export type ContractSection = { title: string; lines: string[] };

function cleanForContract(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export function buildScritturaBreveBrief3Sections(
  brief3: ScritturaBreveBrief3 | null | undefined
): ContractSection[] {
  const chi = cleanForContract(brief3?.chi);
  const cosa = cleanForContract(brief3?.cosa);
  const come = cleanForContract(brief3?.come);
  const perche = cleanForContract(brief3?.perche);

  if (!chi && !cosa && !come && !perche) return [];

  return [
    {
      title: "Brief — Giro 3",
      lines: [
        chi ? `Chi: ${chi}` : null,
        cosa ? `Cosa: ${cosa}` : null,
        come ? `Come: ${come}` : null,
        perche ? `Perché: ${perche}` : null,
      ].filter(Boolean) as string[],
    },
  ];
}
