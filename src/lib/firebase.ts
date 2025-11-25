// ⬇️ BLOCCO 6.2 — Configurazione Firebase principale (Anova β)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ⚙️ Configurazione Firebase — legge le variabili dal file .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 🔒 Evita errori di inizializzazione multipla (Next.js ricarica spesso)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🧠 Moduli principali — esportati per tutto il progetto
export const db = getFirestore(app);       // Database Firestore
export const auth = getAuth(app);          // Autenticazione utenti
export const storage = getStorage(app);    // File e contenuti
export default app;

// ⬆️ FINE BLOCCO 6.2
// ⬇️ BLOCCO 6.3 — Login anonimo automatico

let _userId: string | null = null;

// Restituisce sempre l’UID valido dell’utente
export function getUserId(): Promise<string> {
  return new Promise((resolve) => {
    if (_userId) return resolve(_userId);

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        _userId = user.uid;
        return resolve(_userId);
      } else {
        const res = await signInAnonymously(auth);
        _userId = res.user.uid;
        return resolve(_userId);
      }
    });
  });
}
// ⬆️ FINE BLOCCO 6.3
