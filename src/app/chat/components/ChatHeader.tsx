// ⬇️ BLOCCO 15.1 — ChatHeader (barra superiore fissa)
import { Dispatch, SetStateAction } from "react";

type Props = {
  sessionId: string | null;
  sessionTitle: string;
  setSessionTitle: Dispatch<SetStateAction<string>>;
  editingTitle: boolean;
  setEditingTitle: Dispatch<SetStateAction<boolean>>;
  onCommitTitle: () => void;
  onNewSession: () => void;

  showArchive: boolean;
  showTrash: boolean;
  onToggleArchive: () => void;
  onToggleTrash: () => void;

  showPanelsMenu: boolean;
  setShowPanelsMenu: Dispatch<SetStateAction<boolean>>;
  onOpenAICostPanel: () => void;
  onOpenFirestorePanel: () => void;

  showOrchestrator: boolean;
  onToggleOrchestrator: () => void;
};

export default function ChatHeader(props: Props) {
  const {
    sessionId,
    sessionTitle,
    setSessionTitle,
    editingTitle,
    setEditingTitle,
    onCommitTitle,
    onNewSession,
    onToggleArchive,
    onToggleTrash,
    showPanelsMenu,
    setShowPanelsMenu,
    onOpenAICostPanel,
    onOpenFirestorePanel,
    showOrchestrator,
    onToggleOrchestrator,
  } = props;

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-neutral-800 bg-black/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">
          Anova<span className="text-neutral-500"> β</span> — Chat
        </h2>

        <div className="flex items-center gap-2">
          {editingTitle ? (
            <input
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              onBlur={onCommitTitle}
              onKeyDown={(e) => e.key === "Enter" && onCommitTitle()}
              className="text-xs px-2 py-1 bg-neutral-900 border border-neutral-700 rounded"
              autoFocus
              placeholder={sessionId ? `#${sessionId.slice(-6)}` : "#sessione"}
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-xs px-2 py-1 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:border-neutral-500"
              title="Rinomina sessione"
            >
              {sessionTitle?.trim()
                ? sessionTitle
                : sessionId
                ? `#${sessionId.slice(-6)}`
                : "Sessione"}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Archivio */}
        <button
          onClick={onToggleArchive}
          className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition"
        >
          Archivio
        </button>

        {/* Cestino */}
        <button
          onClick={onToggleTrash}
          className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition"
        >
          Cestino
        </button>

        {/* Menu pannelli */}
        <div className="relative">
          <button
            onClick={() => setShowPanelsMenu((v) => !v)}
            className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition cursor-pointer select-none"
          >
            Pannelli ▼
          </button>

          {showPanelsMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-40 p-2 space-y-1">
              <button
                onClick={() => {
                  setShowPanelsMenu(false);
                  onOpenAICostPanel();
                }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 rounded-lg"
              >
                🤖 Costi AI
              </button>

              <button
                onClick={() => {
                  setShowPanelsMenu(false);
                  onOpenFirestorePanel();
                }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-800 rounded-lg"
              >
                🔥 Costi Firestore
              </button>
            </div>
          )}
        </div>

        {/* Orchestratore */}
        <button
          onClick={onToggleOrchestrator}
          className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition"
        >
          {showOrchestrator ? "Chiudi Orchestratore" : "Orchestratore >"}
        </button>

        {/* Nuova Chat */}
        <button
          onClick={onNewSession}
          className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition"
        >
          Nuova Chat
        </button>
      </div>
    </header>
  );
}
// ⬆️ FINE BLOCCO 15.1 — ChatHeader
