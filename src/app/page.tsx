"use client";
// ⬇️ BLOCCO 3 — HomePage (Chat Chiusa + 5 Scelte)

import Link from "next/link";

const INTENTS = [
  { key: "scrittura", label: "SCRITTURA", desc: "testi, email, documenti, piani" },
  { key: "riscrittura", label: "RISCRITTURA", desc: "sintesi, traduzione, miglioramento" },
  { key: "problema", label: "PROBLEMA", desc: "bug, errori, diagnosi" },
  { key: "decisione", label: "DECISIONE", desc: "opzioni, pro/contro, scelta" },
  { key: "codice", label: "CODICE", desc: "sviluppo, integrazioni, automazioni" },
  { key: "informazione", label: "INFORMAZIONE", desc: "spiegazioni, ricerca, sintesi, contesto" },

];

export default function HomePage() {
  return (
    <main className="h-screen w-full flex flex-col justify-center items-center text-center bg-neutral-950 text-white select-none overflow-hidden">
      {/* 🔹 TESTO CENTRALE */}
      <div className="px-6">
        <h1 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight">
          <span className="text-white">Anova</span>
          <span className="text-neutral-500"> β</span>
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          HOME — chat chiusa. <br />
          Scegli il tipo di lavoro per aprire la pagina di lavoro e avviare il brief.
        </p>
      </div>

      {/* 🔹 5 SCELTE */}
      <div className="mt-10 w-full max-w-3xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTENTS.map((i) => (
            <Link
              key={i.key}
              href={`/work/${i.key}`}
              className="group border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 px-5 py-4 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold tracking-wide">{i.label}</div>
                <div className="text-neutral-500 group-hover:text-neutral-300 transition-colors">→</div>
              </div>
              <div className="text-neutral-400 text-sm mt-1">{i.desc}</div>
            </Link>
          ))}
        </div>

        <div className="text-neutral-500 text-xs mt-6">
          Nota operativa: la chat si apre solo dopo i brief + conferme (poi “Open Chat” per contesto, poi Produzione).
        </div>
      </div>
    </main>
  );
}
// ⬆️ FINE BLOCCO 3
