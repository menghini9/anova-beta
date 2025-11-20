// ⬇️ BLOCCO OP1 — OrchestratorPanel (Controllato esternamente)
// ANOVA_ORCHESTRATOR_V50_PANEL

"use client";

import type { ProviderResponse } from "@/lib/orchestrator/types";

export default function OrchestratorPanel({
  data,
  open,
  onClose,
}: {
  data: any;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={`
        fixed top-0 right-0 h-screen w-[420px]
        bg-black text-white overflow-y-auto
        transition-transform duration-300
        z-40 shadow-xl border-l border-neutral-800
        ${open ? "translate-x-0" : "translate-x-full"}
      `}
    >
      {/* HEADER */}
      <div className="p-4 flex justify-between items-center border-b border-neutral-800">
        <h1 className="text-xl font-bold">Orchestratore</h1>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">

        {/* 🧠 INTENTO */}
        <div className="bg-neutral-900 p-3 rounded border border-neutral-700">
          <h2 className="font-semibold text-lg mb-2 text-blue-400">INTENTO</h2>

          {!data?.meta?.intent ? (
            <p className="text-neutral-500 text-sm">Nessun dato di intento.</p>
          ) : (
            <div className="space-y-1 text-sm text-neutral-200">
              <p><span className="text-neutral-400">Testo originale:</span> {data.meta.intent.original}</p>
              <p><span className="text-neutral-400">Tipologia:</span> {data.meta.intent.purpose}</p>
              <p><span className="text-neutral-400">Modalità:</span> {data.meta.intent.mode}</p>
              <p><span className="text-neutral-400">Complessità:</span> {data.meta.intent.complexity}</p>
              <p><span className="text-neutral-400">Small Talk:</span> {data.meta.intent.isSmallTalk ? "Sì" : "No"}</p>
              <p><span className="text-neutral-400">Richiede Chiarimento:</span> {data.meta.intent.needsClarification ? "Sì" : "No"}</p>
              <p><span className="text-neutral-400">Richiede Auto-Prompt:</span> {data.meta.intent.autoPromptNeeded ? "Sì" : "No"}</p>

              {data.meta.intent.keywords?.length > 0 && (
                <p>
                  <span className="text-neutral-400">Parole chiave:</span>{" "}
                  {data.meta.intent.keywords.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 🔌 ROUTING PROVIDER */}
        <div className="bg-neutral-900 p-3 rounded border border-neutral-700 mt-4">
          <h2 className="font-semibold text-lg mb-2 text-purple-400">Routing Provider</h2>

          {!data?.meta?.stats ? (
            <p className="text-neutral-500 text-sm">Nessun dato di routing.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-neutral-400">Provider richiesti:</span>{" "}
                {data.meta.stats.providersRequested?.length > 0
                  ? data.meta.stats.providersRequested.join(", ")
                  : "Nessuno"}
              </p>

              <p>
                <span className="text-neutral-400">Numero chiamate:</span>{" "}
                {data.meta.stats.callsThisRequest ?? 0}
              </p>

              <div className="mt-2 space-y-2">
                <span className="text-neutral-400">Dettaglio risposte:</span>

                {data.raw && data.raw.length > 0 ? (
                  <ul className="mt-1 space-y-2">
                    {data.raw.map((r: ProviderResponse, i: number) => (
                      <li
                        key={i}
                        className={`p-2 rounded border ${
                          r.success
                            ? "border-green-600 bg-green-900/20"
                            : "border-red-600 bg-red-900/20"
                        }`}
                      >
                        <p><span className="text-neutral-400">Provider:</span> {r.provider}</p>
                        <p><span className="text-neutral-400">Successo:</span> {r.success ? "Sì" : "No"}</p>
                        <p><span className="text-neutral-400">Latenza:</span> {r.latencyMs} ms</p>
                        <p><span className="text-neutral-400">Token:</span> {r.tokensUsed ?? 0}</p>
                        {r.error && (
                          <p className="text-red-400 text-xs mt-1">Errore: {r.error}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-neutral-600">Nessuna risposta.</p>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ⬆️ FINE BLOCCO OP1
