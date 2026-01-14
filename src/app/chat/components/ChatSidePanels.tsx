"use client";
// ======================================================
// ChatSidePanels — ChatGPT-like Sidebar (Bigger + Brighter)
// Path: src/app/chat/components/ChatSidePanels.tsx
// ======================================================

import { useMemo, useState } from "react";

type SessionMetaLite = {
  id: string;
  title?: string | null;
  lastMessage?: string | null;
};

type Props = {
  showArchive: boolean;
  showTrash: boolean;
  setShowArchive: (open: boolean) => void;
  setShowTrash: (open: boolean) => void;

  sessions: SessionMetaLite[];
  trashSessions: SessionMetaLite[];

  inlineEditId: string | null;
  inlineEditValue: string;
  setInlineEditValue: (v: string) => void;

  startInlineRename: (id: string, currentTitle?: string | null) => void;
  commitInlineRename: (id: string) => void | Promise<void>;
  handleOpenSession: (id: string) => void;
  handleDeleteSession: (id: string) => void | Promise<void>;
  handleRestoreSession: (id: string) => void | Promise<void>;

  onNewSession: () => void;
  onAddTab: () => void;
};

export default function ChatSidePanels(props: Props) {
  const {
    showArchive,
    showTrash,
    setShowArchive,
    setShowTrash,
    sessions,
    trashSessions,
    inlineEditId,
    inlineEditValue,
    setInlineEditValue,
    startInlineRename,
    commitInlineRename,
    handleOpenSession,
    handleDeleteSession,
    handleRestoreSession,
    onNewSession,
  } = props;

  const mode: "archive" | "trash" = showTrash ? "trash" : "archive";
  const [search, setSearch] = useState("");

  const list = mode === "archive" ? sessions : trashSessions;

  const filtered = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return list;

    return list.filter((s) => {
      const title = (s.title || "").toLowerCase();
      const id = s.id.toLowerCase();
      const last = (s.lastMessage || "").toLowerCase();
      return title.includes(t) || id.includes(t) || last.includes(t);
    });
  }, [list, search]);

  return (
    <aside className="w-[340px] shrink-0 border-r border-white/10 bg-neutral-950/85 backdrop-blur h-screen sticky top-0">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowTrash(false);
              setShowArchive(true);
            }}
            className={`h-10 px-4 rounded-xl border text-[14px] font-semibold transition ${
              mode === "archive"
                ? "border-white/25 bg-white/12 text-white"
                : "border-white/10 bg-transparent text-white/70 hover:bg-white/5"
            }`}
          >
            Archivio
          </button>

          <button
            onClick={() => {
              setShowArchive(false);
              setShowTrash(true);
            }}
            className={`h-10 px-4 rounded-xl border text-[14px] font-semibold transition ${
              mode === "trash"
                ? "border-white/25 bg-white/12 text-white"
                : "border-white/10 bg-transparent text-white/70 hover:bg-white/5"
            }`}
          >
            Cestino
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewSession}
            className="h-10 px-4 rounded-xl border border-white/15 bg-white/10 text-[14px] font-semibold text-white hover:bg-white/14 hover:border-white/30 transition"
            title="Nuova chat"
          >
            + Chat
          </button>

          <button
            onClick={() => {
              setShowTrash(false);
              setShowArchive(true);
            }}
            className="h-10 w-10 rounded-xl border border-white/10 bg-transparent text-white/70 hover:bg-white/5 transition"
            title="Reset vista"
          >
            ⟲
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-4 border-b border-white/10">
        <input
          type="text"
          placeholder={mode === "archive" ? "Cerca chat…" : "Cerca nel cestino…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 rounded-2xl bg-black/35 border border-white/12 px-4 text-[14px] text-white placeholder-white/35 outline-none focus:border-white/25"
        />
      </div>

      {/* List */}
      <div className="px-2 py-2 overflow-y-auto h-[calc(100vh-64px-80px)]">
        {filtered.length === 0 ? (
          <div className="text-white/45 text-[14px] px-4 py-6">
            {mode === "archive" ? "Nessuna chat." : "Cestino vuoto."}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((s) => {
              const title = s.title?.trim() ? s.title : `#${s.id.slice(-6)}`;
              const last = s.lastMessage || "—";

              return (
                <div
                  key={s.id}
                  className="group rounded-2xl px-3 py-3 hover:bg-white/6 border border-transparent hover:border-white/10 transition"
                >
                  <div className="flex items-center gap-2">
                    {/* Main clickable area */}
                    {inlineEditId === s.id ? (
                      <input
                        value={inlineEditValue}
                        onChange={(e) => setInlineEditValue(e.target.value)}
                        onBlur={() => commitInlineRename(s.id)}
                        onKeyDown={(e) => e.key === "Enter" && commitInlineRename(s.id)}
                        autoFocus
                        className="flex-1 h-10 rounded-xl bg-black/40 border border-white/12 px-3 text-[14px] text-white outline-none focus:border-white/25"
                      />
                    ) : (
                      <button
                        onClick={() => mode === "archive" && handleOpenSession(s.id)}
                        className="flex-1 text-left"
                      >
                        <div className="text-[14px] text-white/90 font-semibold line-clamp-1">
                          {title}
                        </div>
                        <div className="text-[13px] text-white/45 line-clamp-1 mt-1">
                          {last}
                        </div>
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() =>
                          inlineEditId === s.id
                            ? commitInlineRename(s.id)
                            : startInlineRename(s.id, s.title)
                        }
                        className="h-9 w-9 rounded-xl border border-white/12 bg-transparent hover:bg-white/10 text-[14px] text-white/85 transition"
                        title="Rinomina"
                      >
                        ✏️
                      </button>

                      {mode === "archive" ? (
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="h-9 w-9 rounded-xl border border-white/12 bg-transparent hover:bg-red-500/12 text-[14px] text-white/85 hover:text-red-200 transition"
                          title="Sposta nel cestino"
                        >
                          🗑️
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreSession(s.id)}
                          className="h-9 w-9 rounded-xl border border-white/12 bg-transparent hover:bg-emerald-500/12 text-[14px] text-white/85 hover:text-emerald-200 transition"
                          title="Ripristina"
                        >
                          ♻️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
