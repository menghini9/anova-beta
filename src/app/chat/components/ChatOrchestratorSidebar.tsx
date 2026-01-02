"use client";
// ======================================================
// ChatOrchestratorSidebar — V2 (LEAN)
// Path: src/app/chat/components/ChatOrchestratorSidebar.tsx
// Solo: Contratto + Routing Provider (stop Intent, stop Memoria Sessione)
// ======================================================

import { useEffect, useRef } from "react";

type ContractSection = { title: string; lines: string[] };

type Props = {
  open: boolean;
  width: number;
  setWidth: (n: number) => void;
  onClose: () => void;
  debugInfo: any | null;
  contract?: ContractSection[] | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ChatOrchestratorSidebar({
  open,
  width,
  setWidth,
  onClose,
  debugInfo,
  contract,
}: Props) {
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const next = clamp(window.innerWidth - e.clientX, 320, 760);
      setWidth(next);
    };

    const onUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setWidth]);

  if (!open) return null;

  const raw = Array.isArray(debugInfo?.raw) ? debugInfo.raw : [];
  const providersRequested =
    debugInfo?.meta?.stats?.providersRequested ??
    debugInfo?.meta?.providersRequested ??
    (raw.length ? raw.map((r: any) => r.provider) : []);

  return (
    <aside
      className="fixed top-0 right-0 h-screen bg-neutral-950 border-l border-neutral-800 z-40"
      style={{ width }}
    >
      {/* Drag handle */}
      <div
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent"
        onMouseDown={() => {
          draggingRef.current = true;
        }}
        title="Trascina per ridimensionare"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="font-semibold text-white">Orchestratore</div>
        <button
          className="text-neutral-400 hover:text-white text-lg leading-none"
          onClick={onClose}
          aria-label="Chiudi"
          title="Chiudi"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-56px)]">
        {/* CONTRATTO */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="text-sm font-semibold text-white">Contratto (Brief → AI)</div>
          <div className="text-xs text-neutral-400 mt-1">
            Questo è ciò che verrà passato al modello. Qui si decide la produzione.
          </div>

          {!contract || contract.length === 0 ? (
            <div className="text-sm text-neutral-300 mt-3">
              Nessun contratto disponibile (brief non pronto o non in modalità progetto).
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {contract.map((s) => (
                <div key={s.title}>
                  <div className="text-sm font-semibold text-white/90">{s.title}</div>
                  <ul className="list-disc ml-5 mt-1 text-sm text-white/70 space-y-0.5">
                    {s.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROUTING PROVIDER */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
          <div className="text-sm font-semibold text-white">Routing Provider</div>

          <div className="text-sm text-neutral-300 mt-3">
            <div className="text-xs text-neutral-400">Provider richiesti:</div>
            <div className="mt-1">
              {Array.isArray(providersRequested) && providersRequested.length > 0
                ? providersRequested.join(", ")
                : "—"}
            </div>

            <div className="text-xs text-neutral-400 mt-3">Numero chiamate:</div>
            <div className="mt-1">{raw.length}</div>
          </div>

          <div className="mt-3">
            <div className="text-xs text-neutral-400 mb-2">Dettaglio risposte:</div>

            {raw.length === 0 ? (
              <div className="text-sm text-neutral-300">Nessuna risposta provider.</div>
            ) : (
              <div className="space-y-2">
                {raw.map((r: any, i: number) => (
                  <div
                    key={`${r.provider ?? "provider"}_${i}`}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm"
                  >
                    <div>
                      Provider: <b className="text-white">{r.provider ?? "—"}</b>
                    </div>
                    <div>
                      Successo: <b className="text-white">{String(!!r.success).toUpperCase()}</b>
                    </div>
                    <div>
                      Latenza: <b className="text-white">{r.latencyMs ?? 0} ms</b>
                    </div>
                    <div>
                      Token: <b className="text-white">{r.tokensUsed ?? 0}</b>
                    </div>
                    {r.error ? (
                      <div className="mt-1 text-amber-200">Errore: {String(r.error)}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
