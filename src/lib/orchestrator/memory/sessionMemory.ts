// ⬇️ BLOCCO MEMORIA 3.0 — Memoria Interna Adattiva (ANOVA β)
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
  goals: string[]; // Obiettivi dichiarati dall'utente (per testo intero)
  preferences: {
    // Preferenze "effettive" dedotte dalla sessione
    tone?: "concise" | "neutral" | "rich";
    detail?: "low" | "medium" | "high";

    // Statistiche interne di apprendimento (non necessariamente mostrate in UI)
    stats: PreferenceStats;
  };
  corrections: string[]; // Feedback esplicito: "non fare più così", "preferisco X"
  domainHistory: string[]; // Storico domini (code, strategy, etc.)
  lastPrompts: string[]; // Ultimi prompt utente (max 3)
  messageCount: number; // Numero di messaggi visti in questa sessione
  avgPromptLength: number; // Lunghezza media dei prompt (per capire tuo stile)
}

// 🔧 Configurazione base per la memoria
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

// 🧩 Stato globale in-memory per la sessione corrente
let MEMORY: SessionMemory = structuredClone(INITIAL_MEMORY);

// 🧮 Helper interni
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

function reinforceDetail(
  stats: PreferenceStats,
  key: "low" | "medium" | "high",
  amount = 0.25
): PreferenceStats {
  const next = { ...stats, detailWeights: { ...stats.detailWeights } };
  next.detailWeights[key] = clamp01(next.detailWeights[key] + amount);
  return next;
}

function reinforceTone(
  stats: PreferenceStats,
  key: "concise" | "neutral" | "rich",
  amount = 0.25
): PreferenceStats {
  const next = { ...stats, toneWeights: { ...stats.toneWeights } };
  next.toneWeights[key] = clamp01(next.toneWeights[key] + amount);
  return next;
}

function pickMaxKey<T extends Record<string, number>>(
  obj: T
): keyof T | undefined {
  const entries = Object.entries(obj) as [keyof T, number][];
  if (entries.length === 0) return undefined;
  let bestKey = entries[0][0];
  let bestVal = entries[0][1];

  for (const [k, v] of entries) {
    if (v > bestVal) {
      bestKey = k;
      bestVal = v;
    }
  }

  // Soglia minima: se tutto è troppo neutro, non imponiamo una preferenza rigida
  if (bestVal < 0.4) return undefined;
  return bestKey;
}

// 🧼 Reset totale (cambia sessione)
export function resetSessionMemory() {
  MEMORY = structuredClone(INITIAL_MEMORY);
}

// 🧠 Aggiorna la memoria ad ogni messaggio utente
export function updateSessionMemory(prompt: string, domain: string) {
  const lower = prompt.toLowerCase();
  const len = prompt.length || 0;

  // 0) Inizializza se manca (difesa da edge-case)
  if (!MEMORY.preferences || !MEMORY.preferences.stats) {
    MEMORY.preferences = {
      stats: { ...INITIAL_STATS },
    };
  }

  // Decadimento progressivo delle preferenze (se non ripeti un pattern, perde peso)
  MEMORY.preferences.stats = decayStats(MEMORY.preferences.stats);

  // 1) Aggiorna contatore messaggi e lunghezza media
  MEMORY.messageCount += 1;
  MEMORY.avgPromptLength =
    MEMORY.avgPromptLength === 0
      ? len
      : Math.round(
          (MEMORY.avgPromptLength * (MEMORY.messageCount - 1) + len) /
            MEMORY.messageCount
        );

  // 2) Aggiorna storico domini (senza duplicati banali)
  if (domain && !MEMORY.domainHistory.includes(domain)) {
    MEMORY.domainHistory.push(domain);
  }

  // 3) Aggiorna ultimi prompt (max 3)
  MEMORY.lastPrompts.push(prompt);
  if (MEMORY.lastPrompts.length > 3) {
    MEMORY.lastPrompts.shift();
  }

  // 4) Estrai obiettivi espliciti (manteniamo testo intero per ora)
  const goalHints = ["voglio", "obiettivo", "devo", "serve che", "mi serve"];
  if (goalHints.some((k) => lower.includes(k))) {
    MEMORY.goals.push(prompt);
  }

  // 5) Preferenze di dettaglio esplicite + implicite
  let stats = MEMORY.preferences.stats;

  // Esplicite
  if (
    lower.includes("breve") ||
    lower.includes("sintetico") ||
    lower.includes("riassunto")
  ) {
    stats = reinforceDetail(stats, "low", 0.35);
  }
  if (
    lower.includes("dettagliato") ||
    lower.includes("step by step") ||
    lower.includes("analisi profonda") ||
    lower.includes("molto preciso")
  ) {
    stats = reinforceDetail(stats, "high", 0.35);
  }

  // Implicite: messaggi molto lunghi → tendenza a tollerare risposte più ricche
  if (len > 400) {
    stats = reinforceDetail(stats, "high", 0.1);
  } else if (len < 120) {
    stats = reinforceDetail(stats, "low", 0.1);
  }

  // 6) Preferenze di tono esplicite
  if (
    lower.includes("tono semplice") ||
    lower.includes("spiegami facile") ||
    lower.includes("spiegami come a un bambino")
  ) {
    stats = reinforceTone(stats, "concise", 0.4);
  }

  if (lower.includes("tono formale") || lower.includes("in modo professionale")) {
    stats = reinforceTone(stats, "neutral", 0.4);
  }

  if (
    lower.includes("tono poetico") ||
    lower.includes("più colorato") ||
    lower.includes("più narrativo") ||
    lower.includes("fammi un discorso") ||
    lower.includes("fammi un testo lungo")
  ) {
    stats = reinforceTone(stats, "rich", 0.4);
  }

  // 7) Estrai correzioni esplicite
  const correctionHints = ["non fare", "non usare", "preferisco", "smetti di", "non voglio"];
  if (correctionHints.some((k) => lower.includes(k))) {
    MEMORY.corrections.push(prompt);

    // Micro-regole sulle correzioni più frequenti
    if (lower.includes("troppo lungo")) {
      stats = reinforceDetail(stats, "low", 0.4);
    }
    if (lower.includes("troppo corto")) {
      stats = reinforceDetail(stats, "high", 0.3);
    }
    if (lower.includes("troppo tecnico")) {
      stats = reinforceTone(stats, "concise", 0.3);
    }
    if (lower.includes("troppo semplice")) {
      stats = reinforceTone(stats, "rich", 0.3);
    }
  }

  // 8) Salva stats aggiornate
  MEMORY.preferences.stats = stats;

  // 9) Calcolo preferenze "effettive" da esporre al resto del sistema
  const effectiveDetail = pickMaxKey(stats.detailWeights);
  const effectiveTone = pickMaxKey(stats.toneWeights);

  MEMORY.preferences.detail = effectiveDetail ?? MEMORY.preferences.detail;
  MEMORY.preferences.tone =
    (effectiveTone as SessionMemory["preferences"]["tone"]) ??
    MEMORY.preferences.tone;
}

// 🧾 Getter pubblico
export function getSessionMemory(): SessionMemory {
  return MEMORY;
}

// ⬆️ FINE BLOCCO MEMORIA 3.0 — Memoria Interna Adattiva
