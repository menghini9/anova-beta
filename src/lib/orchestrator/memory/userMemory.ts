// ⬇️ BLOCCO 14.0 — Memoria Utente Persistente (Firestore, ANOVA β)
// Path: /src/lib/orchestrator/memory/userMemory.ts

import { doc, getDoc, setDoc } from "firebase/firestore"; // <-- Usa lo stesso SDK che usi in firebase.ts
import { db } from "../../firebase"; // <-- Se in firebase.ts l'export NON è "db", cambia questo import.
// es: import { firestore } from "../firebase";

import type { SessionMemory } from "./sessionMemory";
import type { Domain, ProviderId } from "../types";

// 🧠 Preferenze persistenti dell'utente (non per singola sessione)
export interface UserMemoryPrefs {
  detail?: "low" | "medium" | "high";            // livello di dettaglio preferito
  tone?: "concise" | "neutral" | "rich";         // tono preferito
  providerBias?: Partial<Record<Domain, ProviderId>>; // provider preferito per dominio (facoltativo v1)
}

// 📊 Statistiche generali sull'uso
export interface UserMemoryStats {
  messagesSeen: number;
  lastUpdated: number; // timestamp ms
}

// 📦 Struttura principale persistita
export interface UserMemory {
  userId: string;
  prefs: UserMemoryPrefs;
  goals: string[];        // obiettivi ricorrenti consolidati
  corrections: string[];  // correzioni consolidate (ultime N)
  stats: UserMemoryStats;
}

// Default per nuovo utente
const DEFAULT_USER_MEMORY: Omit<UserMemory, "userId"> = {
  prefs: {},
  goals: [],
  corrections: [],
  stats: {
    messagesSeen: 0,
    lastUpdated: 0,
  },
};

// 🔐 Namespace Firestore (puoi cambiarlo se hai già una struttura utenti)
const USERS_COLLECTION = "users";
const META_SUBCOLLECTION = "anova_meta";
const MEMORY_DOC_ID = "memory_v1";

// 🧩 Helper per deduplicare e limitare dimensione array
function mergeLimitedUnique(listA: string[], listB: string[], max = 30): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  // manteniamo prima gli elementi vecchi (stabilità), poi i nuovi
  for (const item of [...listA, ...listB]) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
    if (merged.length >= max) break;
  }

  return merged;
}

// 🔄 Carica la memoria utente da Firestore (o crea default in RAM)
export async function loadUserMemory(userId: string): Promise<UserMemory> {
  try {
    const ref = doc(
      db,
      USERS_COLLECTION,
      userId,
      META_SUBCOLLECTION,
      MEMORY_DOC_ID
    );

    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Utente nuovo: memoria solo locale, nessuna scrittura automatica qui.
      return {
        userId,
        ...DEFAULT_USER_MEMORY,
      };
    }

    const data = snap.data() as Partial<UserMemory>;

    return {
      userId,
      prefs: data.prefs ?? {},
      goals: Array.isArray(data.goals) ? data.goals : [],
      corrections: Array.isArray(data.corrections) ? data.corrections : [],
      stats: data.stats ?? { messagesSeen: 0, lastUpdated: 0 },
    };
  } catch (err) {
    console.error("[ANOVA] loadUserMemory fallita:", err);
    // In caso di errore non blocchiamo la risposta: usiamo default
    return {
      userId,
      ...DEFAULT_USER_MEMORY,
    };
  }
}

// 🔀 Merge tra memoria di sessione e memoria utente persistente
export async function mergeSessionIntoUserMemory(
  userId: string,
  session: SessionMemory
): Promise<void> {
  try {
    const existing = await loadUserMemory(userId);

    const now = Date.now();

    // 1) Preferenze di dettaglio / tono: se la sessione ha una preferenza effettiva, la usiamo come "ultima parola"
    const prefs: UserMemoryPrefs = {
      ...existing.prefs,
    };

    if (session.preferences?.detail) {
      prefs.detail = session.preferences.detail;
    }

    if (session.preferences?.tone) {
      prefs.tone = session.preferences.tone;
    }

    // (ProviderBias lo toccheremo in una fase successiva quando routing e fusion useranno realmente questi dati)

    // 2) Goals consolidati
    const newGoals = Array.isArray(session.goals) ? session.goals : [];
    const goals = mergeLimitedUnique(existing.goals, newGoals, 50);

    // 3) Correzioni consolidate
    const newCorrections = Array.isArray(session.corrections)
      ? session.corrections
      : [];
    const corrections = mergeLimitedUnique(
      existing.corrections,
      newCorrections,
      50
    );

    // 4) Statistiche
    const stats: UserMemoryStats = {
      messagesSeen:
        (existing.stats?.messagesSeen ?? 0) + (session.messageCount ?? 0),
      lastUpdated: now,
    };

    const ref = doc(
      db,
      USERS_COLLECTION,
      userId,
      META_SUBCOLLECTION,
      MEMORY_DOC_ID
    );

    const toSave: UserMemory = {
      userId,
      prefs,
      goals,
      corrections,
      stats,
    };

    // Scriviamo in merge per non sovrascrivere eventuali altri campi
    await setDoc(ref, toSave, { merge: true });
  } catch (err) {
    console.error("[ANOVA] mergeSessionIntoUserMemory fallita:", err);
    // Non blocchiamo la pipeline se fallisce: è "best effort".
  }
}

// ⬆️ FINE BLOCCO 14.0 — Memoria Utente Persistente (Firestore)
