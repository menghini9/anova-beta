// ======================================================
// BRIEF 2 — SCRITTURA / PROGETTO BREVE — DESCRIZIONE PRODOTTO (Tranche 2)
// Path: /src/lib/brief/scrittura/breve/brief2/descrizioneProdotto.ts
// ======================================================

import type { BriefQuestion } from "../brief1";

// =========================
// 1) TIPI
// =========================

export type Brief2_Prod_Dove =
  | "ecommerce"
  | "amazon"
  | "catalogo_pdf"
  | "social_shop";

export type Brief2_Prod_Categoria =
  | "moda"
  | "tech"
  | "casa"
  | "food"
  | "servizi"
  | "altro";

export type Brief2_Prod_Fase = "lancio" | "update" | "promo";

export type Brief2_Prod_Dati =
  | "scheda_tecnica"
  | "caratteristiche"
  | "solo_idea";

export type Brief2_Prod_PuntiObbligatori =
  | "materiali"
  | "misure"
  | "compatibilita"
  | "manutenzione"
  | "garanzia";

export type Brief2_Prod_Beneficio =
  | "qualita"
  | "prezzo"
  | "velocita"
  | "design"
  | "sostenibilita";

export type Brief2_Prod_Claim =
  | "liberi"
  | "solo_verificabili"
  | "super_cauti";

export type Brief2_Prod_Obiezione =
  | "prezzo"
  | "durata"
  | "compatibilita"
  | "spedizione"
  | "resi";

export type ScritturaBreveBrief2_DescrizioneProdotto = {
  Q1_doveUsata: Brief2_Prod_Dove;
  Q2_categoria: Brief2_Prod_Categoria;
  Q3_fase: Brief2_Prod_Fase;
  Q4_datiDisponibili: Brief2_Prod_Dati;
  Q5_puntiObbligatori: Brief2_Prod_PuntiObbligatori[]; // multi-scelta
  Q6_beneficioPrincipale: Brief2_Prod_Beneficio;
  Q7_claimConsentiti: Brief2_Prod_Claim;
  Q8_obiezioneDaPrevenire: Brief2_Prod_Obiezione;
};

// =========================
// 2) DEFAULTS (pratici e “safe”)
// =========================

export const SCRITTURA_BREVE_BRIEF2_PRODOTTO_DEFAULTS: ScritturaBreveBrief2_DescrizioneProdotto =
  {
    Q1_doveUsata: "ecommerce",
    Q2_categoria: "altro",
    Q3_fase: "lancio",
    Q4_datiDisponibili: "caratteristiche",
    Q5_puntiObbligatori: [],
    Q6_beneficioPrincipale: "qualita",
    Q7_claimConsentiti: "solo_verificabili",
    Q8_obiezioneDaPrevenire: "prezzo",
  };

// =========================
// 3) DOMANDE (QUESTIONS)
// =========================

export const SCRITTURA_BREVE_BRIEF2_PRODOTTO_QUESTIONS: BriefQuestion<any>[] = [
  {
    id: "Q1_doveUsata",
    label: "Dove verrà usata",
    required: true,
    type: "select",
    options: [
      { value: "ecommerce", label: "E-commerce" },
      { value: "amazon", label: "Amazon" },
      { value: "catalogo_pdf", label: "Catalogo PDF" },
      { value: "social_shop", label: "Social shop" },
    ],
  },
  {
    id: "Q2_categoria",
    label: "Categoria",
    required: true,
    type: "select",
    options: [
      { value: "moda", label: "Moda" },
      { value: "tech", label: "Tech" },
      { value: "casa", label: "Casa" },
      { value: "food", label: "Food" },
      { value: "servizi", label: "Servizi" },
      { value: "altro", label: "Altro" },
    ],
  },
  {
    id: "Q3_fase",
    label: "Fase",
    required: true,
    type: "select",
    options: [
      { value: "lancio", label: "Lancio" },
      { value: "update", label: "Update" },
      { value: "promo", label: "Promo" },
    ],
  },
  {
    id: "Q4_datiDisponibili",
    label: "Dati disponibili (scelta singola)",
    required: true,
    type: "select",
    options: [
      { value: "scheda_tecnica", label: "Scheda tecnica" },
      { value: "caratteristiche", label: "Caratteristiche" },
      { value: "solo_idea", label: "Solo idea" },
    ],
  },
  {
    id: "Q5_puntiObbligatori",
    label: "Punti obbligatori (multi-scelta)",
    required: false,
    type: "select",
    options: [
      { value: "materiali", label: "Materiali" },
      { value: "misure", label: "Misure" },
      { value: "compatibilita", label: "Compatibilità" },
      { value: "manutenzione", label: "Manutenzione" },
      { value: "garanzia", label: "Garanzia" },
    ],
    defaultValue: "",
  },
  {
    id: "Q6_beneficioPrincipale",
    label: "Beneficio principale",
    required: true,
    type: "select",
    options: [
      { value: "qualita", label: "Qualità" },
      { value: "prezzo", label: "Prezzo" },
      { value: "velocita", label: "Velocità" },
      { value: "design", label: "Design" },
      { value: "sostenibilita", label: "Sostenibilità" },
    ],
  },
  {
    id: "Q7_claimConsentiti",
    label: "Claim consentiti",
    required: true,
    type: "select",
    options: [
      { value: "liberi", label: "Liberi" },
      { value: "solo_verificabili", label: "Solo verificabili" },
      { value: "super_cauti", label: "Super cauti" },
    ],
  },
  {
    id: "Q8_obiezioneDaPrevenire",
    label: "Obiezione da prevenire",
    required: true,
    type: "select",
    options: [
      { value: "prezzo", label: "Prezzo" },
      { value: "durata", label: "Durata" },
      { value: "compatibilita", label: "Compatibilità" },
      { value: "spedizione", label: "Spedizione" },
      { value: "resi", label: "Resi" },
    ],
  },
];

// =========================
// 4) VALIDAZIONE
// =========================

export function validateBrief2DescrizioneProdotto(
  brief: ScritturaBreveBrief2_DescrizioneProdotto
): string[] {
  const errors: string[] = [];

  if (!brief.Q1_doveUsata) errors.push("Q1_doveUsata mancante");
  if (!brief.Q2_categoria) errors.push("Q2_categoria mancante");
  if (!brief.Q3_fase) errors.push("Q3_fase mancante");
  if (!brief.Q4_datiDisponibili) errors.push("Q4_datiDisponibili mancante");
  if (!brief.Q6_beneficioPrincipale) errors.push("Q6_beneficioPrincipale mancante");
  if (!brief.Q7_claimConsentiti) errors.push("Q7_claimConsentiti mancante");
  if (!brief.Q8_obiezioneDaPrevenire) errors.push("Q8_obiezioneDaPrevenire mancante");

  // Q5 multi-scelta opzionale
  return errors;
}
