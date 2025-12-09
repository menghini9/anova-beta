// ⬇️ BLOCCO 15.5 — ChatOrchestratorSidebar (orchestratore a tendina)
import OrchestratorPanel from "@/lib/orchestrator/OrchestratorPanel";

type Props = {
  open: boolean;
  width: number;
  setWidth: (w: number) => void;
  onClose: () => void;
  debugInfo: any;
};

export default function ChatOrchestratorSidebar({
  open,
  width,
  setWidth,
  onClose,
  debugInfo,
}: Props) {
  const meta = debugInfo?.meta ?? null;

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-neutral-950 border-l border-neutral-800
        z-40 transition-transform duration-200
        ${open ? "translate-x-0" : "translate-x-full"}`}
      style={{
        width: `${width}px`,
        minWidth: "80px",
        maxWidth: "100vw",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-black/90">
        <h2 className="text-lg font-semibold">Orchestratore</h2>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Contenuto */}
      <div className="h-full overflow-y-auto p-4">
        {debugInfo ? (
          <OrchestratorPanel data={debugInfo} />
        ) : (
          <p className="text-sm text-neutral-500">
            Nessun dato disponibile. Invia un messaggio per vedere l&apos;analisi
            dell&apos;orchestratore.
          </p>
        )}

        {/* ========================= */}
        {/* 🔶 FUSION SCORE PANEL     */}
        {/* ========================= */}
        {meta && meta.fusionDebug && (
          <div className="p-4 rounded-lg bg-neutral-900 mt-6">
            <h2 className="text-yellow-400 text-xl font-bold mb-2">
              Fusion Score
            </h2>

            <p className="text-sm text-neutral-300">
              <strong>Punteggio:</strong> {meta.fusionDebug.score ?? "-"}
            </p>

            <p className="text-sm text-neutral-300 mt-1">
              <strong>Provider usati:</strong>{" "}
              {(meta.fusionDebug.usedProviders ?? []).join(", ") || "-"}
            </p>

            <p className="text-sm text-neutral-300 mt-1">
              <strong>Provider scartati:</strong>{" "}
              {(meta.fusionDebug.discardedProviders ?? []).join(", ") || "-"}
            </p>

            <p className="text-sm text-neutral-300 mt-1">
              <strong>Dominio stimato:</strong>{" "}
              {meta.fusionDebug.domain ?? "-"}
            </p>

            <p className="text-sm text-neutral-400 mt-2 italic">
              {meta.fusionDebug.finalTextPreview}
            </p>
          </div>
        )}
      </div>

      {/* Maniglia drag */}
      <div
        className="absolute left-0 top-0 h-full w-[6px] cursor-ew-resize bg-neutral-800/30 hover:bg-neutral-700/50"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = width;

          const onMove = (ev: MouseEvent) => {
            const delta = startX - ev.clientX;
            const newWidth = startWidth + delta;

            if (newWidth < 80) {
              onClose();
              return;
            }

            if (newWidth >= 80 && newWidth <= window.innerWidth) {
              setWidth(newWidth);
            }
          };

          const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />
    </div>
  );
}
// ⬆️ FINE BLOCCO 15.5 — ChatOrchestratorSidebar
