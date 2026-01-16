// ======================================================
// Firebase — Core (NEW)
// Path: src/lib/firebase/index.ts
// ======================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn("Firebase env missing: controlla .env.local (NEXT_PUBLIC_FIREBASE_...)");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

// -------------------------
// Login anonimo (UID stabile)
// -------------------------
let _userId: string | null = null;

// ======================================================
// AUTH — getUserId (Anonimo, deterministico)
// Path: src/lib/firebase/index.ts
// Sostituisci SOLO la funzione getUserId esistente
// ======================================================


export async function getUserId(): Promise<string> {
  // Se nel file hai già `export const auth = getAuth(app);` usa quello.
  // Qui assumo che tu abbia `auth` esportato.
  // Se non vuoi usare auth globale, puoi fare: const auth = getAuth(app);

  // 1) Se già autenticato, ritorna subito
  if (auth.currentUser?.uid) return auth.currentUser.uid;

  // 2) Tenta login anonimo (provider già abilitato)
  try {
    await signInAnonymously(auth);
  } catch (e) {
    // Anche se la signIn fallisce per race, proviamo comunque ad aspettare lo state change
    // (in pratica: se un'altra tab ha già fatto login, qui si allinea)
  }

  // 3) Aspetta in modo certo che Firebase valorizzi currentUser
  const uid = await new Promise<string>((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.uid) {
        unsub();
        resolve(u.uid);
      }
    });

    // Failsafe: se dopo un po' non arriva uid, meglio errore esplicito
    setTimeout(() => {
      try { unsub(); } catch {}
      reject(new Error("Firebase Auth: uid non disponibile (anon sign-in non completato)."));
    }, 8000);
  });

  return uid;
}

