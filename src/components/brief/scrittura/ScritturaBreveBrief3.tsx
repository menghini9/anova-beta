"use client";

// ======================================================
// UI — BRIEF 3 (Scrittura / Progetto breve) — DOMANDE APERTE
// Path: /src/components/brief/scrittura/ScritturaBreveBrief3.tsx
// ======================================================

import { useMemo, useState } from "react";
import type { ScritturaBreveBrief3, Brief3Question } from "@/lib/brief/scrittura/breve/brief3";
import {
  SCRITTURA_BREVE_BRIEF3_DEFAULTS,
  SCRITTURA_BREVE_BRIEF3_QUESTIONS,
  validateBrief3,
} from "@/lib/brief/scrittura/breve/brief3";

export function ScritturaBreveBrief3Form(props: {
  initial?: Partial<ScritturaBreveBrief3>;
  onNext: (brief3: ScritturaBreveBrief3) => void;
  onBack?: () => void;
}) {
  const initialMerged = useMemo<ScritturaBreveBrief3>(() => {
    return {
      ...SCRITTURA_BREVE_BRIEF3_DEFAULTS,
      ...(props.initial ?? {}),
    };
  }, [props.initial]);

  const [form, setForm] = useState<ScritturaBreveBrief3>(initialMerged);
  const [errors, setErrors] = useState<string[]>([]);

  function update<K extends keyof ScritturaBreveBrief3>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit() {
    const errs = validateBrief3(form);
    setErrors(errs);
    if (errs.length > 0) return;
    props.onNext(form);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Brief — Giro 3</div>
        <div className="text-sm text-white/70">
          Qui dai contesto libero: chi/cosa/come/perché. Poi si passa all’output.
        </div>

        <div className="mt-6 space-y-5">
          {(SCRITTURA_BREVE_BRIEF3_QUESTIONS as Brief3Question[]).map((q) => {
            const val = form[q.id] ?? "";

            return (
              <div key={q.id} className="space-y-2">
                <div className="text-sm font-medium">
                  {q.label}{" "}
                  {q.required ? (
                    <span className="text-emerald-300">*</span>
                  ) : (
                    <span className="text-white/50">(opzionale)</span>
                  )}
                </div>

                <textarea
                  value={val}
                  onChange={(e) => update(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  maxLength={q.maxLen ?? 3000}
                  rows={q.rows ?? 4}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
                />
              </div>
            );
          })}
        </div>

        {errors.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <div className="font-semibold">Mancano dati:</div>
            <ul className="list-disc ml-5 mt-2 text-white/80">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          {props.onBack ? (
            <button
              onClick={props.onBack}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold"
            >
              ← Indietro
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onSubmit}
            className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black"
          >
            Avanti → Conferma brief
          </button>
        </div>
      </div>
    </div>
  );
}
