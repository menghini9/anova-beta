// ⬇️ BLOCCO MEMORIA 2.0 — Mini-Memory di Sessione (ANOVA β)
// Path: /src/lib/orchestrator/memory/sessionMemory.ts

export interface SessionMemory {
  goals: string[];                // Obiettivi dichiarati dall'utente
  preferences: {
    tone?: string;                // Stile risposte preferito
    detail?: "low" | "medium" | "high";
  };
  corrections: string[];          // Feedback: "non fare più così", "preferisco X"
  domainHistory: string[];        // Storico domini (code, strategy, etc.)
  lastPrompts: string[];          // Ultimi prompt utente (max 3)
}

// 🧩 Stato globale in-memory per la sessione corrente
let MEMORY: SessionMemory = {
  goals: [],
  preferences: {},
  corrections: [],
  domainHistory: [],
  lastPrompts: [],
};

// 🧼 Reset totale (cambia sessione)
export function resetSessionMemory() {
  MEMORY = {
    goals: [],
    preferences: {},
    corrections: [],
    domainHistory: [],
    lastPrompts: [],
  };
}

// 🧠 Aggiorna la memoria ad ogni messaggio utente
export function updateSessionMemory(prompt: string, domain: string) {
  const lower = prompt.toLowerCase();

  // 1) Aggiorna storico domini
  if (!MEMORY.domainHistory.includes(domain)) {
    MEMORY.domainHistory.push(domain);
  }

  // 2) Aggiorna ultimi prompt (max 3)
  MEMORY.lastPrompts.push(prompt);
  if (MEMORY.lastPrompts.length > 3) {
    MEMORY.lastPrompts.shift();
  }

  // 3) Estrai obiettivi espliciti
  const goalHints = ["voglio", "obiettivo", "devo", "serve che", "mi serve"];
  if (goalHints.some((k) => lower.includes(k))) {
    MEMORY.goals.push(prompt);
  }

  // 4) Estrai preferenze
  if (lower.includes("breve")) MEMORY.preferences.detail = "low";
  if (lower.includes("dettagliato") || lower.includes("step")) MEMORY.preferences.detail = "high";

  if (lower.includes("tono formale")) MEMORY.preferences.tone = "formal";
  if (lower.includes("tono semplice")) MEMORY.preferences.tone = "simple";

  // 5) Estrai correzioni esplicite
  const correctionHints = ["non fare", "non usare", "preferisco", "smetti di"];
  if (correctionHints.some((k) => lower.includes(k))) {
    MEMORY.corrections.push(prompt);
  }
}

// 🧾 Getter pubblico
export function getSessionMemory(): SessionMemory {
  return MEMORY;
}

// ⬆️ FINE BLOCCO MEMORIA 2.0
