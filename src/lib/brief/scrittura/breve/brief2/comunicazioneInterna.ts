// ======================================================
// BRIEF 2 — SCRITTURA / PROGETTO BREVE — COMUNICAZIONE INTERNA (Tranche 2)
// Path: /src/lib/brief/scrittura/breve/brief2/comunicazioneInterna.ts
// ======================================================

import type { BriefQuestion } from "../brief1";

// =========================
// 1) TIPI
// =========================

export type Brief2_Int_Tipo =
  | "avviso"
  | "procedura"
  | "aggiornamento"
  | "richiesta"
  | "feedback"
  | "crisi";

export type Brief2_Int_Destinatari = "tutti" | "reparto" | "manager" | "singolo";

export type Brief2_Int_Obiettivo =
  | "informare"
  | "allineare"
  | "richiedere_azione"
  | "prevenire_errori";

export type Brief2_Int_Canale =
  | "email"
  | "chat_aziendale"
  | "bacheca"
  | "meeting_note";

export type Brief2_Int_Urgenza = "bassa" | "media" | "alta";

export type Brief2_Int_AzioneRichiesta = "si" | "no";

export type Brief2_Int_Scadenza = "oggi" | "24h" | "settimana" | "nessuna";

export type Brief2_Int_ContenutiObbligatori =
  | "cosa_cambia"
  | "da_quando"
  | "cosa_fare"
  | "chi_contattare";

export type ScritturaBreveBrief2_ComunicazioneInterna = {
  Q1_tipo: Brief2_Int_Tipo;
  Q2_destinatari: Brief2_Int_Destinatari;
  Q3_obiettivo: Brief2_Int_Obiettivo;
  Q4_canale: Brief2_Int_Canale;
  Q5_urgenza: Brief2_Int_Urgenza;
  Q6_azioneRichiesta: Brief2_Int_AzioneRichiesta;
  Q7_scadenza: Brief2_Int_Scadenza;
  Q8_contenutiObbligatori: Brief2_Int_ContenutiObbligatori[]; // multi-scelta
};

// =========================
// 2) DEFAULTS (tradizionali e pratici)
// =========================

export const SCRITTURA_BREVE_BRIEF2_INTERNA_DEFAULTS: ScritturaBreveBrief2_ComunicazioneInterna =
  {
    Q1_tipo: "avviso",
    Q2_destinatari: "reparto",
    Q3_obiettivo: "informare",
    Q4_canale: "chat_aziendale",
    Q5_urgenza: "media",
    Q6_azioneRichiesta: "no",
    Q7_scadenza: "nessuna",
    Q8_contenutiObbligatori: ["cosa_cambia", "da_quando", "cosa_fare"],
  };

// =========================
// 3) DOMANDE (QUESTIONS)
// =========================

export const SCRITTURA_BREVE_BRIEF2_INTERNA_QUESTIONS: BriefQuestion<any>[] = [
  {
    id: "Q1_tipo",
    label: "Tipo",
    required: true,
    type: "select",
    options: [
      { value: "avviso", label: "Avviso" },
      { value: "procedura", label: "Procedura" },
      { value: "aggiornamento", label: "Aggiornamento" },
      { value: "richiesta", label: "Richiesta" },
      { value: "feedback", label: "Feedback" },
      { value: "crisi", label: "Crisi" },
    ],
  },
  {
    id: "Q2_destinatari",
    label: "Destinatari",
    required: true,
    type: "select",
    options: [
      { value: "tutti", label: "Tutti" },
      { value: "reparto", label: "Reparto" },
      { value: "manager", label: "Manager" },
      { value: "singolo", label: "Singolo" },
    ],
  },
  {
    id: "Q3_obiettivo",
    label: "Obiettivo",
    required: true,
    type: "select",
    options: [
      { value: "informare", label: "Informare" },
      { value: "allineare", label: "Allineare" },
      { value: "richiedere_azione", label: "Richiedere azione" },
      { value: "prevenire_errori", label: "Prevenire errori" },
    ],
  },
  {
    id: "Q4_canale",
    label: "Canale",
    required: true,
    type: "select",
    options: [
      { value: "email", label: "Email" },
      { value: "chat_aziendale", label: "Chat aziendale" },
      { value: "bacheca", label: "Bacheca" },
      { value: "meeting_note", label: "Meeting note" },
    ],
  },
  {
    id: "Q5_urgenza",
    label: "Urgenza",
    required: true,
    type: "select",
    options: [
      { value: "bassa", label: "Bassa" },
      { value: "media", label: "Media" },
      { value: "alta", label: "Alta" },
    ],
  },
  {
    id: "Q6_azioneRichiesta",
    label: "Azione richiesta?",
    required: true,
    type: "select",
    options: [
      { value: "si", label: "Sì" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "Q7_scadenza",
    label: "Scadenza",
    required: true,
    type: "select",
    options: [
      { value: "oggi", label: "Oggi" },
      { value: "24h", label: "24h" },
      { value: "settimana", label: "Settimana" },
      { value: "nessuna", label: "Nessuna" },
    ],
  },
  {
    id: "Q8_contenutiObbligatori",
    label: "Contenuti obbligatori (multi-scelta)",
    required: false,
    type: "select",
    options: [
      { value: "cosa_cambia", label: "Cosa cambia" },
      { value: "da_quando", label: "Da quando" },
      { value: "cosa_fare", label: "Cosa fare" },
      { value: "chi_contattare", label: "Chi contattare" },
    ],
    defaultValue: "",
  },
];

// =========================
// 4) VALIDAZIONE
// =========================

export function validateBrief2ComunicazioneInterna(
  brief: ScritturaBreveBrief2_ComunicazioneInterna
): string[] {
  const errors: string[] = [];

  if (!brief.Q1_tipo) errors.push("Q1_tipo mancante");
  if (!brief.Q2_destinatari) errors.push("Q2_destinatari mancante");
  if (!brief.Q3_obiettivo) errors.push("Q3_obiettivo mancante");
  if (!brief.Q4_canale) errors.push("Q4_canale mancante");
  if (!brief.Q5_urgenza) errors.push("Q5_urgenza mancante");
  if (!brief.Q6_azioneRichiesta) errors.push("Q6_azioneRichiesta mancante");
  if (!brief.Q7_scadenza) errors.push("Q7_scadenza mancante");

  // Q8 multi-scelta opzionale
  return errors;
}
