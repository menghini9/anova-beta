// Path: src/lib/firebase.ts
// ======================================================
// Firebase Init + Anonymous Auth (robusto)
// - init safe (no multi-init)
// - getUserId() cached (no listener multipli)
// ======================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";

// =========================
// 0) CONFIG
// =========================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guardrail minimale
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn("Firebase env missing: controlla .env.local (NEXT_PUBLIC_FIREBASE_...)");
}

// =========================
// 1) INIT SAFE
// =========================
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

// =========================
// 2) USER ID (ANON AUTH) — CACHED
// =========================
let _userId: string | null = null;
let _userIdPromise: Promise<string> | null = null;

/**
 * Restituisce sempre un UID valido.
 * - Riusa la promise se già in corso
 * - Non crea listener multipli nel tempo
 */
export function getUserId(): Promise<string> {
  if (_userId) return Promise.resolve(_userId);
  if (_userIdPromise) return _userIdPromise;

  _userIdPromise = new Promise<string>((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          _userId = user.uid;
          resolve(_userId);
          return;
        }

        const res = await signInAnonymously(auth);
        _userId = res.user.uid;
        resolve(_userId);
      } finally {
        // IMPORTANTISSIMO: stop listener, no leak
        unsub();
      }
    });
  });

  return _userIdPromise;
}
