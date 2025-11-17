// ⬇️ BLOCCO — Tech Panel 2.0
"use client";

export default function AITechPanel({ debugInfo, onClose }: {
  debugInfo: any;
  onClose: () => void;
}) {
  if (!debugInfo) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-neutral-950 p-6 rounded-xl w-full max-w-3xl text-neutral-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">🧠 Pannello Tecnico AI</h2>
            <button onClick={onClose} className="text-2xl px-2">✕</button>
          </div>
          <p className="text-neutral-400">Nessun dato tecnico disponibile.</p>
        </div>
      </div>
    );
  }

  const model     = debugInfo.model     ?? "";
  const provider  = debugInfo.provider  ?? "";
  const inTok     = debugInfo.inputTokens  ?? 0;
  const outTok    = debugInfo.outputTokens ?? 0;
  const fusion    = debugInfo.fusionScore ?? 1;
  const latency   = debugInfo.latencyMs   ?? 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-950 p-6 rounded-xl w-full max-w-3xl text-neutral-200 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">🧠 Pannello Tecnico AI</h2>
          <button onClick={onClose} className="text-2xl px-2">✕</button>
        </div>

        <div className="space-y-4">

          <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
            <p className="text-neutral-400 text-sm">Modello:</p>
            <p className="text-lg">{model}</p>
          </div>

          <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
            <p className="text-neutral-400 text-sm">Provider:</p>
            <p className="text-lg">{provider}</p>
          </div>

          <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
            <p className="text-neutral-400 text-sm">Token Input / Output:</p>
            <p className="text-lg">{inTok} / {outTok}</p>
          </div>

          <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
            <p className="text-neutral-400 text-sm">Fusion Score:</p>
            <p className="text-lg">{fusion}</p>
          </div>

          <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800">
            <p className="text-neutral-400 text-sm">Latency:</p>
            <p className="text-lg text-green-400">{latency} ms</p>
          </div>

        </div>
      </div>
    </div>
  );
}
// ⬆️ FINE BLOCCO
