"use client";
// ⬇️ BLOCCO W3 — Project Flow Router (V1)
// Path: /src/app/work/p/[projectId]/page.tsx

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";

import { db, getUserId } from "@/lib/firebase";
import type { ProjectDoc } from "@/lib/projects/types";

// ⚠️ Import corretto: nel tuo file non è default export
import { ScritturaBreveBrief1Form } from "@/components/brief/scrittura/ScritturaBreveBrief1";

export default function ProjectFlowPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [userId, setUserId] = useState<string | null>(null);
  const [project, setProject] = useState<(ProjectDoc & { id: string }) | null>(null);

  // --------------------------------------------------
  // 1) LOAD USER
  // --------------------------------------------------
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // --------------------------------------------------
  // 2) LOAD PROJECT (realtime)
  // --------------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const ref = doc(db, "projects", projectId);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as ProjectDoc | undefined;
      if (!data) return;
      setProject({ id: snap.id, ...data });
    });

    return () => unsub();
  }, [userId, projectId]);

  // --------------------------------------------------
  // 3) ROUTE TO CHAT WHEN READY
  // --------------------------------------------------
  useEffect(() => {
    if (!project) return;

    if (project.stage === "OPEN_CHAT" || project.stage === "PRODUCTION") {
      router.push(`/chat?projectId=${projectId}`);
    }
  }, [project, router, projectId]);

  // --------------------------------------------------
  // 4) LOADING UI
  // --------------------------------------------------
  if (!project) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-6">
        <div className="max-w-3xl mx-auto text-neutral-400">Caricamento progetto…</div>
      </main>
    );
  }

  // --------------------------------------------------
  // 5) RENDER FLOW UI (sempre dentro RETURN!)
  // --------------------------------------------------
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Progetto</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Intent: {project.intent} — Mode: {project.mode} — Stage: {project.stage}
        </p>

        {/* ======================================
            FLOW — SCRITTURA / BREVE
           ====================================== */}
        {project.intent === "scrittura" && project.mode === "breve" && project.stage === "BRIEF_1" ? (
          <ScritturaBreveBrief1Form
            initial={project?.brief?.round1}
            onNext={async (round1: any) => {
              const ref = doc(db, "projects", project.id);

              await updateDoc(ref, {
                stage: "CONFIRM_1",
                "brief.round1": round1,
                updatedAt: serverTimestamp(),
              });
            }}
          />
        ) : null}

        {/* Placeholder: se non matcha nessun flow ancora */}
        {!(project.intent === "scrittura" && project.mode === "breve" && project.stage === "BRIEF_1") ? (
          <div className="mt-6 border border-neutral-800 rounded-xl p-5 bg-neutral-900/30">
            <div className="font-semibold">Step in costruzione</div>
            <div className="text-neutral-400 text-sm mt-1">
              Stage corrente: <span className="text-neutral-200">{project.stage}</span>
            </div>
            <div className="text-neutral-400 text-sm mt-2">
              Prossimo blocco: Brief 1 / Confirm 1 / AI_Q_1 / Brief 2 / Confirm 2 / AI_Q_2, poi OPEN_CHAT.
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

// ⬆️ FINE BLOCCO W3
