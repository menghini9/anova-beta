"use client";
// ======================================================
// Project Flow Router — SCRITTURA (V6, job-driven)
// Path: /src/app/work/p/[projectId]/page.tsx
//
// Flow (immutabile):
// BRIEF_1 -> CONFIRM_1 -> BRIEF_2 -> CONFIRM_2 -> BRIEF_3 -> CONFIRM_3 -> OPEN_CHAT -> PRODUCTION
//
// Regola chiave:
// - NIENTE mode.
// - SCRITTURA = intent + job
// - Rendering guidato SOLO dal registry (job -> pipeline)
// ======================================================

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";

import { db, getUserId } from "@/lib/firebase";
import type { ProjectDoc, ScritturaJob } from "@/lib/projects/types";

import { getScritturaJobPipeline } from "@/lib/jobs/scrittura/registry";

// =========================
// FLOW STAGES (immutabili)
// =========================
const FLOW_STAGES = [
  "BRIEF_1",
  "CONFIRM_1",
  "BRIEF_2",
  "CONFIRM_2",
  "BRIEF_3",
  "CONFIRM_3",
  "OPEN_CHAT",
  "PRODUCTION",
] as const;

type FlowStage = (typeof FLOW_STAGES)[number];

function isFlowStage(x: any): x is FlowStage {
  return typeof x === "string" && (FLOW_STAGES as readonly string[]).includes(x);
}

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

      // Owner check (soft): non blocchiamo UX qui, ma potresti aggiungere toast
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
  // 5) DATA
  // =========================
  const intent = String(project.intent ?? "");
  const job = project.job as ScritturaJob | undefined;
  const stage = String(project.stage ?? "");

  const brief1 = (project?.brief?.round1 ?? {}) as any;
  const brief2 = (project?.brief?.round2 ?? {}) as any;
  const brief3 = (project?.brief?.round3 ?? {}) as any;

  // =========================
  // 6) HELPERS
  // =========================
  async function setStage(nextStage: FlowStage) {
    const ref = doc(db, "projects", projectId);
    await updateDoc(ref, { stage: nextStage, updatedAt: serverTimestamp() });
  }

  // =========================
  // 7) PIPELINE RESOLUTION (SCRITTURA)
  // =========================
  const pipeline = useMemo(() => {
    if (intent !== "scrittura") return null;
    if (!job) return null;
    return getScritturaJobPipeline(job);
  }, [intent, job]);

  // =========================
  // 8) RENDER
  // =========================
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Progetto</h1>

        <p className="text-neutral-400 text-sm mt-1">
          Intent: <span className="text-neutral-200">{intent}</span>
          {intent === "scrittura" ? (
            <>
              {" "}
              — Tipo: <span className="text-neutral-200">{job ? job : "NON SETTATO (legacy)"}</span>
            </>
          ) : null}
          {" "}
          — Stage: <span className="text-neutral-200">{stage}</span>
        </p>

        {/* ======================================
            SCRITTURA — pipeline by job
           ====================================== */}
        {intent === "scrittura" ? (
          pipeline ? (
            <>
              {/* ------------------------------
                  STEP 1 — BRIEF_1
                 ------------------------------ */}
              {stage === "BRIEF_1" ? (
                <pipeline.Brief1Form
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
                  STEP 2 — CONFIRM_1
                 ------------------------------ */}
              {stage === "CONFIRM_1" ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-lg font-semibold">Conferma brief — Giro 1</div>
                  <div className="text-sm text-white/70 mt-1">
                    Controlla che sia tutto corretto. Poi passiamo al Giro 2.
                  </div>

                  <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
                    {(() => {
                      const sections = pipeline.buildContractAll(brief1, {});
                      const giro1 = sections?.[0];
                      if (!giro1) return <div className="text-white/70">Nessuna sezione disponibile.</div>;

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
                      onClick={() => setStage("BRIEF_1")}
                      className="rounded-xl border border-white/15 bg-white/0 hover:bg-white/5 px-5 py-2.5 text-sm font-semibold"
                    >
                      ← Modifica
                    </button>

                    <button
                      onClick={() => setStage("BRIEF_2")}
                      className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black"
                    >
                      Confermo → Giro 2
                    </button>
                  </div>
                </div>
              ) : null}

              {/* ------------------------------
                  STEP 3 — BRIEF_2
                 ------------------------------ */}
              {stage === "BRIEF_2" ? (
                <pipeline.Brief2Form
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
                  STEP 4 — CONFIRM_2
                 ------------------------------ */}
              {stage === "CONFIRM_2" ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-lg font-semibold">Conferma brief — Giro 2</div>
                  <div className="text-sm text-white/70 mt-1">
                    Questo è il contratto dei primi due giri. Se confermi, passiamo al Giro 3.
                  </div>

                  <div className="mt-5 space-y-4 text-sm">
                    {pipeline.buildContractAll(brief1, brief2).map((s: { title: string; lines: string[] }) => (
                      <div key={s.title} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="font-semibold">{s.title}</div>
                        <ul className="list-disc ml-5 mt-2 text-white/80 space-y-1">
                          {s.lines.map((l: string) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setStage("BRIEF_2")}
                      className="rounded-xl border border-white/15 bg-white/0 hover:bg-white/5 px-5 py-2.5 text-sm font-semibold"
                    >
                      ← Modifica Giro 2
                    </button>

                    <button
                      onClick={() => setStage("BRIEF_3")}
                      className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black"
                    >
                      Confermo → Giro 3
                    </button>
                  </div>
                </div>
              ) : null}

              {/* ------------------------------
                  STEP 5 — BRIEF_3
                 ------------------------------ */}
              {stage === "BRIEF_3" ? (
                <pipeline.Brief3Form
                  initial={project?.brief?.round3}
                  onBack={() => setStage("CONFIRM_2")}
                  onNext={async (round3: any) => {
                    const ref = doc(db, "projects", project.id);
                    await updateDoc(ref, {
                      stage: "CONFIRM_3",
                      "brief.round3": round3,
                      updatedAt: serverTimestamp(),
                    });
                  }}
                />
              ) : null}

              {/* ------------------------------
                  STEP 6 — CONFIRM_3
                 ------------------------------ */}
              {stage === "CONFIRM_3" ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="text-lg font-semibold">Conferma brief — Giro 3</div>
                  <div className="text-sm text-white/70 mt-1">
                    Ultimo controllo. Poi apriamo la chat e Anova parte con un primo output.
                  </div>

                  <div className="mt-5 space-y-4 text-sm">
                    {pipeline.buildBrief3Sections(brief3).map((s: { title: string; lines: string[] }) => (
                      <div key={s.title} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <div className="font-semibold">{s.title}</div>
                        <ul className="list-disc ml-5 mt-2 text-white/80 space-y-1">
                          {s.lines.map((l: string) => (
                            <li key={l}>{l}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setStage("BRIEF_3")}
                      className="rounded-xl border border-white/15 bg-white/0 hover:bg-white/5 px-5 py-2.5 text-sm font-semibold"
                    >
                      ← Modifica Giro 3
                    </button>

                    <button
                      onClick={async () => {
                        const ref = doc(db, "projects", project.id);
                        await updateDoc(ref, { stage: "OPEN_CHAT", updatedAt: serverTimestamp() });
                      }}
                      className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black"
                    >
                      Confermo → Apri chat
                    </button>
                  </div>
                </div>
              ) : null}

              {/* ------------------------------
                  FALLBACK STAGE
                 ------------------------------ */}
              {!isFlowStage(stage) ? (
                <div className="mt-6 border border-neutral-800 rounded-xl p-5 bg-neutral-900/30">
                  <div className="font-semibold">Step non gestito in questo flow</div>
                  <div className="text-neutral-400 text-sm mt-1">
                    Stage corrente: <span className="text-neutral-200">{stage}</span>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-6 border border-neutral-800 rounded-xl p-5 bg-neutral-900/30">
              <div className="font-semibold">Scrittura: tipo non collegato</div>
              <div className="text-neutral-400 text-sm mt-1">
                Questo progetto non ha un <b>job</b> valido (oppure non è registrato nel registry).
                <br />
                Soluzione: crea un nuovo progetto da Work → SCRITTURA scegliendo un tipo.
              </div>
            </div>
          )
        ) : (
          <div className="mt-6 border border-neutral-800 rounded-xl p-5 bg-neutral-900/30">
            <div className="font-semibold">Flow non ancora collegato</div>
            <div className="text-neutral-400 text-sm mt-1">
              Intent: <span className="text-neutral-200">{intent}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
