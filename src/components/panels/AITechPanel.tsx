// AITechPanel.tsx
"use client";

export default function AITechPanel({
  debugInfo,
  onClose,
}: {
  debugInfo: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 w-[420px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">🧠 Pannello Tecnico AI</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            ✖
          </button>
        </div>

        <pre className="text-xs text-neutral-300 whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}
