// ⬇️ BLOCCO LEXICON 2.0 — Vocabolario preferenze utente (ANOVA β)
// Path: /src/lib/orchestrator/preference-engine/preferencesLexicon.ts

export type DetailBucket = "low" | "medium" | "high";
export type ToneBucket = "concise" | "neutral" | "rich";

// 🔧 Normalizzazione semplice
function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,;:!?]/g, "")
    .replace(/'/g, " ")
    .trim();
}

// 🔧 Rimozione diminutivi tipici italiani (molto semplice, ma efficace)
function stripDiminutives(word: string): string[] {
  const w = normalizeWord(word);

  // se è corto, non tocchiamo
  if (w.length <= 5) return [w];

  const candidates = new Set<string>();
  candidates.add(w);

  const suffixes = [
    "ino",
    "ina",
    "ini",
    "ine",
    "etto",
    "etta",
    "etti",
    "ette",
    "uccio",
    "uccia",
    "ucci",
    "ucce",
    "ello",
    "ella",
    "elli",
    "elle",
  ];

  for (const suf of suffixes) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) {
      candidates.add(w.slice(0, -suf.length));
    }
  }

  return Array.from(candidates);
}

/**
 * DETAIL_MAP
 *  - low    → l’utente chiede cose brevi / sintetiche
 *  - medium → via di mezzo / normale
 *  - high   → l’utente chiede cose lunghe / approfondite
 */
export const DETAIL_MAP: Record<DetailBucket, string[]> = {
  low: [
    // Sinonimi di "breve", "corto", "sintetico"
    "breve",
    "brevi",
    "brevissimo",
    "brevissima",
    "corto",
    "corti",
    "cortissimo",
    "cortissima",
    "sintetico",
    "sintetica",
    "sintetici",
    "sintetiche",
    "stringato",
    "stringata",
    "stringate",
    "riassunto",
    "riassuntivo",
    "riassuntiva",
    "riassuntive",
    "sintesi",
    "sintetico al massimo",
    "veloce",
    "rapido",
    "rapidi",
    "compatto",
    "compatta",
    "compatti",
    "accennato",
    "accennata",
    "poche parole",
    "poche righe",
    "no discorsi lunghi",
    "no testo lungo",
    "non troppo lungo",
    "brevemente",
    "in breve",
    "solo l essenziale",
    "solo il succo",
    "essenziale",
    "essenziali",
    "solo punti chiave",
    "solo key point",
    "high level",
    "solo bullet",
    "solo elenco",
    "minimo indispensabile",
    "super sintetico",
  ],
  medium: [
    // Via di mezzo: normale, bilanciato
    "equilibrato",
    "equilibrata",
    "equilibrate",
    "normale",
    "normali",
    "standard",
    "bilanciato",
    "bilanciata",
    "bilanciate",
    "non troppo breve",
    "non troppo lungo",
    "via di mezzo",
    "giusta via di mezzo",
    "spiegazione normale",
    "spiegazione chiara",
    "spiegazione semplice",
    "spiegami bene ma non troppo lungo",
    "né breve né lungo",
    "ne breve ne lungo",
    "leggibile",
    "composto",
    "moderato",
    "medio",
    "medio dettagliato",
  ],
  high: [
    // Sinonimi di "lungo", "dettagliato", "approfondito"
    "lungo",
    "lunghi",
    "lunghissimo",
    "lunghissima",
    "molto lungo",
    "molto lunghi",
    "testo lungo",
    "testo molto lungo",
    "ampio",
    "ampia",
    "ampie",
    "esteso",
    "estesa",
    "estese",
    "approfondito",
    "approfondita",
    "approfondite",
    "analitico",
    "analitica",
    "analitiche",
    "dettagliato",
    "dettagliata",
    "dettagliate",
    "con molti dettagli",
    "pieno di dettagli",
    "più dettagli possibile",
    "più dettagliati possibile",
    "raccontami bene",
    "spiegami molto bene",
    "spiegami nel dettaglio",
    "analisi approfondita",
    "analisi molto approfondita",
    "analisi completa",
    "spiegazione completa",
    "spiegazione lunga",
    "spiegazione molto lunga",
    "voglio una spiegazione lunga",
    "fammi un testo lungo",
    "fammi un testo molto lungo",
    "fammi un discorso lungo",
    "discorsone",
    "mega spiegazione",
    "vai a fondo",
    "vai più a fondo",
    "super approfondito",
    "documentazione completa",
    "doc completo",
    "guida completa",
    "manuale completo",
  ],
};

/**
 * TONE_MAP
 *  - concise → semplice, diretto
 *  - neutral → professionale / standard
 *  - rich    → narrativo, colorato, poetico
 */
export const TONE_MAP: Record<ToneBucket, string[]> = {
  concise: [
    "semplice",
    "semplice semplice",
    "molto semplice",
    "facile",
    "facile da capire",
    "spiegami facile",
    "spiegami come a un bambino",
    "come se avessi 10 anni",
    "alla buona",
    "terra terra",
    "senza termini tecnici",
    "poco tecnico",
    "poco formale",
    "diretto",
    "diretta",
    "dirette",
    "schietto",
    "schietta",
    "schiette",
    "chiaro e diretto",
    "chiara e diretta",
    "linguaggio semplice",
    "linguaggio base",
    "parole semplici",
    "senza giri di parole",
    "no fronzoli",
    "niente fronzoli",
    "vai al punto",
    "dritto al punto",
    "secco",
    "secca",
    "asciutto",
    "asciutta",
    "minimale",
    "pratico",
    "pratica",
  ],
  neutral: [
    "neutro",
    "neutra",
    "neutre",
    "tono neutro",
    "tono normale",
    "tono standard",
    "professionale",
    "in modo professionale",
    "formale ma non troppo",
    "serio",
    "seria",
    "sobrio",
    "sobria",
    "pulito",
    "pulita",
    "istituzionale",
    "oggettivo",
    "oggettiva",
    "equilibrato",
    "equilibrata",
    "equilibrate",
    "chiaro e professionale",
    "chiaro ma non troppo informale",
    "business",
    "business oriented",
    "corporate",
  ],
  rich: [
    "poetico",
    "poetica",
    "poetiche",
    "più poetico",
    "più poetica",
    "più narrativo",
    "più narrativa",
    "narrativo",
    "narrativa",
    "colorato",
    "colorata",
    "colorate",
    "coinvolgente",
    "emotivo",
    "emotiva",
    "d impatto",
    "più d impatto",
    "ispirazionale",
    "motivazionale",
    "discorsivo",
    "discorso lungo",
    "fammi un discorso",
    "fammi un discorso motivazionale",
    "fammi un discorso ispirazionale",
    "fammi un testo ricco",
    "fammi un testo narrativo",
    "raccontami una storia",
    "raccontala come una storia",
    "stile romanzo",
    "stile racconto",
    "stile epico",
    "stile cinematografico",
    "storytelling",
    "epico",
    "epica",
  ],
};

// ⬆️ FINE BLOCCO LEXICON 2.0 — Vocabolario preferenze utente

// ⬇️ Funzione per mappare automaticamente una parola → livello di dettaglio
export function mapDetailWord(word: string): DetailBucket | null {
  const normalized = normalizeWord(word);
  const candidates = stripDiminutives(normalized);

  for (const cand of candidates) {
    for (const bucket of ["low", "medium", "high"] as const) {
      if (DETAIL_MAP[bucket].includes(cand)) {
        return bucket;
      }
    }
  }

  return null;
}

// ⬇️ Funzione per mappare automaticamente una parola → tono
export function mapToneWord(word: string): ToneBucket | null {
  const normalized = normalizeWord(word);
  const candidates = stripDiminutives(normalized);

  for (const cand of candidates) {
    for (const bucket of ["concise", "neutral", "rich"] as const) {
      if (TONE_MAP[bucket].includes(cand)) {
        return bucket;
      }
    }
  }

  return null;
}

// ⬇️ BLOCCO 3.0 — Analisi Preferenze Testuali (V12+ Lexicon Bridge)

export function analyzeTextPreferences(text: string): {
  detail?: DetailBucket;
  tone?: ToneBucket;
} {
  const words = text
    .toLowerCase()
    .replace(/[.,;:!?]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let detectedDetail: DetailBucket | undefined;
  let detectedTone: ToneBucket | undefined;

  for (const w of words) {
    const d = mapDetailWord(w);
    if (d) detectedDetail = d;

    const t = mapToneWord(w);
    if (t) detectedTone = t;
  }

  return {
    detail: detectedDetail,
    tone: detectedTone,
  };
}

// ⬆️ FINE BLOCCO 3.0 — Analisi Preferenze Testuali (V12+ Lexicon Bridge)

