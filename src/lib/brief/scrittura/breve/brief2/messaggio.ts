// ======================================================
// BRIEF 2 — SCRITTURA / PROGETTO BREVE — MESSAGGIO (Tranche 2)
// Path: /src/lib/brief/scrittura/breve/brief2/messaggio.ts
// ======================================================

import type { BriefQuestion } from "../brief1";

// =========================
// 1) TIPI
// =========================

export type Brief2_Msg_Canale =
  | "whatsapp"
  | "telegram"
  | "sms"
  | "instagram_dm"
  | "linkedin_dm";

export type Brief2_Msg_Destinatario =
  | "cliente"
  | "amico"
  | "collega"
  | "fornitore";

export type Brief2_Msg_Obiettivo =
  | "fissare_appuntamento"
  | "risposta_rapida"
  | "sollecito"
  | "conferma"
  | "scuse";

export type Brief2_Msg_Urgenza = "bassa" | "media" | "alta";

export type Brief2_Msg_Contesto = "prima_scrittura" | "risposta_chat";

export type Brief2_Msg_InfoCerte = "data" | "ora" | "luogo" | "prezzo" | "link";

export type Brief2_Msg_Chiusura = "domanda_finale" | "call_to_action" | "neutra";

export type ScritturaBreveBrief2_Messaggio = {
  Q1_canale: Brief2_Msg_Canale;
  Q2_destinatario: Brief2_Msg_Destinatario;
  Q3_obiettivo: Brief2_Msg_Obiettivo;
  Q4_urgenza: Brief2_Msg_Urgenza;
  Q5_contesto: Brief2_Msg_Contesto;
  Q6_infoCerte: Brief2_Msg_InfoCerte[]; // multi-scelta
  Q7_chiusura: Brief2_Msg_Chiusura;
};

// =========================
// 2) DEFAULTS
// =========================

export const SCRITTURA_BREVE_BRIEF2_MESSAGGIO_DEFAULTS: ScritturaBreveBrief2_Messaggio =
  {
    Q1_canale: "whatsapp",
    Q2_destinatario: "cliente",
    Q3_obiettivo: "risposta_rapida",
    Q4_urgenza: "media",
    Q5_contesto: "prima_scrittura",
    Q6_infoCerte: [],
    Q7_chiusura: "neutra",
  };

// =========================
// 3) DOMANDE (QUESTIONS)
// =========================

export const SCRITTURA_BREVE_BRIEF2_MESSAGGIO_QUESTIONS: BriefQuestion<any>[] = [
  {
    id: "Q1_canale",
    label: "Canale",
    required: true,
    type: "select",
    options: [
      { value: "whatsapp", label: "WhatsApp" },
      { value: "telegram", label: "Telegram" },
      { value: "sms", label: "SMS" },
      { value: "instagram_dm", label: "Instagram DM" },
      { value: "linkedin_dm", label: "LinkedIn DM" },
    ],
  },
  {
    id: "Q2_destinatario",
    label: "Destinatario",
    required: true,
    type: "select",
    options: [
      { value: "cliente", label: "Cliente" },
      { value: "amico", label: "Amico" },
      { value: "collega", label: "Collega" },
      { value: "fornitore", label: "Fornitore" },
    ],
  },
  {
    id: "Q3_obiettivo",
    label: "Obiettivo",
    required: true,
    type: "select",
    options: [
      { value: "fissare_appuntamento", label: "Fissare appuntamento" },
      { value: "risposta_rapida", label: "Risposta rapida" },
      { value: "sollecito", label: "Sollecito" },
      { value: "conferma", label: "Conferma" },
      { value: "scuse", label: "Scuse" },
    ],
  },
  {
    id: "Q4_urgenza",
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
    id: "Q5_contesto",
    label: "Contesto",
    required: true,
    type: "select",
    options: [
      { value: "prima_scrittura", label: "Prima scrittura" },
      { value: "risposta_chat", label: "Risposta a chat esistente" },
    ],
  },
  {
    id: "Q6_infoCerte",
    label: "Informazioni certe da includere (multi-scelta)",
    required: false,
    type: "select",
    options: [
      { value: "data", label: "Data" },
      { value: "ora", label: "Ora" },
      { value: "luogo", label: "Luogo" },
      { value: "prezzo", label: "Prezzo" },
      { value: "link", label: "Link" },
    ],
    defaultValue: "",
  },
  {
    id: "Q7_chiusura",
    label: "Chiusura",
    required: true,
    type: "select",
    options: [
      { value: "domanda_finale", label: "Domanda finale" },
      { value: "call_to_action", label: "Call-to-action" },
      { value: "neutra", label: "Neutra" },
    ],
  },
];

// =========================
// 4) VALIDAZIONE (Messaggio giro 2)
// =========================

export function validateBrief2Messaggio(
  brief: ScritturaBreveBrief2_Messaggio
): string[] {
  const errors: string[] = [];

  if (!brief.Q1_canale) errors.push("Q1_canale mancante");
  if (!brief.Q2_destinatario) errors.push("Q2_destinatario mancante");
  if (!brief.Q3_obiettivo) errors.push("Q3_obiettivo mancante");
  if (!brief.Q4_urgenza) errors.push("Q4_urgenza mancante");
  if (!brief.Q5_contesto) errors.push("Q5_contesto mancante");
  if (!brief.Q7_chiusura) errors.push("Q7_chiusura mancante");

  // Q6 multi-scelta opzionale
  return errors;
}
