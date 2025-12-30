"use client";

// ======================================================
// UI — BRIEF 2 (Scrittura / Progetto breve)
// Path: /src/components/brief/scrittura/ScritturaBreveBrief2.tsx
// ======================================================

import { useMemo, useState } from "react";
import type { ScritturaBreveBrief1 } from "@/lib/brief/scrittura/breve/brief1";
import { getScritturaBreveBrief2Module } from "@/lib/brief/scrittura/breve/brief2";

type AnyObj = Record<string, any>;

export function ScritturaBreveBrief2Form(props: {
  brief1: ScritturaBreveBrief1; // serve per scegliere il modulo giusto
  initial?: AnyObj; // brief2 parziale (se rientri/recuperi)
  onNext: (brief2: AnyObj) => void;
}) {
  // =========================
  // 1) Modulo selezionato dal router
  // =========================
  const module = useMemo(() => {
    return getScritturaBreveBrief2Module(props.brief1.Q1);
  }, [props.brief1.Q1]);

  // =========================
  // 2) Stato form (merge defaults + initial)
  // =========================
  const initialMerged = useMemo<AnyObj>(() => {
    return {
      ...(module.defaults ?? {}),
      ...(props.initial ?? {}),
    };
  }, [module.defaults, props.initial]);

  const [form, setForm] = useState<AnyObj>(initialMerged);
  const [errors, setErrors] = useState<string[]>([]);

  function update(k: string, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  // =========================
  // 3) Multi-scelta (checkbox)
  // =========================
  function toggleMulti(id: string, value: string) {
    const current = Array.isArray(form[id]) ? (form[id] as string[]) : [];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    update(id, next);
  }

  function isMultiQuestion(q: any): boolean {
    // Regola pratica: se il default è array o se il valore corrente è array → multi
    const def = (module.defaults ?? {})[q.id];
    const cur = form[q.id];
    if (Array.isArray(def) || Array.isArray(cur)) return true;

    // Backup: se in label c'è "multi-scelta"
    const label = String(q.label ?? "").toLowerCase();
    return label.includes("multi");
  }

  function onSubmit() {
    const errs = module.validate(form);
    setErrors(errs);
    if (errs.length > 0) return;
    props.onNext(form);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">{module.title}</div>
        <div className="text-sm text-white/70">
          Compila tutto. La chat resta chiusa finché il brief non è confermato.
        </div>

        <div className="mt-6 space-y-5">
          {module.questions.map((q) => {
            const val = form[q.id] ?? (q.type === "text" ? "" : "");
            const isText = q.type === "text";
            const isMulti = !isText && isMultiQuestion(q);

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

                {/* TEXT */}
                {isText ? (
                  <input
                    value={val}
                    onChange={(e) => update(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    maxLength={q.maxLen ?? 999}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
                  />
                ) : isMulti ? (
                  // MULTI (checkbox list)
                  <div className="rounded-xl bg-black/40 border border-white/10 p-3">
                    <div className="space-y-2">
                      {(q.options ?? []).map((o: any) => {
                        const checked = Array.isArray(form[q.id])
                          ? (form[q.id] as string[]).includes(o.value)
                          : false;

                        return (
                          <label
                            key={o.value}
                            className="flex items-center gap-3 text-sm text-white/90 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMulti(q.id, o.value)}
                              className="h-4 w-4"
                            />
                            <span>{o.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // SINGLE SELECT
                  <select
                    value={val}
                    onChange={(e) => update(q.id, e.target.value)}
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
