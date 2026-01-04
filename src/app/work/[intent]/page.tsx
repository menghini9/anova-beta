"use client";
// ⬇️ BLOCCO W1 — Work Intent Page (V2, coerente con ProjectDoc attuale)
// Path: /src/app/work/[intent]/page.tsx
// Obiettivo:
// - Lista progetti per intent
// - Ricerca semplice (contratti + contesto)
// - Card pulite: JOB (se scrittura) + STAGE + snippet
// - Niente riferimenti a "mode" (non esiste più nel type)

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { collection, onSnapshot, orderBy, query, where, limit } from "firebase/firestore";

import { db, getUserId } from "@/lib/firebase";
import type { ProjectDoc, WorkIntent } from "@/lib/projects/types";

type Row = ProjectDoc & { id: string };

// =========================
// Helpers UI
// =========================
function pickSnippet(p: ProjectDoc): string {
  // Priorità: final -> c2 -> c1 -> contextText -> fallback
  const s =
    p.contracts?.final ||
    p.contracts?.c2 ||
    p.contracts?.c1 ||
    p.contextText ||
    "";
  return (s || "").trim();
}

function prettyJobLabel(job?: string) {
  // UI semplice, senza dipendere dal catalog (evita coupling inutile)
  if (!job) return "—";
  if (job === "email_singola") return "Email (Singola)";
  if (job === "email_sequenza") return "Email (Sequenza)";
  // fallback: normalizza snake_case a Title-ish
  return job.replace(/_/g, " ");
}

export default function WorkIntentPage() {
  const params = useParams<{ intent: WorkIntent }>();
  const intent = params.intent;

  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "projects");
    const qy = query(
      ref,
      where("owner", "==", userId),
      where("intent", "==", intent),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    return onSnapshot(qy, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ProjectDoc) })));
    });
  }, [userId, intent]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((p) => {
      const hay = [
        p.intent,
        p.job || "",
        p.stage || "",
        p.contracts?.final || "",
        p.contracts?.c2 || "",
        p.contracts?.c1 || "",
        p.contextText || "",
      ]
        .join("\n")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [rows, search]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Work — {String(intent).toUpperCase()}
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Progetti recenti + ricerca.</p>
          </div>

          <Link
            href={`/work/${intent}/new`}
            className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition"
            style={{ color: "#000" }}
          >
            + Nuovo progetto
          </Link>
        </div>

        <div className="mt-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per job, stage, contratti o contesto..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {filtered.map((p) => {
            const snippet = pickSnippet(p);
            const isScrittura = p.intent === "scrittura";
            const jobLabel = isScrittura ? prettyJobLabel(p.job) : "—";

            return (
              <Link
                key={p.id}
                href={`/work/p/${p.id}`}
                className="border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 rounded-xl p-4 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">
                    {isScrittura ? (
                      <>
                        {jobLabel} —{" "}
                        <span className="text-neutral-300">Stage: {p.stage}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-neutral-300">Stage: {p.stage}</span>
                      </>
                    )}
                  </div>
                  <div className="text-neutral-500">→</div>
                </div>

                <div className="text-neutral-400 text-sm mt-2 line-clamp-2">
                  {snippet || "Nessun contratto o contesto ancora."}
                </div>
              </Link>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-neutral-500 text-sm border border-neutral-800 rounded-xl p-6">
              Nessun progetto trovato. Qui non si spreca materiale: creane uno nuovo.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
// ⬆️ FINE BLOCCO W1
