// AICostPanel.tsx
"use client";

import type { AiUsage } from "@/types/ai";

export default function AICostPanel({
  aiUsage,
  onClose,
}: {
  aiUsage: AiUsage;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-[420px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">🤖 Costi AI</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            ✖
          </button>
        </div>

        <div className="text-sm space-y-3">
          <div className="border border-neutral-700 rounded-lg p-3">
            Totale:{" "}
            <span className="text-green-400 font-semibold">
              {aiUsage.totalCostUsd.toFixed(5)} USD
            </span>
          </div>

          {Object.entries(aiUsage.perProvider).map(([provider, v]) => (
            <div key={provider} className="border border-neutral-700 rounded-lg p-3">
              <div className="text-neutral-400 uppercase text-xs">{provider}</div>
              <div className="text-green-400">{v.costUsd.toFixed(5)} USD</div>
              <div className="text-neutral-500 text-xs">
                Chiamate: {v.calls} · Tokens: {v.tokens}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
