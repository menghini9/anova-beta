// ======================================================
// BRIEF 2 — SCRITTURA / PROGETTO BREVE — ROUTER (index)
// Path: /src/lib/brief/scrittura/breve/brief2/index.ts
// ======================================================

import type { BriefQuestion, Brief1_Q1_Testo } from "../brief1";

// =========================
// 1) IMPORT MODULI BRIEF2
// =========================

import {
  SCRITTURA_BREVE_BRIEF2_EMAIL_DEFAULTS,
  SCRITTURA_BREVE_BRIEF2_EMAIL_QUESTIONS,
  validateBrief2Email,
  type ScritturaBreveBrief2_Email,
} from "./email";

import {
  SCRITTURA_BREVE_BRIEF2_MESSAGGIO_DEFAULTS,
  SCRITTURA_BREVE_BRIEF2_MESSAGGIO_QUESTIONS,
  validateBrief2Messaggio,
  type ScritturaBreveBrief2_Messaggio,
} from "./messaggio";

import {
  SCRITTURA_BREVE_BRIEF2_SOCIAL_DEFAULTS,
  SCRITTURA_BREVE_BRIEF2_SOCIAL_QUESTIONS,
  validateBrief2PostSocial,
  type ScritturaBreveBrief2_PostSocial,
} from "./postSocial";

import {
  SCRITTURA_BREVE_BRIEF2_PRODOTTO_DEFAULTS,
  SCRITTURA_BREVE_BRIEF2_PRODOTTO_QUESTIONS,
  validateBrief2DescrizioneProdotto,
  type ScritturaBreveBrief2_DescrizioneProdotto,
} from "./descrizioneProdotto";

import {
  SCRITTURA_BREVE_BRIEF2_PAGINA_SITO_DEFAULTS,
  SCRITTURA_BREVE_BRIEF2_PAGINA_SITO_QUESTIONS,
  validateBrief2PaginaSito,
  type ScritturaBreveBrief2_PaginaSito,
} from "./paginaSito";

import {
  SCRITTURA_BREVE_BRIEF2_INTERNA_DEFAULTS,
  SCRITTURA_BREVE_BRIEF2_INTERNA_QUESTIONS,
  validateBrief2ComunicazioneInterna,
  type ScritturaBreveBrief2_ComunicazioneInterna,
} from "./comunicazioneInterna";

import {
  SCRITTURA_BREVE_BRIEF2_ALTRO_DEFAULTS,
  SCRITTURA_BREVE_BRIEF2_ALTRO_QUESTIONS,
  validateBrief2Altro,
  type ScritturaBreveBrief2_Altro,
} from "./altro";

// =========================
// 2) TIPI ROUTER
// =========================

export type Brief2ModuleKey =
  | "email"
  | "messaggio"
  | "post_social"
  | "descrizione_prodotto"
  | "pagina_sito"
  | "comunicazione_interna"
  | "altro";

export type Brief2ModuleConfig = {
  key: Brief2ModuleKey;
  title: string;
  defaults: any;
  questions: BriefQuestion<any>[];
  validate: (brief2: any) => string[];
};

// =========================
// 3) ROUTER (single source of truth)
// =========================

export function getScritturaBreveBrief2Module(q1: Brief1_Q1_Testo): Brief2ModuleConfig {
  switch (q1) {
    case "email":
      return {
        key: "email",
        title: "Brief — Giro 2 (Email)",
        defaults: SCRITTURA_BREVE_BRIEF2_EMAIL_DEFAULTS satisfies ScritturaBreveBrief2_Email,
        questions: SCRITTURA_BREVE_BRIEF2_EMAIL_QUESTIONS,
        validate: (b) => validateBrief2Email(b),
      };

    case "messaggio":
      return {
        key: "messaggio",
        title: "Brief — Giro 2 (Messaggio)",
        defaults:
          SCRITTURA_BREVE_BRIEF2_MESSAGGIO_DEFAULTS satisfies ScritturaBreveBrief2_Messaggio,
        questions: SCRITTURA_BREVE_BRIEF2_MESSAGGIO_QUESTIONS,
        validate: (b) => validateBrief2Messaggio(b),
      };

    case "post_social":
      return {
        key: "post_social",
        title: "Brief — Giro 2 (Post social)",
        defaults:
          SCRITTURA_BREVE_BRIEF2_SOCIAL_DEFAULTS satisfies ScritturaBreveBrief2_PostSocial,
        questions: SCRITTURA_BREVE_BRIEF2_SOCIAL_QUESTIONS,
        validate: (b) => validateBrief2PostSocial(b),
      };

    case "descrizione_prodotto":
      return {
        key: "descrizione_prodotto",
        title: "Brief — Giro 2 (Descrizione prodotto)",
        defaults:
          SCRITTURA_BREVE_BRIEF2_PRODOTTO_DEFAULTS satisfies ScritturaBreveBrief2_DescrizioneProdotto,
        questions: SCRITTURA_BREVE_BRIEF2_PRODOTTO_QUESTIONS,
        validate: (b) => validateBrief2DescrizioneProdotto(b),
      };

    case "pagina_sito":
      return {
        key: "pagina_sito",
        title: "Brief — Giro 2 (Pagina sito)",
        defaults:
          SCRITTURA_BREVE_BRIEF2_PAGINA_SITO_DEFAULTS satisfies ScritturaBreveBrief2_PaginaSito,
        questions: SCRITTURA_BREVE_BRIEF2_PAGINA_SITO_QUESTIONS,
        validate: (b) => validateBrief2PaginaSito(b),
      };

    case "comunicazione_interna":
      return {
        key: "comunicazione_interna",
        title: "Brief — Giro 2 (Comunicazione interna)",
        defaults:
          SCRITTURA_BREVE_BRIEF2_INTERNA_DEFAULTS satisfies ScritturaBreveBrief2_ComunicazioneInterna,
        questions: SCRITTURA_BREVE_BRIEF2_INTERNA_QUESTIONS,
        validate: (b) => validateBrief2ComunicazioneInterna(b),
      };

    case "altro":
    default:
      return {
        key: "altro",
        title: "Brief — Giro 2 (Altro)",
        defaults: SCRITTURA_BREVE_BRIEF2_ALTRO_DEFAULTS satisfies ScritturaBreveBrief2_Altro,
        questions: SCRITTURA_BREVE_BRIEF2_ALTRO_QUESTIONS,
        validate: (b) => validateBrief2Altro(b),
      };
  }
}
// ======================================================
// EXPORTS (public API)
// ======================================================

export { buildScritturaBreveContractAll } from "./contract";
export { checkScritturaBreveCoherence } from "./coherence";
