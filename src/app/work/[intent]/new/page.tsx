"use client";
// ⬇️ BLOCCO W2 — New Project (V6, Email macro + variants, pulito)
// Path: /src/app/work/[intent]/new/page.tsx
// Note operative:
// - Intent ≠ scrittura: crea subito (stage=BRIEF_1)
// - Intent = scrittura: job obbligatorio
// - Email è una macro: apre submenu (singola / sequenza)
// - Query ?job=...: se valido crea direttamente (legacy "email" -> "email_singola" via catalog)
// - Anti-doppio create (StrictMode-safe)

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db, getUserId } from "@/lib/firebase";
import type { ProjectDoc, WorkIntent, ScritturaJob } from "@/lib/projects/types";

import {
  SCRITTURA_JOBS_MAIN,
  EMAIL_VARIANTS,
  normalizeScritturaJob,
} from "@/lib/jobs/scrittura/catalog";

const makeId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

// Macro EMAIL: nel catalog MAIN l’utente vede "Email" ma la key è "email_singola"
const EMAIL_MACRO_KEY: ScritturaJob = "email_singola";

export default function NewProjectPage() {
  const router = useRouter();
  const params = useParams<{ intent: WorkIntent }>();
  const searchParams = useSearchParams();

  const intent = params.intent;

  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // UI: Email submenu
  const [emailPickOpen, setEmailPickOpen] = useState(false);

  // StrictMode-safe: evita doppio create
  const didCreateRef = useRef(false);

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  // =========================
  // 1) JOB da query (solo scrittura)
  // =========================
  const jobFromQuery = (searchParams.get("job") || "").trim();

  const jobFromQueryNormalized: ScritturaJob | null = useMemo(() => {
    if (intent !== "scrittura") return null;
    return normalizeScritturaJob(jobFromQuery);
  }, [intent, jobFromQuery]);

  // =========================
  // 2) CREATE PROJECT
  // =========================
  const createProject = async (opts?: { job?: ScritturaJob }) => {
    if (!userId) return;
    if (busy) return;

    // Per scrittura, job è obbligatorio
    if (intent === "scrittura" && !opts?.job) {
      setErr("Seleziona un tipo di scrittura per creare il progetto.");
      return;
    }

    // Anti doppio create (dev StrictMode)
    if (didCreateRef.current) return;
    didCreateRef.current = true;

    setBusy(true);
    setErr(null);

    try {
      const projectId = makeId();
      const sessionId = makeId();

      const projectRef = doc(collection(db, "projects"), projectId);
      const sessionRef = doc(db, "sessions", sessionId);

      const projectDoc: ProjectDoc = {
        owner: userId,
        intent,
        job: intent === "scrittura" ? opts?.job : undefined,
        stage: "BRIEF_1",
        sessionId,
        brief: {},
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
        job: intent === "scrittura" ? opts?.job : undefined,
      });

      router.push(`/work/p/${projectId}`);
    } catch (e: any) {
      console.error("Create project error:", e);
      didCreateRef.current = false; // sblocca retry
      setErr("Errore creazione progetto. Riprova.");
      setBusy(false);
    }
  };

  // =========================
  // 3) AUTO-CREATE
  // =========================
  useEffect(() => {
    if (!userId) return;
    if (busy) return;

    // Anti doppio create anche qui (copre intent !== scrittura)
    if (didCreateRef.current) return;

    // intent non scrittura: crea subito
    if (intent !== "scrittura") {
      createProject();
      return;
    }

    // scrittura: crea solo se job valido in query
    if (jobFromQueryNormalized) {
      createProject({ job: jobFromQueryNormalized });
      return;
    }
  }, [userId, intent, jobFromQueryNormalized, busy]);

  // =========================
  // 4) UI
  // =========================
  if (intent !== "scrittura") {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight">
            Nuovo progetto — {String(intent).toUpperCase()}
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Creazione progetto in corso…</p>

          {err && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200 text-sm">
              {err}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Nuovo progetto — SCRITTURA</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Seleziona il tipo. Email apre la scelta: singola o sequenza.
        </p>

        {err && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-200 text-sm">
            {err}
          </div>
        )}

        {/* ===== EMAIL SUBMENU ===== */}
        {emailPickOpen ? (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Email — scegli modalità</div>
              <button
                className="text-neutral-400 hover:text-white text-sm"
                onClick={() => setEmailPickOpen(false)}
                disabled={busy}
              >
                ← Indietro
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {EMAIL_VARIANTS.map((v) => (
                <button
                  key={v.key}
                  disabled={!userId || busy}
                  onClick={() => createProject({ job: v.key })}
                  className="border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 rounded-xl p-5 text-left transition disabled:opacity-50"
                >
                  <div className="text-lg font-semibold">{v.label}</div>
                  <div className="text-neutral-400 text-sm mt-1">{v.desc}</div>
                </button>
              ))}
            </div>

            <div className="text-neutral-500 text-xs mt-6">
              Nota: Sequenza è predisposta come pipeline separata (cartella pronta), per ora vuota.
            </div>
          </div>
        ) : (
          /* ===== MAIN JOBS ===== */
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCRITTURA_JOBS_MAIN.map((j) => {
              const isEmailMacro = j.key === EMAIL_MACRO_KEY;

              return (
                <button
                  key={j.key}
                  disabled={!userId || busy}
                  onClick={() => {
                    if (isEmailMacro) {
                      setEmailPickOpen(true);
                      return;
                    }
                    createProject({ job: j.key });
                  }}
                  className="border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 rounded-xl p-5 text-left transition disabled:opacity-50"
                >
                  <div className="text-lg font-semibold">{j.label}</div>
                  <div className="text-neutral-400 text-sm mt-1">{j.desc}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
// ⬆️ FINE BLOCCO W2
