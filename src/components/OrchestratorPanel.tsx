// ⬇️ BLOCCO OP1 — OrchestratorPanel (Struttura)
// ANOVA_ORCHESTRATOR_V50_PANEL

"use client";

import { useState } from "react";

export default function OrchestratorPanel({ data }: { data: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 🔵 PULSANTE FLOTANTE APRI/CHIUDI */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-4 z-40 bg-blue-600 text-white px-3 py-2 rounded shadow"
      >
        {open ? "Chiudi Orchestratore" : "Apri Orchestratore"}
      </button>

      {/* 🔵 PANELLO LATERALE */}
      <div
        className={`
          fixed top-0 right-0 h-screen w-[380px]
          bg-black text-white overflow-y-auto
          transition-transform duration-300
          z-30 shadow-xl
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="p-4 space-y-4">
          <h1 className="text-xl font-bold">Orchestratore</h1>

          {/* 🔵 INFO FUTURE (per ora placeholder) */}
          <div className="text-gray-300">
            <p>Qui comparirà il ragionamento di Anova ß.</p>
            <p>Dati, provider, intent, fusion… tutto.</p>
          </div>

          {/* 🔵 DEBUG DATA */}
          {data && (
            <pre className="text-xs whitespace-pre-wrap bg-gray-900 p-3 rounded mt-4">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </>
  );
}

// ⬆️ FINE BLOCCO OP1
