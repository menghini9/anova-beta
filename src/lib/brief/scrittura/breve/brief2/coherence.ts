// ======================================================
// COHERENCE — SCRITTURA / PROGETTO BREVE (NO-AI)
// Path: /src/lib/brief/scrittura/breve/brief2/coherence.ts
// ======================================================

import type { ScritturaBreveBrief1, Brief1_Q1_Testo } from "../brief1";

export type CoherenceVerdict = "OK" | "SOFT_MISMATCH" | "HARD_MISMATCH";

export type CoherenceResult = {
  verdict: CoherenceVerdict;
  expectedType: Brief1_Q1_Testo;
  detectedType: Brief1_Q1_Testo | "unknown";
  confidence: number; // 0..1
  reason: string;
};

// =========================
// SIGNAL DI BASE (keyword)
// =========================
const SIGNALS: Record<Exclude<Brief1_Q1_Testo, "altro">, string[]> = {
  email: [
    "oggetto:",
    "spett.le",
    "gentile",
    "cordiali",
    "distinti",
    "in allegato",
    "allego",
    "resto a disposizione",
    "in attesa",
    "saluti",
  ],
  messaggio: ["whatsapp", "telegram", "sms", "dm", "messaggio", "fammi sapere", "quando sei libero"],
  post_social: [
    "hashtag",
    "#",
    "caption",
    "reel",
    "storia",
    "tiktok",
    "instagram",
    "linkedin",
    "facebook",
    "tagga",
    "commenta",
    "condividi",
    "salva",
  ],
  descrizione_prodotto: [
    "caratteristiche",
    "specifiche",
    "materiali",
    "taglie",
    "misure",
    "compatibilità",
    "manutenzione",
    "garanzia",
    "spedizione",
    "resi",
  ],
  pagina_sito: ["landing", "hero", "faq", "pricing", "cta", "sezione", "home", "chi siamo", "contatti"],
  comunicazione_interna: ["procedura", "policy", "avviso", "reparto", "interno", "da oggi", "a partire da"],
};

// =========================
// SIGNAL “FORTI” (pattern)
// =========================
const STRONG_PATTERNS: Array<{
  type: Exclude<Brief1_Q1_Testo, "altro">;
  test: (t: string) => boolean;
  reason: string;
}> = [
  {
    type: "email",
    test: (t) => t.includes("oggetto:") || t.includes("in allegato") || t.includes("cordiali saluti"),
    reason: "pattern tipico email (oggetto/allegato/saluti)",
  },
  {
    type: "post_social",
    test: (t) =>
      t.includes("#") && (t.includes("instagram") || t.includes("hashtag") || t.includes("caption")),
    reason: "pattern tipico social (hashtag + piattaforma/caption)",
  },
  {
    type: "pagina_sito",
    test: (t) => (t.includes("hero") || t.includes("faq") || t.includes("pricing")) && t.includes("cta"),
    reason: "pattern tipico pagina sito (hero/faq/pricing + cta)",
  },
  {
    type: "messaggio",
    test: (t) => t.includes("whatsapp") || t.includes("telegram") || t.includes("sms") || t.includes("dm"),
    reason: "pattern tipico messaggio (canale esplicito)",
  },
  {
    type: "descrizione_prodotto",
    test: (t) => t.includes("taglie") || t.includes("materiali") || t.includes("resi") || t.includes("spedizione"),
    reason: "pattern tipico descrizione prodotto (taglie/materiali/spedizione/resi)",
  },
  {
    type: "comunicazione_interna",
    test: (t) => t.includes("procedura") || t.includes("da oggi") || t.includes("a partire da"),
    reason: "pattern tipico comunicazione interna (procedura/efficacia temporale)",
  },
];

function norm(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreType(t: string, type: Exclude<Brief1_Q1_Testo, "altro">) {
  const kw = SIGNALS[type];
  const hits = kw.filter((k) => t.includes(k));
  return { hits, score: hits.length };
}

function detectType(t: string): { detected: Brief1_Q1_Testo | "unknown"; confidence: number; why: string } {
  // strong pattern boost
  for (const p of STRONG_PATTERNS) {
    if (p.test(t)) return { detected: p.type, confidence: 0.85, why: p.reason };
  }

  const keys = Object.keys(SIGNALS) as Array<Exclude<Brief1_Q1_Testo, "altro">>;
  const scored = keys.map((k) => ({ k, ...scoreType(t, k) })).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];

  if (!top || top.score === 0) return { detected: "unknown", confidence: 0, why: "nessun segnale forte rilevato" };

  const gap = top.score - (second?.score ?? 0);

  let confidence = 0.45;
  if (top.score >= 3 && gap >= 2) confidence = 0.8;
  else if (top.score >= 2 && gap >= 1) confidence = 0.65;

  return { detected: top.k as any, confidence, why: `keyword match: ${top.k} (score ${top.score}, gap ${gap})` };
}

export function checkScritturaBreveCoherence(args: {
  brief1: ScritturaBreveBrief1;
  brief2?: any;
  userText: string;
}): CoherenceResult {
  const expected = args.brief1?.Q1 ?? "altro";
  const t = norm(args.userText || "");

  // Q1=altro → non vincolare
  if (expected === "altro") {
    return {
      verdict: "OK",
      expectedType: expected,
      detectedType: "unknown",
      confidence: 0,
      reason: "brief1.Q1 = altro → coerenza non vincolante",
    };
  }

  const det = detectType(t);

  if (det.detected === "unknown") {
    return {
      verdict: "OK",
      expectedType: expected,
      detectedType: "unknown",
      confidence: 0,
      reason: "testo generico: nessun mismatch rilevabile senza contesto",
    };
  }

  if (det.detected === expected) {
    return {
      verdict: "OK",
      expectedType: expected,
      detectedType: det.detected,
      confidence: det.confidence,
      reason: det.why,
    };
  }

  const verdict: CoherenceVerdict = det.confidence >= 0.8 ? "HARD_MISMATCH" : "SOFT_MISMATCH";

  return {
    verdict,
    expectedType: expected,
    detectedType: det.detected,
    confidence: det.confidence,
    reason: `mismatch: atteso "${expected}", rilevato "${det.detected}" — ${det.why}`,
  };
}
