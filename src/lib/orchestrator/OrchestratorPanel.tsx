"use client";

import type { ProviderResponse } from "@/lib/orchestrator/types";

export default function OrchestratorPanel({
  data
}: {
  data: any;
}) {

  const autoPrompt = data?.meta?.autoPromptText || null;
  const memory = data?.memory || null;

  function judgeAutoPrompt(text: string | null): string {
    if (!text) return "Nessun auto-prompt generato.";

    const len = text.length;
    if (len < 80) return "⚠️ Molto corto — potrebbe risultare troppo debole.";
    if (len < 200) return "✔️ Buono — migliorato rispetto al testo originale.";
    if (len < 500) return "⭐⭐ Ottimo — struttura chiara e utile per i provider.";
    return "⭐⭐⭐ Eccellente — prompt ricco, strutturato e molto informativo.";
  }

  return (
    <div className="space-y-6 pb-10">

      {/* 🧠 INTENTO */}
      <div className="bg-neutral-900 p-4 rounded border border-neutral-700">
        <h2 className="font-semibold text-xl mb-3 text-blue-400">Intent</h2>

        {!data?.meta?.intent ? (
          <p className="text-neutral-500 text-sm">Nessun dato di intento.</p>
        ) : (
          <>
            <p className="text-sm text-neutral-300">
              <span className="text-neutral-400">Testo originale:</span>{" "}
              {data.meta.intent.original}
            </p>
            <p className="text-sm">
              <span className="text-neutral-400">Tipologia:</span>{" "}
              {data.meta.intent.purpose}
            </p>
            <p className="text-sm">
              <span className="text-neutral-400">Modalità:</span>{" "}
              {data.meta.intent.mode}
            </p>
            <p className="text-sm">
              <span className="text-neutral-400">Complessità:</span>{" "}
              {data.meta.intent.complexity}
            </p>
            <p className="text-sm">
              <span className="text-neutral-400">Small Talk:</span>{" "}
              {data.meta.intent.isSmallTalk ? "Sì" : "No"}
            </p>
            <p className="text-sm">
              <span className="text-neutral-400">Richiede Chiarimento:</span>{" "}
              {data.meta.intent.needsClarification ? "Sì" : "No"}
            </p>
            <p className="text-sm">
              <span className="text-neutral-400">Richiede Auto-Prompt:</span>{" "}
              {data.meta.intent.autoPromptNeeded ? "Sì" : "No"}
            </p>
          </>
        )}
      </div>

      {/* 🧠 MEMORIA DI SESSIONE */}
      <div className="bg-neutral-900 p-3 rounded border border-neutral-700">
       <h2 className="font-semibold text-lg mb-2 text-emerald-400">Memoria Sessione</h2>


        {!data?.meta?.memory ? (
          <p className="text-neutral-500 text-sm">Nessuna memoria disponibile.</p>
        ) : (
          <div className="space-y-2 text-sm text-neutral-200">
            <p>
              <span className="text-neutral-400">Obiettivi:</span>
              <br />
              {data.meta.memory.goals?.length
                ? data.meta.memory.goals.join("; ")
                : "Nessuno"}
            </p>

            <p>
              <span className="text-neutral-400">Ultimi prompt:</span>
              <br />
              {data.meta.memory.lastPrompts?.length
                ? data.meta.memory.lastPrompts.join(" | ")
                : "Nessuno"}
            </p>

            <p>
              <span className="text-neutral-400">Preferenze:</span>
              <br />
              Tono: {data.meta.memory.preferences?.tone || "–"}
              <br />
              Dettaglio: {data.meta.memory.preferences?.detail || "–"}
            </p>

            <p>
              <span className="text-neutral-400">Correzioni ricevute:</span>
              <br />
              {data.meta.memory.corrections?.length
                ? data.meta.memory.corrections.join(" | ")
                : "Nessuna"}
            </p>
          </div>
        )}
      </div>


      {/* AUTO-PROMPT */}
      {autoPrompt && (
        <div className="bg-neutral-900 p-4 rounded border border-neutral-700">
          <h2 className="font-semibold text-xl mb-4 text-yellow-400">
            Auto-Prompt generato
          </h2>

          <pre className="whitespace-pre-wrap text-sm bg-neutral-950 p-4 rounded border border-neutral-800 text-neutral-200">
            {autoPrompt}
          </pre>

          <div className="mt-3 text-sm text-neutral-400 italic">
            Valutazione: {judgeAutoPrompt(autoPrompt)}
          </div>
        </div>
      )}

      {/* PROVIDER */}
      <div className="bg-neutral-900 p-4 rounded border border-neutral-700">
        <h2 className="font-semibold text-xl mb-3 text-purple-400">
          Routing Provider
        </h2>

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

            <div className="mt-3 space-y-2">
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
                      <p>
                        <span className="text-neutral-400">Provider:</span>{" "}
                        {r.provider}
                      </p>
                      <p>
                        <span className="text-neutral-400">Successo:</span>{" "}
                        {r.success ? "Sì" : "No"}
                      </p>
                      <p>
                        <span className="text-neutral-400">Latenza:</span>{" "}
                        {r.latencyMs} ms
                      </p>
                      <p>
                        <span className="text-neutral-400">Token:</span>{" "}
                        {r.tokensUsed ?? 0}
                      </p>
                      {r.error && (
                        <p className="text-red-400 text-xs mt-1">
                          Errore: {r.error}
                        </p>
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
  );
}
