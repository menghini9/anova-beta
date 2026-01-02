"use client";
// ======================================================
// ChatHeader (V2 MIN)
// Path: /src/app/chat/components/ChatHeader.tsx
// Obiettivo: SOLO titolo sessione + toggle Orchestratore
// ======================================================

import type { Dispatch, SetStateAction } from "react";

type Props = {
  sessionId: string | null;
  sessionTitle: string;
  setSessionTitle: Dispatch<SetStateAction<string>>;
  editingTitle: boolean;
  setEditingTitle: Dispatch<SetStateAction<boolean>>;
  onCommitTitle: () => void;

  showOrchestrator: boolean;
  onToggleOrchestrator: () => void;
};

export default function ChatHeader({
  sessionId,
  sessionTitle,
  setSessionTitle,
  editingTitle,
  setEditingTitle,
  onCommitTitle,
  showOrchestrator,
  onToggleOrchestrator,
}: Props) {
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
        <button
          onClick={onToggleOrchestrator}
          className="px-3 py-1 text-sm border border-neutral-700 rounded-lg hover:bg-neutral-900 transition"
        >
          {showOrchestrator ? "Chiudi Orchestratore" : "Orchestratore ▶"}
        </button>
      </div>
    </header>
  );
}
