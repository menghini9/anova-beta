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

export function getUserId(): Promise<string> {
  return new Promise((resolve) => {
    if (_userId) return resolve(_userId);

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        _userId = user.uid;
        return resolve(_userId);
      }
      const res = await signInAnonymously(auth);
      _userId = res.user.uid;
      return resolve(_userId);
    });
  });
}
