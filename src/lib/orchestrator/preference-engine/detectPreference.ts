// ⬇️ BLOCCO P1 — Preference Parser Intelligente (V2)
// Path: /src/lib/orchestrator/preference-engine/detectPreference.ts

import { analyzeTextPreferences } from "./preferencesLexicon";

export type DetailLevel = "low" | "medium" | "high";
export type ToneLevel = "concise" | "neutral" | "rich";

export type PreferenceScope = "once" | "persistent" | "contextual";

export interface PreferenceHit {
  detail?: DetailLevel;
  tone?: ToneLevel;
  scope: PreferenceScope;
  domain?: "code" | "strategy" | "creative" | "factual" | "work" | null;
  confidence: "high" | "medium" | "low";
  rawText: string;
}

export interface PreferenceDetectResult {
  preference?: PreferenceHit;
  needsClarification: boolean;
  clarificationQuestion?: string;
}

// 🔎 Helper base
function hasAny(text: string, list: string[]): boolean {
  const lower = text.toLowerCase();
  return list.some((k) => lower.includes(k));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parser intelligente per frasi di preferenza sullo stile delle risposte.
 * - se è SICURO → ritorna preference.confidence = "high"
 * - se è dubbio → confidence "medium"/"low" + needsClarification = true
 * - se non capisce → solo needsClarification = false (nessuna preferenza)
 */
export function detectUserPreferenceStatement(
  text: string
): PreferenceDetectResult {
  const raw = text;
  const t = normalize(text);

  // Se è troppo corto e generico, probabilmente non è stile
  if (t.split(" ").length <= 2 && !hasAny(t, ["risposta", "risposte"])) {
    return { preference: undefined, needsClarification: false };
  }

  // Riferimenti espliciti allo stile/forma/uscita
  const isAboutAnswerStyle = hasAny(t, [
    // generico
    "risposte",
    "risposta",
    "spiegami",
    "spiegazione",
    "spiegazioni",
    "scrivi",
    "scrivimi",
    "scrittura",
    "modo di rispondere",
    "come rispondi",
    "stile",
    "tono",
    "formulazione",
    "testo",
    "testi",
    // output di lavoro
    "prompt",
    "prompting",
    "codice",
    "funzione",
    "snippet",
    "commenti",
    "documentazione",
    "doc",
    "report",
    "email",
    "mail",
    "messaggio",
    "messaggi",
    "presentazione",
  ]);

  // Lexicon di base (V12) — aggettivi semplici
  const lex = analyzeTextPreferences(t);
  const lexDetail = lex.detail;
  const lexTone = lex.tone;

  // Scope (persistenza)
  let scope: PreferenceScope = "once";
  let domain: PreferenceHit["domain"] = null; // <--- FIX
  if (
    hasAny(t, [
      "da ora in poi",
      "d ora in poi",
      "d'ora in poi",
      "in generale",
      "sempre",
      "ogni volta",
      "normalmente",
      "di solito",
      "di default",
    ])
  ) {
    scope = "persistent";
  } else if (
    hasAny(t, [
      "per questa risposta",
      "per questa volta",
      "per ora",
      "per adesso",
      "in questo caso",
    ])
  ) {
    scope = "once";
  } else if (
    hasAny(t, [
      "quando lavoriamo",
      "quando facciamo codice",
      "quando scrivi codice",
      "quando generi codice",
      "sui prompt",
      "nei prompt",
      "quando lavoro",
      "nei report",
      "nelle email",
    ])
  ) {
    scope = "contextual";
  }

  // Dominio (contestuale) — opzionale
if (
  hasAny(t, [
    "codice",
    "scrivi codice",
    "quando scrivi codice",
    "snippet",
    "solo codice",
    "solo il codice",
    "funzione",
    "classe",
    "script",
    "output codice",
    "codice pulito",
    "codice secco",
    "senza commenti",
    "no commenti",
    "no spiegazioni nel codice",
  ])
) {
  domain = "code";
}
 else if (hasAny(t, ["strategia", "business", "azienda", "piano", "modello"])) {
    domain = "strategy";
  } else if (hasAny(t, ["storia", "racconto", "romanzo", "narrazione"])) {
    domain = "creative";
  } else if (hasAny(t, ["dati", "statistica", "fonti", "numeri", "legge"])) {
    domain = "factual";
  } else if (
    hasAny(t, [
      "riunione",
      "meeting",
      "report",
      "email",
      "mail",
      "presentazione",
      "verbale",
      "to do",
      "checklist",
      "lista attività",
    ])
  ) {
    domain = "work";
  }

  // Negazioni / comparativi
  const hasNegation = hasAny(t, ["non ", "non troppo", "evita", "senza"]);
  const moreWords = ["più", "maggiormente", "ancora più"];
  const lessWords = ["meno", "un po meno", "un po' meno"];

  const hasMore = hasAny(t, moreWords);
  const hasLess = hasAny(t, lessWords);

  // Flag tipo "troppo lungo / troppo breve"
  const tooLong = hasAny(t, ["troppo lungo", "troppo lunga", "troppo prolisso"]);
  const tooShort = hasAny(t, [
    "troppo corta",
    "troppo corto",
    "troppo breve",
    "troppo sintetico",
  ]);

  // Traduzione “manuale” aggiuntiva su frasi comuni
  let ruleDetail: DetailLevel | undefined;
  let ruleTone: ToneLevel | undefined;

  // *** DETTAGLIO ESPRESSO CHIARO ***

  // corto / sintetico
  if (
    hasAny(t, [
      "risposte corte",
      "risposte corti",
      "risposte brevi",
      "risposte sintetiche",
      "più corte",
      "più brevi",
      "più sintetiche",
      "stringe",
      "stringila",
      "riassumila",
      "fammi un riassunto",
      "fammi un riassuntino",
      "fammi una sintesi",
      "riassunto breve",
      "sintesi breve",
      "poche righe",
      "poche parole",
      "riduci il testo",
      "accorcia",
    ])
  ) {
    ruleDetail = "low";
  }

  // lungo / dettagliato
  if (
    hasAny(t, [
      "risposte lunghe",
      "risposte dettagliate",
      "risposte molto dettagliate",
      "risposte super dettagliate",
      "spiegazione lunga",
      "spiegazione dettagliata",
      "spiegami nel dettaglio",
      "più dettagli possibile",
      "più approfondito",
      "più approfondita",
      "analisi completa",
      "analisi dettagliata",
      "fammi un discorso",
      "fammi un discorsone",
      "fammi un discorsetto lungo",
      "spiegazione passo passo",
      "step by step molto dettagliato",
      "istruzioni dettagliate",
      "procedura completa",
      "guida completa",
      "documentazione completa",
      "doc completo",
    ])
  ) {
    ruleDetail = "high";
  }

  // via di mezzo
  if (
    hasAny(t, [
      "via di mezzo",
      "né breve né lunga",
      "ne breve ne lunga",
      "non troppo breve",
      "non troppo lunga",
      "spiegazione normale",
      "spiegazione chiara ma non lunghissima",
    ])
  ) {
    ruleDetail = "medium";
  }

  // contesti lavoro/codice → mapping su detail
 // ⬇️ Regola speciale — SOLO CODICE SENZA SPIEGAZIONI
if (
  hasAny(t, [
    "solo codice",
    "solo il codice",
    "codice secco",
    "codice senza spiegazioni",
    "solo snippet",
    "solo snippet senza spiegazioni",
    "niente testo, solo codice",
    "dammi solo il codice",
    "codice puro",
    "scrivi il codice senza spiegazioni",
    "quando scrivi codice dammi solo il codice",
  ])
) {
  ruleDetail = "low";
  ruleTone = "concise";
  domain = "code";
  scope = "contextual";
}


  if (
    hasAny(t, [
      "codice commentato",
      "codice molto commentato",
      "commenta riga per riga",
      "commentato riga per riga",
      "spiegami il codice riga per riga",
      "doc per il codice",
      "documentazione per il codice",
      "prompt molto dettagliato",
      "prompt dettagliato",
      "prompt lungo",
    ])
  ) {
    ruleDetail = "high";
  }

  if (
    hasAny(t, [
      "checklist operativa",
      "to do operativo",
      "lista puntata",
      "elenco puntato",
      "schema operativo",
    ])
  ) {
    // schemi: contenuto forte ma forma sintetica
    ruleDetail = ruleDetail ?? "medium";
    ruleTone = ruleTone ?? "concise";
  }

  // Dettaglio tramite comparative / negazioni
  if (tooLong) {
    // stava su high → scendi
    ruleDetail = "medium";
  }
  if (tooShort) {
    // stava su low → sali
    ruleDetail = "medium";
  }

  if (hasLess && hasAny(t, ["lungo", "lunga", "lunghi", "dettagliato"])) {
    ruleDetail = "medium";
  }
  if (hasMore && hasAny(t, ["lungo", "lunga", "approfondito", "dettagliato"])) {
    ruleDetail = "high";
  }
  if (hasLess && hasAny(t, ["breve", "corto", "sintetico"])) {
    ruleDetail = "low";
  }

  // *** TONO ESPRESSO ***

  if (
    hasAny(t, [
      "tono semplice",
      "più semplice",
      "spiegami semplice",
      "spiegami facile",
      "come se avessi 10 anni",
      "come ad un bambino",
      "terra terra",
      "alla buona",
      "spiegazione base",
      "senza troppi tecnicismi",
      "linguaggio semplice",
      "parole semplici",
      "diretto",
      "diretta",
      "schietto",
      "schietta",
      "no fronzoli",
      "senza fronzoli",
      "senza giri di parole",
      "vai al punto",
    ])
  ) {
    ruleTone = "concise";
  }

  if (
    hasAny(t, [
      "tono neutro",
      "tono normale",
      "tono standard",
      "tono professionale",
      "professionale ma non troppo",
      "formale ma non troppo",
      "serio ma non rigido",
      "serio ma chiaro",
      "istituzionale",
      "oggettivo",
      "chiaro e professionale",
    ])
  ) {
    ruleTone = "neutral";
  }

  if (
    hasAny(t, [
      "poetico",
      "più poetico",
      "narrativo",
      "più narrativo",
      "più colorato",
      "più coinvolgente",
      "ispirazionale",
      "motivazionale",
      "stile discorso motivazionale",
      "fammi un discorso motivazionale",
      "stile storia",
      "raccontala come una storia",
      "stile romanzo",
      "stile epico",
      "stile cinematografico",
      "stile racconto",
    ])
  ) {
    ruleTone = "rich";
  }

  // Negazioni sul tono
  if (hasNegation && hasAny(t, ["troppo poetico", "troppo narrativo"])) {
    ruleTone = "neutral";
  }
  if (hasNegation && hasAny(t, ["troppo freddo", "troppo tecnico"])) {
    ruleTone = "rich";
  }
  if (hasNegation && hasAny(t, ["troppo prolisso", "troppo lungo"])) {
    ruleDetail = "medium";
  }

  // Fusione lexicon + regole
  const finalDetail: DetailLevel | undefined =
    (ruleDetail as DetailLevel | undefined) ||
    (lexDetail as DetailLevel | undefined);

  const finalTone: ToneLevel | undefined =
    (ruleTone as ToneLevel | undefined) || (lexTone as ToneLevel | undefined);

  // Caso 1: non abbiamo né detail né tone → niente preferenza
  if (!finalDetail && !finalTone) {
    // Ma se il testo sembra riguardare lo stile, potremmo chiedere un chiarimento generico
    if (isAboutAnswerStyle) {
      return {
        preference: undefined,
        needsClarification: true,
        clarificationQuestion:
          "Ho capito che stai parlando dello **stile delle risposte**, ma non è chiaro se le vuoi più **corte / via di mezzo / lunghe** o con un tono più **semplice / neutro / narrativo**. Scrivimelo in modo esplicito.",
      };
    }

    return {
      preference: undefined,
      needsClarification: false,
    };
  }

  // Valutazione confidence
  let confidence: PreferenceHit["confidence"] = "high";

  const hasShortWords = hasAny(t, [
    "corte",
    "corti",
    "brevi",
    "breve",
    "sintetiche",
    "sintetica",
    "corto",
  ]);
  const hasLongWords = hasAny(t, ["lunghe", "lunghi", "molto dettagliate", "lunghissime"]);

  if (hasShortWords && hasLongWords) {
    confidence = "low";
  } else if (hasNegation || hasMore || hasLess || tooLong || tooShort) {
    confidence = "medium";
  }

  // Se parla di stile risposte ma la frase è molto vaga
  if (isAboutAnswerStyle && !hasShortWords && !hasLongWords && !ruleTone && !ruleDetail) {
    confidence = "low";
  }

  // Se non è sicuro → chiediamo chiarimenti specifici
  let needsClarification = false;
  let clarificationQuestion: string | undefined;

  if (confidence !== "high") {
    needsClarification = true;

    if (finalDetail && !finalTone) {
      clarificationQuestion =
        "Stai parlando dello **stile delle risposte**, ma la frase è un po' ambigua. Vuoi risposte più **corte**, più **lunghe** o una **via di mezzo**? Scrivilo chiaramente, così posso impostarlo senza dubbi.";
    } else if (!finalDetail && finalTone) {
      clarificationQuestion =
        "Mi sembra che tu stia parlando del **tono** (semplice, neutro, narrativo), ma non è chiarissimo. Preferisci un tono **semplice e diretto**, **neutro/professionale** oppure **ricco e narrativo**?";
    } else {
      clarificationQuestion =
        "Ho capito che vuoi cambiare lo **stile delle risposte**, ma non è chiaro in che direzione. Dimmi esplicitamente se preferisci risposte **corte / via di mezzo / lunghe** e un tono **semplice / neutro / narrativo**.";
    }
  }

  const preference: PreferenceHit = {
    detail: finalDetail,
    tone: finalTone,
    scope,
    domain,
    confidence,
    rawText: raw,
  };
// ⬇️ Regola speciale — SOLO CODICE SENZA SPIEGAZIONI (V12 COMPATIBILE)
if (
  hasAny(t, [
    "solo codice",
    "solo il codice",
    "codice secco",
    "codice senza spiegazioni",
    "solo snippet",
    "solo snippet senza spiegazioni",
    "niente testo solo codice",
    "dammi solo il codice",
    "codice puro",
    "scrivi il codice senza spiegazioni",
    "quando scrivi codice dammi solo il codice"
  ])
) {
  ruleDetail = "low";         // risposte corte e senza testo
  ruleTone = "concise";       // tono semplice e diretto

return {
  preference: {
    detail: "low",
    tone: "concise",
    domain: "code",
    scope: "contextual",
    confidence: "high",
    rawText: raw
  },
  needsClarification: false
};

}

  return {
    preference,
    needsClarification,
    clarificationQuestion,
  };
}

// ⬆️ FINE BLOCCO P1 — Preference Parser Intelligente (V2)
