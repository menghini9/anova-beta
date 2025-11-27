// ⬇️ BLOCCO MEMORIA 3.0 — Memoria utente persistente (ANOVA β)
// Path: /src/lib/orchestrator/memory/userMemory.ts

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Domain, Intent, ProviderId } from "../types";

// 🧠 Struttura base della memoria utente persistente
export interface UserMemory {
  prefs: {
    // Preferenze di tono globale
    tone?: Intent["tone"]; // "concise" | "neutral" | "rich"

    // Livello di dettaglio globale
    detail?: "low" | "medium" | "high";

    // Provider preferiti per dominio (es. per "code" usare più OpenAI + Claude)
    preferProviders?: Partial<Record<Domain, ProviderId[]>>;
  };

  // Correzioni esplicite dell’utente (feedback testuale)
  corrections: string[];

  // Conteggio like / risposte apprezzate
  likedCount: number;

  // Ultima volta che abbiamo aggiornato la memoria (timestamp ms)
  lastUpdated: number;
}

// 🧱 Memoria di default — usata se non esiste ancora nulla su Firestore
const DEFAULT_USER_MEMORY: UserMemory = {
  prefs: {
    tone: "neutral",
    detail: "medium",
    preferProviders: {},
  },
  corrections: [],
  likedCount: 0,
  lastUpdated: 0,
};

// 🔑 Path helper: dove salviamo la memoria in Firestore
// 🔧 FIX — Path corretto: usiamo memory_v1 (quello che esiste su Firestore)
function userMemoryDocRef(userId: string) {
  return doc(db, "users", userId, "anova_meta", "memory_v1");
}


// 🧵 Merge profondo molto semplice per oggetti annidati
function deepMergeMemory(base: UserMemory, patch: Partial<UserMemory>): UserMemory {
  const result: UserMemory = {
    ...base,
    ...patch,
    prefs: {
      ...(base.prefs || {}),
      ...(patch.prefs || {}),
      preferProviders: {
        ...(base.prefs?.preferProviders || {}),
        ...(patch.prefs?.preferProviders || {}),
      },
    },
    corrections: patch.corrections ?? base.corrections,
    likedCount: patch.likedCount ?? base.likedCount,
    lastUpdated: patch.lastUpdated ?? base.lastUpdated,
  };

  return result;
}

/* =========================================================
   1) LOAD — Carica la memoria utente da Firestore
   ========================================================= */

export async function loadUserMemory(userId: string): Promise<UserMemory> {
  try {
    const ref = userMemoryDocRef(userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Nessuna memoria salvata → useremo quella di default
      return { ...DEFAULT_USER_MEMORY };
    }

    const data = snap.data() as Partial<UserMemory>;

    // Merge tra default e dati presenti (per gestire versioni future)
    const merged = deepMergeMemory(DEFAULT_USER_MEMORY, data);

    return merged;
  } catch (err) {
    console.error("ANOVA β — Errore loadUserMemory:", err);
    // In caso di problemi, non blocchiamo l’orchestratore: usiamo default
    return { ...DEFAULT_USER_MEMORY };
  }
}

/* =========================================================
   2) SAVE — Aggiorna / persiste la memoria utente
   ========================================================= */

export async function saveUserMemory(
  userId: string,
  patch: Partial<UserMemory>
): Promise<UserMemory> {
  try {
    const existing = await loadUserMemory(userId);

    const next: UserMemory = deepMergeMemory(existing, {
      ...patch,
      lastUpdated: Date.now(),
    });

    const ref = userMemoryDocRef(userId);
    await setDoc(ref, next, { merge: true });

    return next;
  } catch (err) {
    console.error("ANOVA β — Errore saveUserMemory:", err);
    // Ritorniamo comunque qualcosa di sensato
    return deepMergeMemory(DEFAULT_USER_MEMORY, patch as any);
  }
}

/* =========================================================
   3) APPLY — Applica la memoria a Intent + AutoPrompt
   ========================================================= */

// 🔧 Applica preferenze di memoria all'Intent
export function applyMemoryToIntent(intent: Intent, memory?: UserMemory): Intent {
  if (!memory) return intent;

  let tone = intent.tone;
  let complexity = intent.complexity;

  // 1) Tono preferito
  if (memory.prefs.tone) {
    tone = memory.prefs.tone;
  }

  // 2) Dettaglio preferito → influisce sulla complessità richiesta
  if (memory.prefs.detail === "low") {
    complexity = intent.complexity === "high" ? "medium" : "low";
  } else if (memory.prefs.detail === "high") {
    complexity = intent.complexity === "low" ? "medium" : "high";
  }

  return {
    ...intent,
    tone,
    complexity,
  };
}

/**
 * Applica preferenze utente al routing dei provider.
 * Ritorna un array di provider suggeriti per il dominio richiesto.
 */
export function getPreferredProvidersForDomain(
  domain: Domain,
  memory?: UserMemory
): ProviderId[] | null {
  if (!memory?.prefs?.preferProviders) return null;

  const list = memory.prefs.preferProviders[domain];
  if (!list || list.length === 0) return null;

  return list;
}

/**
 * Registra un "like" dell'utente a una risposta buona.
 * (Da usare quando implementeremo il tasto 👍 nella UI.)
 */
export async function registerUserLike(userId: string): Promise<UserMemory> {
  try {
    const current = await loadUserMemory(userId);
    const next: UserMemory = {
      ...current,
      likedCount: (current.likedCount || 0) + 1,
      lastUpdated: Date.now(),
    };

    const ref = userMemoryDocRef(userId);
    await setDoc(ref, next, { merge: true });

    return next;
  } catch (err) {
    console.error("ANOVA β — Errore registerUserLike:", err);
    return loadUserMemory(userId);
  }
}

// ⬆️ FINE BLOCCO MEMORIA 3.0 — Memoria utente persistente (ANOVA β)
/* =========================================================
   4) MERGE SESSION → USER MEMORY
   ========================================================= */

export async function mergeSessionIntoUserMemory(
  userId: string,
  sessionMemory: any
): Promise<UserMemory> {
  try {
    // 1️⃣ Carico la memoria utente già presente su Firestore
    const existing = await loadUserMemory(userId);

    // 2️⃣ Estraggo preferenze "effettive" dalla sessionMemory
    const detail = sessionMemory?.preferences?.detail;
    const tone = sessionMemory?.preferences?.tone;

    // 3️⃣ Creo il patch da salvare
    const patch: Partial<UserMemory> = {
      prefs: {
        ...existing.prefs,
        detail: detail ?? existing.prefs.detail,
        tone: tone ?? existing.prefs.tone,
      },

      corrections: [
        ...(existing.corrections ?? []),
        ...(sessionMemory?.corrections ?? []),
      ],

      likedCount: existing.likedCount,
      lastUpdated: Date.now(),
    };

    // 4️⃣ Salvo tutto su Firestore (merge = true)
    const next = await saveUserMemory(userId, patch);

    return next;
  } catch (err) {
    console.error("ANOVA β — Errore mergeSessionIntoUserMemory:", err);
    return await loadUserMemory(userId); // fallback sicuro
  }
}

