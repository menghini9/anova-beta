"use client";

// ======================================================
// UI — EMAIL SINGOLA — BRIEF 2 (Giro 2) — COMPLETO
// Path: /src/components/jobs/scrittura/email/email_singola/Brief2Form.tsx
// Note:
// - UI robusta: non dipende da "QUESTIONS" inesistenti
// - Tipi stretti: dove serve castiamo a `any` per non esplodere sui literal union
// - Validazione minima: blocca solo quando davvero incoerente
// ======================================================

import { useMemo, useState } from "react";

import type { EmailSingolaBrief2 } from "@/lib/jobs/scrittura/email/email_singola/brief2";
import { EMAIL_SINGOLA_BRIEF2_DEFAULT } from "@/lib/jobs/scrittura/email/email_singola/brief2";

// =========================
// TIPI
// =========================
type Props = {
  initial?: Partial<EmailSingolaBrief2>;
  onNext: (brief2: EmailSingolaBrief2) => void;
};

// =========================
// HELPERS (puliti)
// =========================
function splitLines(s?: string): string[] {
  return (s || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function joinLines(arr?: string[]): string {
  return (arr || []).filter(Boolean).join("\n");
}

// =========================
// VALIDAZIONE UI (minima ma utile)
// =========================
function validateUI(b: EmailSingolaBrief2): string[] {
  const errs: string[] = [];

  // Obbligatori (Giro 2)
  if (!String((b as any).scopo || "").trim()) errs.push("Scopo: obbligatorio.");
  if (!String((b as any).risultatoDesiderato || "").trim())
    errs.push("Risultato desiderato: obbligatorio.");

  // Contenuti obbligatori: max 3 righe (regola tua)
  const obbl = splitLines((b as any).contenutiObbligatori);
  if (obbl.length > 3) errs.push("Contenuti obbligatori: max 3 righe (una per riga).");

  // Allegati: se 'si' serve testo
  if ((b as any).allegatiMode === "si") {
    const a = splitLines((b as any).allegatiText);
    if (a.length === 0) errs.push("Allegati/Link: hai scelto 'Sì' ma non hai inserito nulla.");
  }

  // Scadenza: se entro_x / entro_data serve dettaglio
  if ((b as any).scadenzaMode === "entro_data" || (b as any).scadenzaMode === "entro_x_giorni") {
    if (!String((b as any).scadenzaText || "").trim())
      errs.push("Scadenza: manca il valore (data/ora oppure X giorni).");
  }

  // Follow-up: se ricontatto_entro_x_giorni serve dettaglio
  if ((b as any).followUpMode === "ricontatto_entro_x_giorni") {
    if (!String((b as any).followUpText || "").trim()) errs.push("Follow-up: manca X giorni.");
  }

  return errs;
}

// =========================
// COMPONENT
// =========================
export default function Brief2Form(props: Props) {
  // -------------------------
  // 1) INIT (merge defaults + initial)
  // -------------------------
  const initialMerged = useMemo<EmailSingolaBrief2>(() => {
    return {
      ...EMAIL_SINGOLA_BRIEF2_DEFAULT,
      ...(props.initial ?? {}),
    } as EmailSingolaBrief2;
  }, [props.initial]);

  const [form, setForm] = useState<EmailSingolaBrief2>(initialMerged);
  const [errors, setErrors] = useState<string[]>([]);

  // -------------------------
  // 2) UPDATE
  // -------------------------
  function update<K extends keyof EmailSingolaBrief2>(k: K, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  // -------------------------
  // 3) VINCOLI (array string) — UI completa
  // - Checkbox preset + textarea libero (righe)
  // -------------------------
  const vincoliArray: string[] = Array.isArray((form as any).vincoliStile) ? ((form as any).vincoliStile as string[]) : [];

  function toggleVincolo(v: string) {
    const cur = vincoliArray;
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    update("vincoliStile" as any, next);
  }

  function setVincoliFromText(text: string) {
    const lines = splitLines(text);
    update("vincoliStile" as any, lines);
  }

  const vincoliText = joinLines(vincoliArray);

  // -------------------------
  // 4) SUBMIT
  // -------------------------
  function onSubmit() {
    const errs = validateUI(form);
    setErrors(errs);
    if (errs.length > 0) return;
    props.onNext(form);
  }

  // -------------------------
  // 5) UI
  // -------------------------
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Brief — Giro 2</div>
        <div className="text-sm text-white/70 mt-1">
          Qui mettiamo a terra lo “scopo operativo”: cosa deve ottenere l’email e con quali vincoli.
        </div>

        <div className="mt-6 space-y-6">
          {/* 1) SCOPO */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              1) Scopo <span className="text-emerald-300">*</span>
            </div>

            <select
              value={String((form as any).scopo ?? "salutare_presentarmi")}
              onChange={(e) => update("scopo" as any, e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
            >
              {/* Nota: valori stringa “stabili”. Se nel tuo brief2 i literal sono diversi, non esplode: cast a any */}
              <option value="salutare_presentarmi">Salutare / presentarmi</option>
              <option value="chiedere_qualcosa">Chiedere qualcosa</option>
              <option value="proporre_qualcosa">Proporre qualcosa</option>
              <option value="aggiornare">Aggiornare</option>
              <option value="sollecitare">Sollecitare</option>
              <option value="gestire_problema">Gestire un problema</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          {/* 2) RISULTATO DESIDERATO */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              2) Risultato desiderato <span className="text-emerald-300">*</span>
            </div>

            <input
              value={String((form as any).risultatoDesiderato ?? "")}
              onChange={(e) => update("risultatoDesiderato" as any, e.target.value)}
              placeholder='Es: "Conferma entro domani" / "Solo informare, nessuna azione"'
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
            />

            <div className="text-xs text-white/50">
              Regola pratica: se scrivi “nessuna azione”, niente CTA aggressive.
            </div>
          </div>

          {/* 3) CONTENUTI OBBLIGATORI (max 3 righe) */}
          <div className="space-y-2">
            <div className="text-sm font-medium">3) Contenuti obbligatori (max 3 righe)</div>

            <textarea
              value={String((form as any).contenutiObbligatori ?? "")}
              onChange={(e) => update("contenutiObbligatori" as any, e.target.value)}
              placeholder={"Una cosa per riga (max 3).\nEsempio:\n- Punto 1\n- Punto 2\n- Punto 3"}
              rows={4}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
            />
          </div>

          {/* 4) ALLEGATI / LINK */}
          <div className="space-y-2">
            <div className="text-sm font-medium">4) Allegati / Link</div>

            <select
              value={String((form as any).allegatiMode ?? "nessuno")}
              onChange={(e) => update("allegatiMode" as any, e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
            >
              <option value="nessuno">Nessuno</option>
              <option value="si">Sì</option>
            </select>

            {String((form as any).allegatiMode) === "si" && (
              <textarea
                value={String((form as any).allegatiText ?? "")}
                onChange={(e) => update("allegatiText" as any, e.target.value)}
                placeholder={"Uno per riga.\nEs: Preventivo_123.pdf\nEs: https://..."}
                rows={4}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
              />
            )}
          </div>

          {/* 5) SCADENZA / URGENZA */}
          <div className="space-y-2">
            <div className="text-sm font-medium">5) Scadenza / urgenza</div>

            <select
              value={String((form as any).scadenzaMode ?? "nessuna")}
              onChange={(e) => update("scadenzaMode" as any, e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
            >
              <option value="nessuna">Nessuna</option>
              <option value="entro_data">Entro una data</option>
              <option value="entro_x_giorni">Entro X giorni</option>
              <option value="urgente">Urgente</option>
            </select>

            {(String((form as any).scadenzaMode) === "entro_data" ||
              String((form as any).scadenzaMode) === "entro_x_giorni") && (
              <input
                value={String((form as any).scadenzaText ?? "")}
                onChange={(e) => update("scadenzaText" as any, e.target.value)}
                placeholder={
                  String((form as any).scadenzaMode) === "entro_data"
                    ? "Data/ora (scritta come vuoi che compaia)"
                    : "X (es: 3)"
                }
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
              />
            )}
          </div>

          {/* 6) FOLLOW-UP */}
          <div className="space-y-2">
            <div className="text-sm font-medium">6) Follow-up</div>

            <select
              value={String((form as any).followUpMode ?? "nessun_riferimento")}
              onChange={(e) => update("followUpMode" as any, e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
            >
              <option value="nessun_riferimento">Nessun riferimento</option>
              <option value="ricontatto_soft">Ricontatto soft</option>
              <option value="ricontatto_entro_x_giorni">Ricontatto entro X giorni</option>
            </select>

            {String((form as any).followUpMode) === "ricontatto_entro_x_giorni" && (
              <input
                value={String((form as any).followUpText ?? "")}
                onChange={(e) => update("followUpText" as any, e.target.value)}
                placeholder="X (es: 7)"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
              />
            )}
          </div>

          {/* 7) VINCOLI STILE */}
          <div className="space-y-2">
            <div className="text-sm font-medium">7) Vincoli di stile (opzionale)</div>

            <div className="rounded-xl bg-black/40 border border-white/10 p-3 space-y-3">
              {/* Preset (checkbox) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "tono_professionale",
                  "tono_diretto",
                  "tono_caldo",
                  "breve",
                  "molto_breve",
                  "dettagliato",
                  "no_invenzioni",
                ].map((v) => {
                  const checked = vincoliArray.includes(v);
                  return (
                    <label
                      key={v}
                      className="flex items-center gap-3 text-sm text-white/90 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVincolo(v)}
                        className="h-4 w-4"
                      />
                      <span>{v}</span>
                    </label>
                  );
                })}
              </div>

              {/* Libero (per “arriva anche da fuori”) */}
              <div className="space-y-2">
                <div className="text-xs text-white/60">
                  Vincoli extra (uno per riga). Qui puoi incollare roba “sporadica” senza rompere lo schema.
                </div>
                <textarea
                  value={vincoliText}
                  onChange={(e) => setVincoliFromText(e.target.value)}
                  placeholder={"Esempio:\n- evita emoji\n- non usare inglesismi\n- chiudi con 2 opzioni di slot"}
                  rows={4}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25"
                />
              </div>
            </div>
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
