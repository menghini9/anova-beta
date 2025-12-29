"use client";

// ======================================================
// UI — BRIEF 1 (Scrittura / Progetto breve)
// Path: /src/components/brief/scrittura/ScritturaBreveBrief1.tsx
// ======================================================

import { useMemo, useState } from "react";
import type { ScritturaBreveBrief1 } from "@/lib/brief/scrittura/breve/brief1";
import {
  SCRITTURA_BREVE_BRIEF1_DEFAULTS,
  SCRITTURA_BREVE_BRIEF1_QUESTIONS,
  validateBrief1,
} from "@/lib/brief/scrittura/breve/brief1";

export function ScritturaBreveBrief1Form(props: {
  initial?: Partial<ScritturaBreveBrief1>;
  onNext: (brief1: ScritturaBreveBrief1) => void;
}) {
  const initialMerged = useMemo<ScritturaBreveBrief1>(() => {
    return {
      ...SCRITTURA_BREVE_BRIEF1_DEFAULTS,
      ...(props.initial ?? {}),
    };
  }, [props.initial]);

  const [form, setForm] = useState<ScritturaBreveBrief1>(initialMerged);
  const [errors, setErrors] = useState<string[]>([]);

  function update<K extends keyof ScritturaBreveBrief1>(k: K, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit() {
    const errs = validateBrief1(form);
    setErrors(errs);
    if (errs.length > 0) return;
    props.onNext(form);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Brief — Giro 1</div>
        <div className="text-sm text-white/70">
          Compila tutto. La chat resta chiusa finché il brief non è confermato.
        </div>

        <div className="mt-6 space-y-5">
          {SCRITTURA_BREVE_BRIEF1_QUESTIONS.map((q) => {
            const val = (form as any)[q.id] ?? "";
            const isText = q.type === "text";

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

                {isText ? (
                  <input
                    value={val}
                    onChange={(e) => update(q.id as any, e.target.value)}
                    placeholder={q.placeholder}
                    maxLength={q.maxLen ?? 999}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
                  />
                ) : (
                  <select
                    value={val}
                    onChange={(e) => update(q.id as any, e.target.value)}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
                  >
                    {(q.options ?? []).map((o: any) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
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

        <div className="mt-6 flex justify-end">
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
