// ======================================================
// BRIEF 2 — SCRITTURA / PROGETTO BREVE — ALTRO (Fallback intelligente)
// Path: /src/lib/brief/scrittura/breve/brief2/altro.ts
// ======================================================

import type { BriefQuestion } from "../brief1";

// =========================
// 1) TIPI
// =========================

export type Brief2_Altro_Uso = "pubblico" | "privato" | "aziendale";

export type Brief2_Altro_Obiettivo =
  | "informare"
  | "convincere"
  | "vendere"
  | "chiedere"
  | "organizzare";

export type Brief2_Altro_Destinatario = "singolo" | "gruppo" | "pubblico_generico";

export type Brief2_Altro_Contesto = "nuovo" | "follow_up" | "risposta";

export type Brief2_Altro_DatiDisponibili =
  | "nessuno"
  | "punti_elenco"
  | "testo_grezzo"
  | "file";

export type Brief2_Altro_ElementiObbligatori =
  | "date"
  | "prezzi"
  | "link"
  | "nomi"
  | "contatti";

export type Brief2_Altro_Rischio = "basso" | "medio" | "alto";

export type ScritturaBreveBrief2_Altro = {
  Q1_uso: Brief2_Altro_Uso;
  Q2_obiettivo: Brief2_Altro_Obiettivo;
  Q3_destinatario: Brief2_Altro_Destinatario;
  Q4_contesto: Brief2_Altro_Contesto;
  Q5_datiDisponibili: Brief2_Altro_DatiDisponibili;
  Q6_elementiObbligatori: Brief2_Altro_ElementiObbligatori[]; // multi-scelta
  Q7_rischio: Brief2_Altro_Rischio;
};

// =========================
// 2) DEFAULTS (fallback “chiude sempre”)
// =========================
//
// Filosofia:
// - default prudente (niente promesse, privacy ok)
// - default pratico (se non sai, scegli "organizzare" + "privato" + "singolo")
//
export const SCRITTURA_BREVE_BRIEF2_ALTRO_DEFAULTS: ScritturaBreveBrief2_Altro =
  {
    Q1_uso: "privato",
    Q2_obiettivo: "organizzare",
    Q3_destinatario: "singolo",
    Q4_contesto: "nuovo",
    Q5_datiDisponibili: "punti_elenco",
    Q6_elementiObbligatori: [],
    Q7_rischio: "medio",
  };

// =========================
// 3) DOMANDE (QUESTIONS)
// =========================

export const SCRITTURA_BREVE_BRIEF2_ALTRO_QUESTIONS: BriefQuestion<any>[] = [
  {
    id: "Q1_uso",
    label: "Uso",
    required: true,
    type: "select",
    options: [
      { value: "pubblico", label: "Pubblico" },
      { value: "privato", label: "Privato" },
      { value: "aziendale", label: "Aziendale" },
    ],
  },
  {
    id: "Q2_obiettivo",
    label: "Obiettivo",
    required: true,
    type: "select",
    options: [
      { value: "informare", label: "Informare" },
      { value: "convincere", label: "Convincere" },
      { value: "vendere", label: "Vendere" },
      { value: "chiedere", label: "Chiedere" },
      { value: "organizzare", label: "Organizzare" },
    ],
  },
  {
    id: "Q3_destinatario",
    label: "Destinatario",
    required: true,
    type: "select",
    options: [
      { value: "singolo", label: "Singolo" },
      { value: "gruppo", label: "Gruppo" },
      { value: "pubblico_generico", label: "Pubblico generico" },
    ],
  },
  {
    id: "Q4_contesto",
    label: "Contesto",
    required: true,
    type: "select",
    options: [
      { value: "nuovo", label: "Nuovo" },
      { value: "follow_up", label: "Follow-up" },
      { value: "risposta", label: "Risposta" },
    ],
  },
  {
    id: "Q5_datiDisponibili",
    label: "Dati disponibili",
    required: true,
    type: "select",
    options: [
      { value: "nessuno", label: "Nessuno" },
      { value: "punti_elenco", label: "Punti elenco" },
      { value: "testo_grezzo", label: "Testo grezzo" },
      { value: "file", label: "File" },
    ],
  },
  {
    id: "Q6_elementiObbligatori",
    label: "Elementi obbligatori (multi-scelta)",
    required: false,
    type: "select",
    options: [
      { value: "date", label: "Date" },
      { value: "prezzi", label: "Prezzi" },
      { value: "link", label: "Link" },
      { value: "nomi", label: "Nomi" },
      { value: "contatti", label: "Contatti" },
    ],
    defaultValue: "",
  },
  {
    id: "Q7_rischio",
    label: "Rischio (privacy/claim)",
    required: true,
    type: "select",
    options: [
      { value: "basso", label: "Basso" },
      { value: "medio", label: "Medio" },
      { value: "alto", label: "Alto" },
    ],
  },
];

// =========================
// 4) VALIDAZIONE
// =========================

export function validateBrief2Altro(brief: ScritturaBreveBrief2_Altro): string[] {
  const errors: string[] = [];

  if (!brief.Q1_uso) errors.push("Q1_uso mancante");
  if (!brief.Q2_obiettivo) errors.push("Q2_obiettivo mancante");
  if (!brief.Q3_destinatario) errors.push("Q3_destinatario mancante");
  if (!brief.Q4_contesto) errors.push("Q4_contesto mancante");
  if (!brief.Q5_datiDisponibili) errors.push("Q5_datiDisponibili mancante");
  if (!brief.Q7_rischio) errors.push("Q7_rischio mancante");

  // Q6 multi-scelta opzionale
  return errors;
}
