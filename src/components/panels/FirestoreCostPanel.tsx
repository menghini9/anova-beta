// ⬇️ BLOCCO — Firestore Cost 2.0
"use client";

export default function FirestoreCostPanel({
  totalReads,
  totalWrites,
  onClose,
}: {
  totalReads: number;
  totalWrites: number;
  onClose: () => void;
}) {
  const costReads = (totalReads / 100000) * 0.06;
  const costWrites = (totalWrites / 100000) * 0.18;

  const total = costReads + costWrites;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-950 p-6 rounded-xl w-full max-w-xl text-neutral-200">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">🔥 Costi Firestore</h2>
          <button onClick={onClose} className="text-2xl px-2">✕</button>
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
          <p className="text-neutral-400 text-sm">Totale:</p>
          <p className="text-green-400 text-2xl">{total.toFixed(6)} USD</p>
        </div>

      </div>
    </div>
  );
}
// ⬆️ FINE BLOCCO
