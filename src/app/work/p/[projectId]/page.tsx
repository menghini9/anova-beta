"use client";
// ======================================================
// Project Flow Router — SCRITTURA / BREVE (V3, hooks-safe)
// Path: /src/app/work/p/[projectId]/page.tsx
// ======================================================

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";

import { db, getUserId } from "@/lib/firebase";
import type { ProjectDoc } from "@/lib/projects/types";

import type { ScritturaBreveBrief1 } from "@/lib/brief/scrittura/breve/brief1";
import { buildScritturaBreveContractAll } from "@/lib/brief/scrittura/breve/brief2";

import { ScritturaBreveBrief1Form } from "@/components/brief/scrittura/ScritturaBreveBrief1";
import { ScritturaBreveBrief2Form } from "@/components/brief/scrittura/ScritturaBreveBrief2";

export default function ProjectFlowPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [userId, setUserId] = useState<string | null>(null);
  const [project, setProject] = useState<(ProjectDoc & { id: string }) | null>(null);

  // =========================
  // 1) LOAD USER
  // =========================
  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // =========================
  // 2) LOAD PROJECT (realtime)
  // =========================
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

  // =========================
  // 3) ROUTE TO CHAT WHEN READY
  // =========================
  useEffect(() => {
    if (!project) return;

    if (project.stage === "OPEN_CHAT" || project.stage === "PRODUCTION") {
      router.push(`/chat?projectId=${projectId}`);
    }
  }, [project, router, projectId]);

  // =========================
  // 4) LOADING UI
  // =========================
  if (!project) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-6">
        <div className="max-w-3xl mx-auto text-neutral-400">Caricamento progetto…</div>
      </main>
    );
  }

  // =========================
  // 5) FLOW GUARDS + DATA (NO HOOKS HERE)
  // =========================
  const isScritturaBreve = project.intent === "scrittura" && project.mode === "breve";
  const brief1 = (project?.brief?.round1 ?? {}) as ScritturaBreveBrief1;
  const brief2 = project?.brief?.round2 ?? {};

  // =========================
  // 6) RENDER
  // =========================
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
        {isScritturaBreve ? (
          <>
            {/* ------------------------------
                STEP 1 — BRIEF_1
               ------------------------------ */}
            {project.stage === "BRIEF_1" ? (
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

            {/* ------------------------------
                STEP 2 — CONFIRM_1 (Contratto giro 1)
               ------------------------------ */}
            {project.stage === "CONFIRM_1" ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-lg font-semibold">Conferma brief — Giro 1</div>
                <div className="text-sm text-white/70 mt-1">
                  Controlla che sia tutto corretto. Poi passiamo al Giro 2.
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                  {(() => {
                    const sections = buildScritturaBreveContractAll(brief1, {});
                    const giro1 = sections[0];

                    return (
                      <div className="space-y-2">
                        <div className="font-semibold">{giro1.title}</div>
                        <ul className="list-disc ml-5 text-white/80 space-y-1">
                          {giro1.lines.map((l: string) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    onClick={async () => {
                      const ref = doc(db, "projects", project.id);
                      await updateDoc(ref, {
                        stage: "BRIEF_1",
                        updatedAt: serverTimestamp(),
                      });
                    }}
                    className="rounded-xl border border-white/15 bg-white/0 hover:bg-white/5 px-5 py-2.5 text-sm font-semibold"
                  >
                    ← Modifica
                  </button>

                  <button
                    onClick={async () => {
                      const ref = doc(db, "projects", project.id);
                      await updateDoc(ref, {
                        stage: "BRIEF_2",
                        updatedAt: serverTimestamp(),
                      });
                    }}
                    className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black"
                  >
                    Confermo → Giro 2
                  </button>
                </div>
              </div>
            ) : null}

            {/* ------------------------------
                STEP 3 — BRIEF_2 (Form giro 2)
               ------------------------------ */}
            {project.stage === "BRIEF_2" ? (
              <ScritturaBreveBrief2Form
                brief1={brief1}
                initial={project?.brief?.round2}
                onNext={async (round2: any) => {
                  const ref = doc(db, "projects", project.id);
                  await updateDoc(ref, {
                    stage: "CONFIRM_2",
                    "brief.round2": round2,
                    updatedAt: serverTimestamp(),
                  });
                }}
              />
            ) : null}

            {/* ------------------------------
                STEP 4 — CONFIRM_2 (Contratto completo)
               ------------------------------ */}
            {project.stage === "CONFIRM_2" ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-lg font-semibold">Conferma brief — Completo</div>
                <div className="text-sm text-white/70 mt-1">
                  Questo è il “contratto” finale. Se confermi, apriamo la chat e andiamo in produzione.
                </div>

                <div className="mt-5 space-y-4 text-sm">
                  {buildScritturaBreveContractAll(brief1, brief2).map(
                    (s: { title: string; lines: string[] }) => (
                      <div
                        key={s.title}
                        className="rounded-xl border border-white/10 bg-black/30 p-4"
                      >
                        <div className="font-semibold">{s.title}</div>
                        <ul className="list-disc ml-5 mt-2 text-white/80 space-y-1">
                          {s.lines.map((l: string) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    onClick={async () => {
                      const ref = doc(db, "projects", project.id);
                      await updateDoc(ref, {
                        stage: "BRIEF_2",
                        updatedAt: serverTimestamp(),
                      });
                    }}
                    className="rounded-xl border border-white/15 bg-white/0 hover:bg-white/5 px-5 py-2.5 text-sm font-semibold"
                  >
                    ← Modifica Giro 2
                  </button>

                  <button
                    onClick={async () => {
                      const ref = doc(db, "projects", project.id);
                      await updateDoc(ref, {
                        stage: "OPEN_CHAT",
                        updatedAt: serverTimestamp(),
                      });
                    }}
                    className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black"
                  >
                    Confermo → Apri chat
                  </button>
                </div>
              </div>
            ) : null}

            {/* ------------------------------
                FALLBACK (solo se stage non gestito qui)
               ------------------------------ */}
            {!(["BRIEF_1", "CONFIRM_1", "BRIEF_2", "CONFIRM_2"].includes(project.stage)) ? (
              <div className="mt-6 border border-neutral-800 rounded-xl p-5 bg-neutral-900/30">
                <div className="font-semibold">Step non gestito in questo flow</div>
                <div className="text-neutral-400 text-sm mt-1">
                  Stage corrente: <span className="text-neutral-200">{project.stage}</span>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-6 border border-neutral-800 rounded-xl p-5 bg-neutral-900/30">
            <div className="font-semibold">Flow non ancora collegato</div>
            <div className="text-neutral-400 text-sm mt-1">
              Intent: <span className="text-neutral-200">{project.intent}</span> — Mode:{" "}
              <span className="text-neutral-200">{project.mode}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
