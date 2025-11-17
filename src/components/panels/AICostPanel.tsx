// ⬇️ BLOCCO — AI Cost Panel 2.0
"use client";

export default function AICostPanel({
  aiUsage,
  onClose,
}: {
  aiUsage: any;
  onClose: () => void;
}) {
  const providers = Object.entries(aiUsage.perProvider);

  const totalCost = aiUsage.totalCostUsd.toFixed(6);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-950 p-6 rounded-xl w-full max-w-3xl text-neutral-200 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">🤖 Costi AI</h2>
          <button onClick={onClose} className="text-2xl px-2">✕</button>
        </div>

        <div className="mb-6 bg-neutral-900 p-4 rounded-lg border border-neutral-800">
          <p className="text-neutral-400 text-sm">Totale:</p>
          <p className="text-green-400 text-xl">{totalCost} USD</p>
        </div>

        {providers.map(([key, data]: any) => (
          <div key={key} className="bg-neutral-900 p-4 mb-4 rounded-lg border border-neutral-800">
            <p className="font-semibold uppercase">{key}</p>
            <p>Chiamate: {data.calls}</p>
            <p>Token: {data.tokens}</p>
            <p className="text-green-400">{data.costUsd.toFixed(6)} USD</p>
          </div>
        ))}
      </div>
    </div>
  );
}
// ⬆️ FINE BLOCCO
