"use client";

// ======================================================
// UI — EMAIL SINGOLA — BRIEF 3 (Giro 3) — TESTO LIBERO
// Path: /src/components/jobs/scrittura/email/email_singola/Brief3Form.tsx
// Note:
// - Brief3 per email_singola = 2 campi liberi: cosa (primario) + materiale (supporto)
// - Validazione: COSA 2–8 righe (come regola core nel lib)
// - Niente "QUESTIONS" se non esistono: UI diretta e stabile
// ======================================================

import { useMemo, useState } from "react";

import type { EmailSingolaBrief3 } from "@/lib/jobs/scrittura/email/email_singola/brief3";
import {
  EMAIL_SINGOLA_BRIEF3_DEFAULT,
  validateEmailSingolaBrief3,
} from "@/lib/jobs/scrittura/email/email_singola/brief3";

// =========================
// HELPERS
// =========================
function splitLines(s?: string): string[] {
  return (s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function Brief3Form(props: {
  initial?: Partial<EmailSingolaBrief3>;
  onNext: (brief3: EmailSingolaBrief3) => void;
  onBack?: () => void;
}) {
  // =========================
  // 1) INIT (merge defaults + initial)
  // =========================
  const initialMerged = useMemo<EmailSingolaBrief3>(() => {
    return {
      ...EMAIL_SINGOLA_BRIEF3_DEFAULT,
      ...(props.initial ?? {}),
    } as EmailSingolaBrief3;
  }, [props.initial]);

  const [form, setForm] = useState<EmailSingolaBrief3>(initialMerged);
  const [errors, setErrors] = useState<string[]>([]);

  function update<K extends keyof EmailSingolaBrief3>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function onSubmit() {
    const res = validateEmailSingolaBrief3(form);
    const errs = res.ok ? [] : res.errors;
    setErrors(errs);
    if (errs.length > 0) return;
    props.onNext(form);
  }

  const cosaLinesCount = splitLines(form.cosa).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Brief — Giro 3</div>
        <div className="text-sm text-white/70 mt-1">
          Qui metti il contesto reale (COSA) e, se serve, incolli materiale di supporto. Fine.
        </div>

        <div className="mt-6 space-y-6">
          {/* 1) COSA (primario) */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              1) COSA (contesto reale) <span className="text-emerald-300">*</span>
            </div>

            <div className="text-xs text-white/50">
              Regola: <b>2–8 righe</b>. Una cosa per riga. ({cosaLinesCount}/8)
            </div>

            <textarea
              value={form.cosa ?? ""}
              onChange={(e) => update("cosa", e.target.value)}
              placeholder={
                "2–8 righe.\nEsempio:\n- Sto scrivendo a X perché...\n- Devo ottenere...\n- Contesto: ...\n- Vincoli: ..."
              }
              rows={6}
              maxLength={2000}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
            />
          </div>

          {/* 2) MATERIALE (supporto) */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              2) Materiale (opzionale)
              <span className="text-white/50"> — incolla qui email precedenti, note, numeri, link</span>
            </div>

            <div className="text-xs text-white/50">
              Nota: verrà usato come supporto, ma Anova deve riformulare (niente copia-incolla lungo).
            </div>

            <textarea
              value={form.materiale ?? ""}
              onChange={(e) => update("materiale", e.target.value)}
              placeholder={"Incolla qui tutto ciò che può aiutare.\n(Se è lungo, va bene.)"}
              rows={8}
              maxLength={12000}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
            />
          </div>
        </div>

        {/* ERRORI */}
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

        {/* CTA */}
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
