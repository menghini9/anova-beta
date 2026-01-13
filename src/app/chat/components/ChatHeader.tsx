"use client";

import type { Dispatch, SetStateAction } from "react";

type Props = {
  sessionId: string | null;
  sessionTitle: string;
  setSessionTitle: Dispatch<SetStateAction<string>>;
  editingTitle: boolean;
  setEditingTitle: Dispatch<SetStateAction<boolean>>;
  onCommitTitle: () => void;

  onOpenArchive: () => void;
  onOpenTrash: () => void;
  onNewSession: () => void;
  onAddTab: () => void;
};

export default function ChatHeader({
  sessionId,
  sessionTitle,
  setSessionTitle,
  editingTitle,
  setEditingTitle,
  onCommitTitle,
  onOpenArchive,
  onOpenTrash,
  onNewSession,
  onAddTab,
}: Props) {
  const label = sessionTitle?.trim()
    ? sessionTitle
    : sessionId
    ? `Chat #${sessionId.slice(-6)}`
    : "Chat";

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-black/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: brand + title */}
        <div className="min-w-0 flex items-center gap-3">
          <div className="shrink-0 text-lg font-semibold">
            Anova<span className="text-neutral-500"> β</span>
          </div>

          {/* Title */}
          <div className="min-w-0">
            {editingTitle ? (
              <input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                onBlur={onCommitTitle}
                onKeyDown={(e) => e.key === "Enter" && onCommitTitle()}
                className="w-[260px] max-w-[50vw] rounded-lg bg-neutral-950 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-white/25"
                autoFocus
                placeholder={sessionId ? `Chat #${sessionId.slice(-6)}` : "Titolo chat"}
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="max-w-[50vw] truncate rounded-lg border border-white/10 bg-white/0 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                title="Rinomina chat"
              >
                {label}
              </button>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={onOpenArchive}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"
          >
            Archivio
          </button>

          <button
            onClick={onOpenTrash}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/75 hover:bg-white/5 hover:text-white"
          >
            Cestino
          </button>

          <button
            onClick={onNewSession}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/85 hover:bg-white/5"
            title="Nuova chat"
          >
            + Chat
          </button>

          <button
            onClick={onAddTab}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/85 hover:bg-white/5"
            title="Nuova sotto-chat"
          >
            + Tab
          </button>
        </div>
      </div>
    </header>
  );
}
