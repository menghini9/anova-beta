// FirestoreCostPanel.tsx
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-[420px]">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">🔥 Costi Firestore</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            ✖
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="border border-neutral-700 rounded-lg p-3">
            Letture: {totalReads} →{" "}
            <span className="text-green-400">{costReads.toFixed(5)} USD</span>
          </div>

          <div className="border border-neutral-700 rounded-lg p-3">
            Scritture: {totalWrites} →{" "}
            <span className="text-green-400">{costWrites.toFixed(5)} USD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
