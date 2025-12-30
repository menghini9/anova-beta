// ======================================================
// BRIEF 2 — SCRITTURA / PROGETTO BREVE — EMAIL (Tranche 2)
// Path: /src/lib/brief/scrittura/breve/brief2/email.ts
// ======================================================

import type { BriefQuestion } from "../brief1";

// =========================
// 1) TIPI
// =========================

export type Brief2_Email_Tipo =
  | "commerciale"
  | "supporto"
  | "follow_up"
  | "richiesta"
  | "reclamo"
  | "altro";

export type Brief2_Email_Relazione =
  | "prima_volta"
  | "gia_in_contatto"
  | "rapporto_teso";

export type Brief2_Email_Obiettivo =
  | "informare"
  | "chiedere"
  | "sollecitare"
  | "proporre"
  | "chiudere_accordo";

export type Brief2_Email_Elementi =
  | "link"
  | "allegato"
  | "data_ora"
  | "prezzo"
  | "codice_ordine";

export type Brief2_Email_Firma = "standard" | "ruolo_azienda" | "nessuna";
export type Brief2_Email_Lingua = "IT" | "EN" | "DE" | "altro";

export type ScritturaBreveBrief2_Email = {
  Q1_tipoEmail: Brief2_Email_Tipo;
  Q2_relazione: Brief2_Email_Relazione;
  Q3_obiettivo: Brief2_Email_Obiettivo;
  Q4_datiObbligatoriPresenti: "si" | "no";
  Q5_elementiDaIncludere: Brief2_Email_Elementi[]; // multi-scelta
  Q6_firma: Brief2_Email_Firma;
  Q7_lingua: Brief2_Email_Lingua;
};

// =========================
// 2) DEFAULTS
// =========================

export const SCRITTURA_BREVE_BRIEF2_EMAIL_DEFAULTS: ScritturaBreveBrief2_Email = {
  Q1_tipoEmail: "richiesta",
  Q2_relazione: "gia_in_contatto",
  Q3_obiettivo: "chiedere",
  Q4_datiObbligatoriPresenti: "si",
  Q5_elementiDaIncludere: [],
  Q6_firma: "standard",
  Q7_lingua: "IT",
};

// =========================
// 3) DOMANDE (QUESTIONS)
// =========================

export const SCRITTURA_BREVE_BRIEF2_EMAIL_QUESTIONS: BriefQuestion<any>[] = [
  {
    id: "Q1_tipoEmail",
    label: "Tipo email",
    required: true,
    type: "select",
    options: [
      { value: "commerciale", label: "Commerciale" },
      { value: "supporto", label: "Supporto" },
      { value: "follow_up", label: "Follow-up" },
      { value: "richiesta", label: "Richiesta" },
      { value: "reclamo", label: "Reclamo" },
      { value: "altro", label: "Altro" },
    ],
  },
  {
    id: "Q2_relazione",
    label: "Relazione",
    required: true,
    type: "select",
    options: [
      { value: "prima_volta", label: "Prima volta" },
      { value: "gia_in_contatto", label: "Già in contatto" },
      { value: "rapporto_teso", label: "Rapporto teso" },
    ],
  },
  {
    id: "Q3_obiettivo",
    label: "Obiettivo",
    required: true,
    type: "select",
    options: [
      { value: "informare", label: "Informare" },
      { value: "chiedere", label: "Chiedere" },
      { value: "sollecitare", label: "Sollecitare" },
      { value: "proporre", label: "Proporre" },
      { value: "chiudere_accordo", label: "Chiudere accordo" },
    ],
  },
  {
    id: "Q4_datiObbligatoriPresenti",
    label: "Dati obbligatori presenti?",
    required: true,
    type: "select",
    options: [
      { value: "si", label: "Sì" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "Q5_elementiDaIncludere",
    label: "Elementi da includere (multi-scelta)",
    required: false,
    type: "select",
    options: [
      { value: "link", label: "Link" },
      { value: "allegato", label: "Allegato" },
      { value: "data_ora", label: "Data-ora" },
      { value: "prezzo", label: "Prezzo" },
      { value: "codice_ordine", label: "Codice ordine" },
    ],
    defaultValue: "",
  },
  {
    id: "Q6_firma",
    label: "Firma",
    required: true,
    type: "select",
    options: [
      { value: "standard", label: "Standard" },
      { value: "ruolo_azienda", label: "Con ruolo + azienda" },
      { value: "nessuna", label: "Nessuna" },
    ],
  },
  {
    id: "Q7_lingua",
    label: "Lingua",
    required: true,
    type: "select",
    options: [
      { value: "IT", label: "IT" },
      { value: "EN", label: "EN" },
      { value: "DE", label: "DE" },
      { value: "altro", label: "Altro" },
    ],
  },
];

// =========================
// 4) VALIDAZIONE (Email giro 2)
// =========================

export function validateBrief2Email(brief: ScritturaBreveBrief2_Email): string[] {
  const errors: string[] = [];

  if (!brief.Q1_tipoEmail) errors.push("Q1_tipoEmail mancante");
  if (!brief.Q2_relazione) errors.push("Q2_relazione mancante");
  if (!brief.Q3_obiettivo) errors.push("Q3_obiettivo mancante");
  if (!brief.Q4_datiObbligatoriPresenti) errors.push("Q4_datiObbligatoriPresenti mancante");
  if (!brief.Q6_firma) errors.push("Q6_firma mancante");
  if (!brief.Q7_lingua) errors.push("Q7_lingua mancante");

  // Q5 multi-scelta opzionale
  return errors;
}
