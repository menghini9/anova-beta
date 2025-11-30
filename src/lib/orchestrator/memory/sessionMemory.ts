// ⬇️ BLOCCO MEMORIA 3.1 — Memoria Interna Adattiva (ANOVA β V12-ready)
// Path: /src/lib/orchestrator/memory/sessionMemory.ts

export interface PreferenceStats {
  detailWeights: {
    low: number;
    medium: number;
    high: number;
  };
  toneWeights: {
    concise: number;
    neutral: number;
    rich: number;
  };
}

export interface SessionMemory {
  goals: string[];
  preferences: {
    tone?: "concise" | "neutral" | "rich";
    detail?: "low" | "medium" | "high";

    stats: PreferenceStats; // usata per segnali leggeri, non più per dedurre preferenze
  };
  corrections: string[];
  domainHistory: string[];
  lastPrompts: string[];
  messageCount: number;
  avgPromptLength: number;
}

// 🔧 Statistiche base (non influiscono più sui gusti dell'utente)
const INITIAL_STATS: PreferenceStats = {
  detailWeights: {
    low: 0.33,
    medium: 0.34,
    high: 0.33,
  },
  toneWeights: {
    concise: 0.34,
    neutral: 0.33,
    rich: 0.33,
  },
};

const INITIAL_MEMORY: SessionMemory = {
  goals: [],
  preferences: {
    stats: { ...INITIAL_STATS },
  },
  corrections: [],
  domainHistory: [],
  lastPrompts: [],
  messageCount: 0,
  avgPromptLength: 0,
};

// Stato globale
let MEMORY: SessionMemory = structuredClone(INITIAL_MEMORY);

// Helper di sicurezza
function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function decayStats(stats: PreferenceStats, factor = 0.93): PreferenceStats {
  return {
    detailWeights: {
      low: clamp01(stats.detailWeights.low * factor),
      medium: clamp01(stats.detailWeights.medium * factor),
      high: clamp01(stats.detailWeights.high * factor),
    },
    toneWeights: {
      concise: clamp01(stats.toneWeights.concise * factor),
      neutral: clamp01(stats.toneWeights.neutral * factor),
      rich: clamp01(stats.toneWeights.rich * factor),
    },
  };
}
// ⬇️ BLOCCO 3.2 — Analisi Testuale Preferenze (V12 Lexicon Bridge)
// NON modifica la memoria — restituisce solo segnali
import { analyzeTextPreferences } from "@/lib/orchestrator/preference-engine/preferencesLexicon";
// ⬆️ FINE BLOCCO 3.2

// 🧼 Reset totale (cambi sessione)
export function resetSessionMemory() {
  MEMORY = structuredClone(INITIAL_MEMORY);
}

// 🧠 Aggiorna la memoria (senza più dedurre preferenze da keyword)
export function updateSessionMemory(prompt: string, domain: string) {
  const lower = prompt.toLowerCase();
  const len = prompt.length || 0;
let stats = MEMORY.preferences.stats;

  // Inizializzazione difensiva
  if (!MEMORY.preferences || !MEMORY.preferences.stats) {
    MEMORY.preferences = {
      stats: { ...INITIAL_STATS },
    };
  }

  // Decadimento leggero delle stats (non influisce più sulle preferenze)
  MEMORY.preferences.stats = decayStats(MEMORY.preferences.stats);

  // 1️⃣ Contatore messaggi + lunghezza media
  MEMORY.messageCount += 1;
  MEMORY.avgPromptLength =
    MEMORY.avgPromptLength === 0
      ? len
      : Math.round(
          (MEMORY.avgPromptLength * (MEMORY.messageCount - 1) + len) /
            MEMORY.messageCount
        );

  // 2️⃣ Storico domini
  if (domain && !MEMORY.domainHistory.includes(domain)) {
    MEMORY.domainHistory.push(domain);
  }

  // 3️⃣ Ultimi prompt (max 3)
  MEMORY.lastPrompts.push(prompt);
  if (MEMORY.lastPrompts.length > 3) {
    MEMORY.lastPrompts.shift();
  }

  // 4️⃣ Obiettivi espliciti
  const goalHints = ["voglio", "obiettivo", "devo", "serve che", "mi serve"];
  if (goalHints.some((k) => lower.includes(k))) {
    MEMORY.goals.push(prompt);
  }

  // 5️⃣ Correzioni esplicite (non influenzano più detail/tone)
  const correctionHints = ["non fare", "non usare", "preferisco", "smetti di", "non voglio"];
  if (correctionHints.some((k) => lower.includes(k))) {
    MEMORY.corrections.push(prompt);
  }

  // ❗ IMPORTANTE:
  // Da qui in poi NON deduciamo più:
  // - detail (low/medium/high)
  // - tone (concise/neutral/rich)
  //
  // Queste vengono gestite dal VOCABOLARIO V12 tramite "analyzeTextPreferences"
  // e applicate nell'Orchestrator.
}

// Getter
export function getSessionMemory(): SessionMemory {
  return MEMORY;
}

// ⬆️ FINE BLOCCO MEMORIA 3.1 — Versione Pulita per Vocabolario V12
