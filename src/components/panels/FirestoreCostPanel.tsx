// ⬇️ BLOCCO — Firestore Cost 2.1 (Stima cumulativa + dettagli)
// Path: /src/components/panels/FirestoreCostPanel.tsx

"use client";

type Props = {
  totalReads: number;
  totalWrites: number;
  onClose: () => void;
};

export default function FirestoreCostPanel({
  totalReads,
  totalWrites,
  onClose,
}: Props) {
  // 🔢 Tariffe di riferimento (standard Firestore, per 100k operazioni)
  const READ_PRICE_PER_100K = 0.06;  // USD
  const WRITE_PRICE_PER_100K = 0.18; // USD

  // 💰 Conversione in costo
  const costReads = (totalReads / 100000) * READ_PRICE_PER_100K;
  const costWrites = (totalWrites / 100000) * WRITE_PRICE_PER_100K;
  const total = costReads + costWrites;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-950 p-6 rounded-xl w-full max-w-xl text-neutral-200 border border-neutral-800">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">🔥 Stima costi Firestore</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Stima locale basata sui contatori della tua app (non dati reali di fatturazione).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl px-2 text-neutral-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Totale */}
        <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 mb-4">
          <p className="text-neutral-400 text-sm">Totale stimato</p>
          <p className="text-green-400 text-3xl font-semibold">
            {total.toFixed(6)} <span className="text-sm text-neutral-400">USD</span>
          </p>
        </div>

        {/* Dettaglio letture/scritture */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
            <p className="text-neutral-400 text-xs mb-1">Letture (read)</p>
            <p className="text-lg font-semibold">{totalReads}</p>
            <p className="text-xs text-neutral-500 mt-1">
              Costo stimato:{" "}
              <span className="text-green-400">
                {costReads.toFixed(6)} USD
              </span>
            </p>
          </div>

          <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
            <p className="text-neutral-400 text-xs mb-1">Scritture (write)</p>
            <p className="text-lg font-semibold">{totalWrites}</p>
            <p className="text-xs text-neutral-500 mt-1">
              Costo stimato:{" "}
              <span className="text-green-400">
                {costWrites.toFixed(6)} USD
              </span>
            </p>
          </div>
        </div>

        {/* Nota tariffe */}
        <div className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3">
          <p>
            Tariffe usate:{" "}
            <span className="text-neutral-300">
              {READ_PRICE_PER_100K.toFixed(2)} USD / 100k read,{" "}
              {WRITE_PRICE_PER_100K.toFixed(2)} USD / 100k write
            </span>
            .
          </p>
          <p className="mt-1">
            I valori sono{" "}
            <span className="text-neutral-300">solo una stima locale</span>:
            il conto reale rimane quello della console Firebase.
          </p>
        </div>
      </div>
    </div>
  );
}
// ⬆️ FINE BLOCCO — Firestore Cost 2.1
