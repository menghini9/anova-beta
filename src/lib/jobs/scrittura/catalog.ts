// ⬇️ BLOCCO S0 — SCRITTURA Catalog (V4, pulito)
// Path: /src/lib/brief/scrittura/catalog.ts

import type { ScritturaJob } from "@/lib/projects/types";

export type ScritturaJobMeta = {
  key: ScritturaJob;
  label: string;
  desc: string;
};

// ✅ TIPI che l’utente vede (Email è “macro”: apre submenu)
export const SCRITTURA_JOBS_MAIN: Array<ScritturaJobMeta> = [
  { key: "email_singola", label: "Email", desc: "singola o sequenza (scelta dentro Email)" },

  { key: "messaggio", label: "Messaggio", desc: "messaggi brevi, WhatsApp/DM, tono rapido" },
  { key: "post_social", label: "Post social", desc: "caption, post, call to action, tone of voice" },
  { key: "pagina_web", label: "Pagina web", desc: "landing, pagine sito, sezioni, copy" },
  { key: "descrizione_prodotto", label: "Descrizione prodotto", desc: "scheda prodotto, USP, e-commerce" },
  { key: "materiale_marketing", label: "Materiale marketing", desc: "brochure, claim, campagne, copy" },
  { key: "articolo", label: "Articolo", desc: "blog post, articolo, contenuto editoriale" },
  { key: "documento", label: "Documento", desc: "report, relazione, documento strutturato" },
  { key: "comunicazione_interna", label: "Comunicazione interna", desc: "memo, update, comunicazioni operative" },
  { key: "comunicato_pubblico", label: "Comunicato / Annuncio pubblico", desc: "annunci, note stampa, comunicati" },
  { key: "pitch_presentazione", label: "Pitch / Presentazione", desc: "outline, pitch deck, presentazione" },
  { key: "script_discorso", label: "Script / Discorso", desc: "speech, scaletta, script parlato" },
  { key: "faq", label: "FAQ", desc: "domande/risposte, help center, supporto" },
  { key: "bio_profilo", label: "Bio / Profilo", desc: "bio, profilo professionale, about" },
  { key: "libro_longform", label: "Libro / Long-form", desc: "struttura lunga, capitoli, long form" },
  { key: "altro", label: "Altro", desc: "caso speciale: definisci tu la richiesta" },
];

// ✅ Sub-scelta EMAIL
export const EMAIL_VARIANTS: Array<{
  key: "email_singola" | "email_sequenza";
  label: string;
  desc: string;
}> = [
  { key: "email_singola", label: "Singola", desc: "una email completa (brief 1→2→3)" },
  { key: "email_sequenza", label: "Sequenza", desc: "più email collegate (pipeline separata, per ora vuota)" },
];

// ✅ Normalizzazione SOLO per JOB (routing), non per contenuti testo
export function normalizeScritturaJob(x: unknown): ScritturaJob | null {
  if (typeof x !== "string") return null;
  const v = x.trim();

  // legacy mapping (se ti entra ancora roba vecchia)
  if (v === "email") return "email_singola";

  // allowlist dura e pura
  const allowed: ScritturaJob[] = [
    "email_singola",
    "email_sequenza",
    "messaggio",
    "post_social",
    "pagina_web",
    "descrizione_prodotto",
    "materiale_marketing",
    "articolo",
    "documento",
    "comunicazione_interna",
    "comunicato_pubblico",
    "pitch_presentazione",
    "script_discorso",
    "faq",
    "bio_profilo",
    "libro_longform",
    "altro",
  ];

  return allowed.includes(v as ScritturaJob) ? (v as ScritturaJob) : null;
}

export function isScritturaJob(x: unknown): x is ScritturaJob {
  return normalizeScritturaJob(x) !== null;
}
// ⬆️ FINE BLOCCO S0
