// ⬇️ BLOCCO 3 — HomePage Beta (Full Screen Fix + Layout Integration)
"use client";

import Link from "next/link";

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
          Strumento di lavoro intelligente.  
          Ponte diretto tra mente umana e intelligenze artificiali.  
          Un solo ambiente, molteplici menti.
        </p>
      </div>

      {/* 🔹 AREA PULSANTE CENTRALE */}
      <div className="mt-10 flex gap-6">
     <Link
  href="/chat"
  className="bg-white text-black hover:bg-neutral-200 active:bg-neutral-100 px-8 py-3 rounded-lg font-medium transition-colors shadow-md"
  style={{ color: "#000" }}
>
  Apri Chat
</Link>


      </div>
    </main>
  );
}
// ⬆️ FINE BLOCCO 3
