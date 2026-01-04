// ======================================================
// EMAIL SINGOLA — COHERENCE GATE (V1)
// Path: src/lib/brief/scrittura/jobs/email_singola/coherence.ts
//
// Scopo:
// - Evitare produzione di email incoerenti con brief + contesto reale (COSA).
// - Bloccare solo quando mancano dati critici o il testo è chiaramente fuori.
// ======================================================

import type { EmailSingolaBrief3 } from "./brief3";

/* =========================
   TIPI
========================= */
export type CoherenceVerdict = "OK" | "SOFT_MISMATCH" | "HARD_MISMATCH";

export type CoherenceResult = {
  verdict: CoherenceVerdict;
  reason: string;
  // opzionale: suggerimento operativo (non obbligatorio)
  hint?: string;
};

/* =========================
   HELPERS
========================= */
function norm(s?: string) {
  return (s || "").trim().toLowerCase();
}

function hasAny(text: string, needles: string[]) {
  return needles.some((n) => text.includes(n));
}

// euristica semplice: testo “azione richiesta”
function looksLikeActionRequest(text: string) {
  const t = norm(text);
  const triggers = [
    "fammi sapere",
    "mi confermi",
    "confermi",
    "mi mandi",
    "inviami",
    "mandami",
    "rispondi",
    "mi rispondi",
    "prenota",
    "fissiamo",
    "call",
    "riunione",
    "sentiamoci",
    "mi dici",
  ];
  return hasAny(t, triggers);
}

// euristica: utente dice “nessuna azione”
function looksLikeNoAction(text: string) {
  const t = norm(text);
  const triggers = ["nulla", "solo informare", "solo saluto", "nessuna azione", "nessun next step"];
  return hasAny(t, triggers);
}

// match “tema” molto grezzo: se COSA esiste, userText dovrebbe condividere almeno 1 keyword utile
function extractKeywords(s: string) {
  const t = norm(s)
    .replace(/[^a-zàèéìòóù0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  // stopword micro (non facciamo NLP ora, facciamo produzione)
  const stop = new Set([
    "il","lo","la","i","gli","le","un","uno","una",
    "di","a","da","in","su","per","con","tra","fra",
    "che","e","o","ma","se","non","si","mi","ti","ci","vi",
    "io","noi","tu","voi","lui","lei","loro",
    "questa","questo","quello","quella","qui","lì",
    "come","cosa","fare","fai","mail","email",
  ]);

  const kw = t.filter((w) => !stop.has(w) && w.length >= 4);
  // dedupe
  return Array.from(new Set(kw)).slice(0, 12);
}

function sharesTopic(userText: string, cosaText: string) {
  const uk = extractKeywords(userText);
  const ck = extractKeywords(cosaText);
  if (ck.length === 0) return true; // se COSA è vuoto lo gestiamo prima come HARD
  return uk.some((w) => ck.includes(w));
}

/* =========================
   MAIN CHECK
========================= */
export function checkEmailSingolaCoherence(args: {
  brief1?: any;
  brief2?: any;
  brief3?: EmailSingolaBrief3;
  userText: string;
}): CoherenceResult {
  const b1 = args.brief1 ?? {};
  const b2 = args.brief2 ?? {};
  const b3 = args.brief3 ?? {};
  const userText = (args.userText || "").trim();

  // 0) userText vuoto
  if (!userText) {
    return { verdict: "HARD_MISMATCH", reason: "Testo utente vuoto." };
  }

  // 1) COSA obbligatorio (Giro 3)
  const cosa = String(b3.cosa ?? "").trim();
  if (!cosa) {
    return {
      verdict: "HARD_MISMATCH",
      reason: "Manca il contesto reale (COSA) del Giro 3: senza quello l’email rischia di essere inventata.",
      hint: "Compila Giro 3 (COSA) con 2–8 righe concrete (nomi/date/numeri se servono).",
    };
  }

  // 2) Topic check (grezzo ma utile)
  if (!sharesTopic(userText, cosa)) {
    return {
      verdict: "SOFT_MISMATCH",
      reason: "Il tuo messaggio sembra fuori tema rispetto al COSA del Giro 3.",
      hint: "Se hai cambiato obiettivo, torna in WORK e aggiorna il brief (soprattutto Giro 3).",
    };
  }

  // 3) Risultato desiderato: coerenza “azione vs nessuna azione”
  const desiredOutcome = String(b2.desiredOutcome ?? b2.risultato_desiderato ?? "").trim();
  const desiredNoAction = looksLikeNoAction(desiredOutcome);

  // se outcome dice “nulla” ma user chiede azione → mismatch
  if (desiredNoAction && looksLikeActionRequest(userText)) {
    return {
      verdict: "SOFT_MISMATCH",
      reason: "Nel brief il Risultato desiderato sembra ‘nessuna azione’, ma il tuo messaggio chiede un’azione.",
      hint: "Allinea il ‘Risultato desiderato’ (Giro 2) oppure scrivi senza CTA.",
    };
  }

  // 4) Scopo vs tono “energia”
  const purpose = norm(String(b2.purpose ?? b2.scopo ?? ""));
  const energy = norm(String(b1.energy ?? b1.energia ?? ""));

  // sollecito + soft = warning (non blocco)
  if (purpose.includes("sollec") && energy.includes("soft")) {
    return {
      verdict: "SOFT_MISMATCH",
      reason: "Hai scelto ‘Sollecitare’ ma energia ‘Soft’: potrebbe risultare poco incisiva.",
      hint: "Se vuoi un sollecito efficace, valuta ‘Diretta’ o ‘Assertiva’.",
    };
  }

  // 5) OK
  return { verdict: "OK", reason: "Coerenza ok." };
}
