// ======================================================
// BRIEF 1 — SCRITTURA / PROGETTO BREVE
// Path: /src/lib/brief/scrittura/breve/brief1.ts
// ======================================================

export type Brief1_Q1_Testo =
  | "email"
  | "messaggio"
  | "post_social"
  | "descrizione_prodotto"
  | "pagina_sito"
  | "comunicazione_interna"
  | "altro";

export type Brief1_Q2_Destinatario =
  | "cliente"
  | "fornitore"
  | "pubblico"
  | "collega"
  | "capo"
  | "amico"
  | "partner"
  | "HR"
  | "istituzione"
  | "azienda"
  | "altro";

export type Brief1_Q3_Obiettivo =
  | "informare"
  | "convincere"
  | "vendere"
  | "chiedere"
  | "scusarsi"
  | "aggiornare"
  | "altro";

export type Brief1_Q4_Tono =
  | "formale"
  | "neutro"
  | "amichevole"
  | "deciso"
  | "premium"
  | "ironico";

export type Brief1_Q5_Lunghezza = "corta" | "standard" | "lunga";

export type ScritturaBreveBrief1 = {
  Q1: Brief1_Q1_Testo;
  Q2: Brief1_Q2_Destinatario;
  Q3: Brief1_Q3_Obiettivo;
  Q4: Brief1_Q4_Tono;
  Q5: Brief1_Q5_Lunghezza;
  Q6?: string; // vincolo speciale (opzionale)
};

export type BriefQuestion<T extends string> = {
  id: string;
  label: string;
  required: boolean;
  type: "select" | "text";
  options?: { value: T; label: string }[];
  placeholder?: string;
  defaultValue?: string;
  maxLen?: number;
};

export const SCRITTURA_BREVE_BRIEF1_DEFAULTS: ScritturaBreveBrief1 = {
  Q1: "altro",
  Q2: "altro",
  Q3: "informare",
  Q4: "neutro",
  Q5: "standard",
  Q6: "",
};

export const SCRITTURA_BREVE_BRIEF1_QUESTIONS: BriefQuestion<any>[] = [
  {
    id: "Q1",
    label: "Che testo stai creando?",
    required: true,
    type: "select",
    options: [
      { value: "email", label: "Email" },
      { value: "messaggio", label: "Messaggio" },
      { value: "post_social", label: "Post social" },
      { value: "descrizione_prodotto", label: "Descrizione prodotto" },
      { value: "pagina_sito", label: "Pagina sito" },
      { value: "comunicazione_interna", label: "Comunicazione interna" },
      { value: "altro", label: "Altro" },
    ],
  },
  {
    id: "Q2",
    label: "A chi è destinato?",
    required: true,
    type: "select",
    options: [
      { value: "cliente", label: "Cliente" },
      { value: "fornitore", label: "Fornitore" },
      { value: "pubblico", label: "Pubblico" },
      { value: "collega", label: "Collega" },
      { value: "capo", label: "Capo" },
      { value: "amico", label: "Amico" },
      { value: "partner", label: "Partner" },
      { value: "HR", label: "HR" },
      { value: "istituzione", label: "Istituzione" },
      { value: "azienda", label: "Azienda" },
      { value: "altro", label: "Altro" },
    ],
  },
  {
    id: "Q3",
    label: "Obiettivo del testo (1 scelta)",
    required: true,
    type: "select",
    options: [
      { value: "informare", label: "Informare" },
      { value: "convincere", label: "Convincere" },
      { value: "vendere", label: "Vendere" },
      { value: "chiedere", label: "Chiedere" },
      { value: "scusarsi", label: "Scusarsi" },
      { value: "aggiornare", label: "Aggiornare" },
      { value: "altro", label: "Altro" },
    ],
  },
  {
    id: "Q4",
    label: "Tono",
    required: true,
    type: "select",
    options: [
      { value: "formale", label: "Formale" },
      { value: "neutro", label: "Neutro" },
      { value: "amichevole", label: "Amichevole" },
      { value: "deciso", label: "Deciso" },
      { value: "premium", label: "Premium" },
      { value: "ironico", label: "Ironico" },
    ],
  },
  {
    id: "Q5",
    label: "Lunghezza",
    required: true,
    type: "select",
    options: [
      { value: "corta", label: "Corta" },
      { value: "standard", label: "Standard" },
      { value: "lunga", label: "Lunga" },
    ],
  },
  {
    id: "Q6",
    label: "Vincolo speciale (opzionale, 1 riga)",
    required: false,
    type: "text",
    placeholder:
      'Esempio: "no emoji", "max 120 parole", "in italiano semplice", "con call-to-action"',
    maxLen: 180,
  },
];

// Mini-check (solo per email / ufficiale)
export function getMiniCheck(brief: ScritturaBreveBrief1): string[] {
  const isEmail = brief.Q1 === "email";
  const officialTargets: Brief1_Q2_Destinatario[] = [
    "azienda",
    "istituzione",
    "HR",
    "capo",
    "fornitore",
  ];
  const isOfficial = officialTargets.includes(brief.Q2);

  if (!isEmail || !isOfficial) return [];
  return [
    "Controlla nomi, date, link/allegati e riferimenti (zero errori banali).",
    "Tono coerente + richiesta/azione chiara (cosa vuoi che faccia il destinatario).",
  ];
}

export function validateBrief1(brief: ScritturaBreveBrief1): string[] {
  const errors: string[] = [];
  if (!brief.Q1) errors.push("Q1 mancante");
  if (!brief.Q2) errors.push("Q2 mancante");
  if (!brief.Q3) errors.push("Q3 mancante");
  if (!brief.Q4) errors.push("Q4 mancante");
  if (!brief.Q5) errors.push("Q5 mancante");
  // Q6 opzionale
  return errors;
}
