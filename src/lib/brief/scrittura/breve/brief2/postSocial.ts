// ======================================================
// BRIEF 2 — SCRITTURA / PROGETTO BREVE — POST SOCIAL (Tranche 2)
// Path: /src/lib/brief/scrittura/breve/brief2/postSocial.ts
// ======================================================

import type { BriefQuestion } from "../brief1";

// =========================
// 1) TIPI
// =========================

export type Brief2_Social_Piattaforma =
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "facebook"
  | "x";

export type Brief2_Social_Obiettivo =
  | "vendita"
  | "lead"
  | "traffico"
  | "awareness"
  | "engagement";

export type Brief2_Social_Target = "privati" | "aziende" | "entrambi";

export type Brief2_Social_CTA =
  | "dm"
  | "commenta"
  | "visita_sito"
  | "salva"
  | "condividi"
  | "nessuna";

export type Brief2_Social_HashtagLivello =
  | "nessuno"
  | "pochi"
  | "standard"
  | "molti";

export type Brief2_Social_Vincoli =
  | "nessuno"
  | "no_promesse"
  | "safe_neutro";

export type Brief2_Social_Asset =
  | "nessuno"
  | "link"
  | "foto_video"
  | "testo_grezzo"
  | "punti_elenco";

export type ScritturaBreveBrief2_PostSocial = {
  Q1_piattaforma: Brief2_Social_Piattaforma;
  Q2_obiettivo: Brief2_Social_Obiettivo;
  Q3_target: Brief2_Social_Target;
  Q4_cta: Brief2_Social_CTA;
  Q5_hashtagLivello: Brief2_Social_HashtagLivello;
  Q6_vincoli: Brief2_Social_Vincoli;
  Q7_assetDisponibili: Brief2_Social_Asset;
};

// =========================
// 2) DEFAULTS
// =========================

export const SCRITTURA_BREVE_BRIEF2_SOCIAL_DEFAULTS: ScritturaBreveBrief2_PostSocial =
  {
    Q1_piattaforma: "instagram",
    Q2_obiettivo: "engagement",
    Q3_target: "entrambi",
    Q4_cta: "dm",
    Q5_hashtagLivello: "standard",
    Q6_vincoli: "safe_neutro",
    Q7_assetDisponibili: "nessuno",
  };

// =========================
// 3) DOMANDE (QUESTIONS)
// =========================

export const SCRITTURA_BREVE_BRIEF2_SOCIAL_QUESTIONS: BriefQuestion<any>[] = [
  {
    id: "Q1_piattaforma",
    label: "Piattaforma",
    required: true,
    type: "select",
    options: [
      { value: "instagram", label: "Instagram" },
      { value: "tiktok", label: "TikTok" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "facebook", label: "Facebook" },
      { value: "x", label: "X" },
    ],
  },
  {
    id: "Q2_obiettivo",
    label: "Obiettivo",
    required: true,
    type: "select",
    options: [
      { value: "vendita", label: "Vendita" },
      { value: "lead", label: "Lead" },
      { value: "traffico", label: "Traffico" },
      { value: "awareness", label: "Awareness" },
      { value: "engagement", label: "Engagement" },
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
    id: "Q4_cta",
    label: "CTA",
    required: true,
    type: "select",
    options: [
      { value: "dm", label: "DM" },
      { value: "commenta", label: "Commenta" },
      { value: "visita_sito", label: "Visita sito" },
      { value: "salva", label: "Salva" },
      { value: "condividi", label: "Condividi" },
      { value: "nessuna", label: "Nessuna" },
    ],
  },
  {
    id: "Q5_hashtagLivello",
    label: "Hashtag livello",
    required: true,
    type: "select",
    options: [
      { value: "nessuno", label: "Nessuno" },
      { value: "pochi", label: "Pochi (3–5)" },
      { value: "standard", label: "Standard (6–10)" },
      { value: "molti", label: "Molti (11–15)" },
    ],
  },
  {
    id: "Q6_vincoli",
    label: "Vincoli brand/legal",
    required: true,
    type: "select",
    options: [
      { value: "nessuno", label: "Nessuno" },
      { value: "no_promesse", label: "No promesse" },
      { value: "safe_neutro", label: "Linguaggio “safe” neutro" },
    ],
  },
  {
    id: "Q7_assetDisponibili",
    label: "Asset disponibili",
    required: true,
    type: "select",
    options: [
      { value: "nessuno", label: "Nessuno" },
      { value: "link", label: "Link" },
      { value: "foto_video", label: "Foto-video" },
      { value: "testo_grezzo", label: "Testo grezzo" },
      { value: "punti_elenco", label: "Punti elenco" },
    ],
  },
];

// =========================
// 4) VALIDAZIONE (Post social giro 2)
// =========================

export function validateBrief2PostSocial(
  brief: ScritturaBreveBrief2_PostSocial
): string[] {
  const errors: string[] = [];

  if (!brief.Q1_piattaforma) errors.push("Q1_piattaforma mancante");
  if (!brief.Q2_obiettivo) errors.push("Q2_obiettivo mancante");
  if (!brief.Q3_target) errors.push("Q3_target mancante");
  if (!brief.Q4_cta) errors.push("Q4_cta mancante");
  if (!brief.Q5_hashtagLivello) errors.push("Q5_hashtagLivello mancante");
  if (!brief.Q6_vincoli) errors.push("Q6_vincoli mancante");
  if (!brief.Q7_assetDisponibili) errors.push("Q7_assetDisponibili mancante");

  return errors;
}
