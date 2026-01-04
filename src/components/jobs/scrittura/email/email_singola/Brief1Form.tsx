"use client";

// ======================================================
// UI — EMAIL SINGOLA — BRIEF 1 (Giro 1)
// Path: /src/components/jobs/scrittura/email/email_singola/Brief1Form.tsx
// ======================================================

import { useMemo, useState } from "react";

import type { EmailSingolaBrief1 } from "@/lib/jobs/scrittura/email/email_singola/brief1";
import {
  EMAIL_SINGOLA_BRIEF1_DEFAULT,
  EMAIL_SINGOLA_BRIEF1_QUESTIONS,
  validateEmailSingolaBrief1,
} from "@/lib/jobs/scrittura/email/email_singola/brief1";


export default function EmailSingolaBrief1Form(props: {
  initial?: Partial<EmailSingolaBrief1>;
  onNext: (brief1: EmailSingolaBrief1) => void;
}) {
  // =========================
  // 1) INIT
  // =========================
  const initialMerged = useMemo<EmailSingolaBrief1>(() => {
    return {
      ...EMAIL_SINGOLA_BRIEF1_DEFAULT,
      ...(props.initial ?? {}),
    };
  }, [props.initial]);

  const [form, setForm] = useState<EmailSingolaBrief1>(initialMerged);
  const [errors, setErrors] = useState<string[]>([]);

  // =========================
  // 2) HELPERS
  // =========================
  function update<K extends keyof EmailSingolaBrief1>(k: K, v: EmailSingolaBrief1[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit() {
    const res = validateEmailSingolaBrief1(form);

    // supporto sia validate che ritorna string[] sia {ok, errors}
    const errs = Array.isArray(res) ? res : res?.errors ?? [];

    setErrors(errs);
    if (errs.length > 0) return;

    props.onNext(form);
  }

  // =========================
  // 3) UI
  // =========================
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Email — Giro 1</div>
        <div className="text-sm text-white/70">
          Compila tutto. La chat resta chiusa finché il brief non è confermato.
        </div>

        <div className="mt-6 space-y-5">
          {EMAIL_SINGOLA_BRIEF1_QUESTIONS.map((q: any) => {
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
                    onChange={(e) => update(q.id as any, e.target.value as any)}
                    placeholder={q.placeholder}
                    maxLength={q.maxLen ?? 999}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
                  />
                ) : (
                  <select
                    value={val}
                    onChange={(e) => update(q.id as any, e.target.value as any)}
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
