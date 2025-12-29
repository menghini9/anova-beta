"use client";
// ⬇️ BLOCCO W2 — New Project (V1)

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, getUserId } from "@/lib/firebase";
import type { ProjectDoc, ProjectMode, WorkIntent } from "@/lib/projects/types";

const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

export default function NewProjectPage() {
  const router = useRouter();
  const params = useParams<{ intent: WorkIntent }>();
  const intent = params.intent;

  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  const createProject = async (mode: ProjectMode) => {
    if (!userId) return;
    setBusy(true);

    const projectId = makeId();
    const sessionId = makeId();

    const projectRef = doc(collection(db, "projects"), projectId);
    const sessionRef = doc(db, "sessions", sessionId);

    const projectDoc: ProjectDoc = {
      owner: userId,
      intent,
      mode,
      stage: "BRIEF_1",
      sessionId,
      brief: {},
      aiq: {},
      contracts: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(projectRef, projectDoc);

    await setDoc(sessionRef, {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "Progetto creato.",
      deleted: false,
      owner: userId,
      projectId,
      intent,
      mode,
    });

    router.push(`/work/p/${projectId}`);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Nuovo progetto — {intent.toUpperCase()}</h1>
        <p className="text-neutral-400 text-sm mt-1">Seleziona modalità. Poi flusso industriale.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button disabled={!userId || busy} onClick={() => createProject("breve")}
            className="border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 rounded-xl p-5 text-left transition disabled:opacity-50">
            <div className="text-lg font-semibold">Breve</div>
            <div className="text-neutral-400 text-sm mt-1">Brief 1 → Confirm → Brief 2 → Confirm → Open Chat → Produzione.</div>
          </button>

          <button disabled={!userId || busy} onClick={() => createProject("guidato")}
            className="border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 rounded-xl p-5 text-left transition disabled:opacity-50">
            <div className="text-lg font-semibold">Guidato</div>
            <div className="text-neutral-400 text-sm mt-1">Dopo ogni Confirm: +3 domande AI. Poi Open Chat → Produzione.</div>
          </button>
        </div>
      </div>
    </main>
  );
}
// ⬆️ FINE BLOCCO W2
