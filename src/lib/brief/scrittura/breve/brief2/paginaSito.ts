// ======================================================
// BRIEF 2 — SCRITTURA / PROGETTO BREVE — PAGINA SITO (Tranche 2)
// Path: /src/lib/brief/scrittura/breve/brief2/paginaSito.ts
// ======================================================

import type { BriefQuestion } from "../brief1";

// =========================
// 1) TIPI
// =========================

export type Brief2_Sito_TipoPagina =
  | "home"
  | "landing"
  | "chi_siamo"
  | "servizi"
  | "prodotto"
  | "faq"
  | "contatti";

export type Brief2_Sito_Obiettivo =
  | "conversione"
  | "informazione"
  | "posizionamento"
  | "supporto";

export type Brief2_Sito_Target = "privati" | "aziende" | "entrambi";

export type Brief2_Sito_CTA =
  | "preventivo"
  | "acquista"
  | "prenota"
  | "contatto"
  | "iscrizione"
  | "nessuna";

export type Brief2_Sito_Sezioni =
  | "hero"
  | "benefici"
  | "prove"
  | "pricing"
  | "faq";

export type Brief2_Sito_ProveDisponibili =
  | "recensioni"
  | "numeri"
  | "case_study"
  | "nessuna";

export type Brief2_Sito_Vincoli =
  | "no_prezzi"
  | "prezzi_si"
  | "no_claim_aggressivi"
  | "compliance";

export type ScritturaBreveBrief2_PaginaSito = {
  Q1_tipoPagina: Brief2_Sito_TipoPagina;
  Q2_obiettivoPagina: Brief2_Sito_Obiettivo;
  Q3_target: Brief2_Sito_Target;
  Q4_ctaPrincipale: Brief2_Sito_CTA;
  Q5_sezioniObbligatorie: Brief2_Sito_Sezioni[]; // multi
  Q6_proveDisponibili: Brief2_Sito_ProveDisponibili;
  Q7_vincoli: Brief2_Sito_Vincoli[]; // multi
};

// =========================
// 2) DEFAULTS (pratici)
// =========================

export const SCRITTURA_BREVE_BRIEF2_PAGINA_SITO_DEFAULTS: ScritturaBreveBrief2_PaginaSito =
  {
    Q1_tipoPagina: "landing",
    Q2_obiettivoPagina: "conversione",
    Q3_target: "entrambi",
    Q4_ctaPrincipale: "contatto",
    Q5_sezioniObbligatorie: ["hero", "benefici", "faq"],
    Q6_proveDisponibili: "nessuna",
    Q7_vincoli: ["no_claim_aggressivi"],
  };

// =========================
// 3) DOMANDE (QUESTIONS)
// =========================

export const SCRITTURA_BREVE_BRIEF2_PAGINA_SITO_QUESTIONS: BriefQuestion<any>[] = [
  {
    id: "Q1_tipoPagina",
    label: "Tipo pagina",
    required: true,
    type: "select",
    options: [
      { value: "home", label: "Home" },
      { value: "landing", label: "Landing" },
      { value: "chi_siamo", label: "Chi siamo" },
      { value: "servizi", label: "Servizi" },
      { value: "prodotto", label: "Prodotto" },
      { value: "faq", label: "FAQ" },
      { value: "contatti", label: "Contatti" },
    ],
  },
  {
    id: "Q2_obiettivoPagina",
    label: "Obiettivo pagina",
    required: true,
    type: "select",
    options: [
      { value: "conversione", label: "Conversione" },
      { value: "informazione", label: "Informazione" },
      { value: "posizionamento", label: "Posizionamento" },
      { value: "supporto", label: "Supporto" },
    ],
  },
  {
    id: "Q3_target",
    label: "Target",
    required: true,
    type: "select",
    options: [
      { value: "privati", label: "Privati" },
      { value: "aziende", label: "Aziende" },
      { value: "entrambi", label: "Entrambi" },
    ],
  },
  {
    id: "Q4_ctaPrincipale",
    label: "CTA principale",
    required: true,
    type: "select",
    options: [
      { value: "preventivo", label: "Preventivo" },
      { value: "acquista", label: "Acquista" },
      { value: "prenota", label: "Prenota" },
      { value: "contatto", label: "Contatto" },
      { value: "iscrizione", label: "Iscrizione" },
      { value: "nessuna", label: "Nessuna" },
    ],
  },
  {
    id: "Q5_sezioniObbligatorie",
    label: "Sezioni obbligatorie (multi-scelta)",
    required: false,
    type: "select",
    options: [
      { value: "hero", label: "Hero" },
      { value: "benefici", label: "Benefici" },
      { value: "prove", label: "Prove (testimonianze)" },
      { value: "pricing", label: "Pricing" },
      { value: "faq", label: "FAQ" },
    ],
    defaultValue: "",
  },
  {
    id: "Q6_proveDisponibili",
    label: "Prove disponibili",
    required: true,
    type: "select",
    options: [
      { value: "recensioni", label: "Recensioni" },
      { value: "numeri", label: "Numeri" },
      { value: "case_study", label: "Case study" },
      { value: "nessuna", label: "Nessuna" },
    ],
  },
  {
    id: "Q7_vincoli",
    label: "Vincoli (multi-scelta)",
    required: false,
    type: "select",
    options: [
      { value: "no_prezzi", label: "No prezzi" },
      { value: "prezzi_si", label: "Prezzi sì" },
      { value: "no_claim_aggressivi", label: "No claim aggressivi" },
      { value: "compliance", label: "Compliance" },
    ],
    defaultValue: "",
  },
];

// =========================
// 4) VALIDAZIONE
// =========================

export function validateBrief2PaginaSito(
  brief: ScritturaBreveBrief2_PaginaSito
): string[] {
  const errors: string[] = [];

  if (!brief.Q1_tipoPagina) errors.push("Q1_tipoPagina mancante");
  if (!brief.Q2_obiettivoPagina) errors.push("Q2_obiettivoPagina mancante");
  if (!brief.Q3_target) errors.push("Q3_target mancante");
  if (!brief.Q4_ctaPrincipale) errors.push("Q4_ctaPrincipale mancante");
  if (!brief.Q6_proveDisponibili) errors.push("Q6_proveDisponibili mancante");

  // Q5/Q7 multi-scelta opzionali
  return errors;
}
