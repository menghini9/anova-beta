// ======================================================
// EMAIL SINGOLA — BRIEF 3 (Giro 3) + Kernel Translator
// Path: src/lib/brief/scrittura/jobs/email/email_singola/brief3.ts
// Note:
// - "COSA" è la fonte primaria del contesto (verità operativa).
// - Materiale incollato: utile ma riformulare, no copia-incolla lungo.
// - Se contraddizione: vince COSA; chiedi 1 chiarimento solo se serve.
// ======================================================

// =========================
// 1) MODELLO BRIEF3 (salvato su Firestore in brief.round3)
// =========================
export type EmailSingolaBrief3 = {
  // 1) CONTESTO REALE — COSA (2–8 righe)
  cosa?: string;

  // 2) Materiale da includere (opzionale)
  materiale?: string;
};

// =========================
// 2) DEFAULTS (sistema)
// =========================
export const EMAIL_SINGOLA_BRIEF3_DEFAULT: Required<Pick<EmailSingolaBrief3, "cosa" | "materiale">> = {
  cosa: "",
  materiale: "",
};

// =========================
// 3) HELPERS
// =========================
function splitLines(s?: string): string[] {
  return (s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function clampRange(arr: string[], min: number, max: number): { ok: boolean; clamped: string[] } {
  const clamped = arr.slice(0, max);
  return { ok: arr.length >= min && arr.length <= max, clamped };
}

// euristica base “troppo vago” (non è una verità matematica, è un guardrail)
function isTooVague(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (t.length < 40) return true; // poche info
  // frasi vaghe tipiche
  const vagueHints = ["scrivi una mail", "mi serve una mail", "fammi una mail", "spiega bene", "gentile", "professionale"];
  const hits = vagueHints.filter((h) => t.includes(h)).length;
  return hits >= 2 && t.length < 120;
}

// =========================
// 4) VALIDAZIONE MINIMA
// =========================
export function validateEmailSingolaBrief3(b: EmailSingolaBrief3) {
  const errors: string[] = [];

  const cosaLines = splitLines(b.cosa);
  const range = clampRange(cosaLines, 2, 8);

  if (cosaLines.length === 0) errors.push("COSA obbligatorio (2–8 righe).");
  if (cosaLines.length > 0 && !range.ok) errors.push("COSA: inserisci tra 2 e 8 righe (max 8).");

  return { ok: errors.length === 0, errors };
}

// =========================
// 5) KERNEL (solo regole operative da passare al provider)
// =========================
export type EmailSingolaKernel3V1 = {
  kind: "email_singola_round3";
  version: 1;

  // Contesto primario (COSA)
  primaryContext: {
    cosa: string;        // testo originale (multi-line)
    cosaLines: string[]; // lines clamped max 8 (comodo per controllo qualità)
    rules: string[];
    tooVagueHeuristic: boolean; // hint per orchestratore (non per provider)
  };

  // Materiale (supporto)
  includedMaterial: {
    materiale: string;        // testo originale (multi-line)
    materialeLines: string[]; // lines, senza clamp (può essere lungo)
    rules: string[];
  };

  // Regole di risoluzione conflitti
  conflictResolution: {
    rules: string[];
  };
};

// =========================
// 6) TRADUTTORE: Brief3 -> Kernel
// =========================
export function buildEmailSingolaKernel3V1(input: EmailSingolaBrief3): EmailSingolaKernel3V1 {
  const b: EmailSingolaBrief3 = { ...EMAIL_SINGOLA_BRIEF3_DEFAULT, ...input };

  const cosaLinesRaw = splitLines(b.cosa);
  const cosaLines = cosaLinesRaw.slice(0, 8); // clamp per regola 2–8
  const cosaText = cosaLines.join("\n");

  const materialeText = (b.materiale || "").trim();
  const materialeLines = splitLines(materialeText);

  const primaryRules = [
    "Il campo COSA è la fonte primaria del contesto: usa ciò che c’è scritto lì come verità operativa.",
    "Non inventare nomi, date, numeri, eventi o motivazioni non presenti nel COSA.",
    "Se il COSA è troppo vago per scrivere un’email sensata: fai al massimo 1 domanda per chiarire (conteggia nelle max 3 domande).",
  ];

  const materialRules = [
    "Se l’utente incolla materiale, riutilizza i dettagli utili ma riformula: non copiare blocchi lunghi verbatim.",
    "Mantieni nomi/numeri/date ESATTAMENTE come sono nel materiale (non correggere e non reinterpretare).",
  ];

  const conflictRules = [
    "Se il materiale incollato contraddice il COSA: dai precedenza al COSA.",
    "In caso di contraddizione, chiedi 1 chiarimento solo se serve per evitare un output sbagliato.",
  ];

  return {
    kind: "email_singola_round3",
    version: 1,

    primaryContext: {
      cosa: cosaText,
      cosaLines,
      rules: primaryRules,
      tooVagueHeuristic: isTooVague(cosaText),
    },

    includedMaterial: {
      materiale: materialeText,
      materialeLines,
      rules: materialRules,
    },

    conflictResolution: {
      rules: conflictRules,
    },
  };
}
// =========================
// 7) UI SECTIONS (per CONFIRM_3 / sidebar)
// =========================
export type ContractSection = { title: string; lines: string[] };

export function buildEmailBrief3Sections(b3: EmailSingolaBrief3): ContractSection[] {
  const b: EmailSingolaBrief3 = { ...EMAIL_SINGOLA_BRIEF3_DEFAULT, ...b3 };

  const cosaLines = splitLines(b.cosa).slice(0, 8);
  const materialeLines = splitLines(b.materiale);

  const out: ContractSection[] = [];

  out.push({
    title: "Giro 3 — Contesto reale (COSA)",
    lines: [
      cosaLines.length ? cosaLines.join(" | ") : "(non fornito)",
      "Regola: COSA è la fonte primaria del contesto (verità operativa).",
      "Regola: se COSA è troppo vago → 1 domanda max (dentro le 3 totali).",
    ],
  });

  if (materialeLines.length) {
    out.push({
      title: "Giro 3 — Materiale da includere",
      lines: [
        `Materiale presente: ${materialeLines.length} righe`,
        "Regola: riutilizza dettagli utili ma riformula (no copia lunga).",
        "Regola: nomi/numeri/date ESATTI come nel materiale.",
      ],
    });
  } else {
    out.push({
      title: "Giro 3 — Materiale da includere",
      lines: ["(nessun materiale incollato)"],
    });
  }

  return out;
}
