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
   <OrchestratorPanel
  data={debugInfo}
  open={open}
  onClose={onClose}
/>


        ) : (
          <p className="text-sm text-neutral-500">
            Nessun dato disponibile. Invia un messaggio per vedere l&apos;analisi dell&apos;orchestratore.
          </p>
        )}
      </div>

      {/* Maniglia drag */}
     <div
  className="absolute left-0 top-0 h-full w-[6px] cursor-ew-resize bg-neutral-800/30 hover:bg-neutral-700/50 z-[9999]"
  style={{ touchAction: "none", userSelect: "none" }}
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
