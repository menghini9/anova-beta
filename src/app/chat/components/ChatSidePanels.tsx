"use client";
// ======================================================
// ChatSidePanels — V2 (Archivio + Cestino) CLEAN
// Path: src/app/chat/components/ChatSidePanels.tsx
// Fix:
// - un solo pannello laterale
// - overlay cliccabile per chiudere
// - archivio/cestino switch interno
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
  } = props;

  const open = showArchive || showTrash;
  const mode: "archive" | "trash" = showTrash ? "trash" : "archive";

  const [search, setSearch] = useState("");

  const rows = mode === "archive" ? sessions : trashSessions;

  const filtered = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return rows;
    return rows.filter((s) => {
      const title = (s.title || "").toLowerCase();
      const id = s.id.toLowerCase();
      const last = (s.lastMessage || "").toLowerCase();
      return title.includes(t) || id.includes(t) || last.includes(t);
    });
  }, [rows, search]);

  function closeAll() {
    setShowArchive(false);
    setShowTrash(false);
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30"
          onClick={closeAll}
          aria-hidden
        />
      )}

      {/* Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-neutral-950 border-r border-neutral-800 z-40 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowTrash(false);
                setShowArchive(true);
                setSearch("");
              }}
              className={`text-sm px-2 py-1 rounded border ${
                mode === "archive"
                  ? "border-white/20 bg-white/5 text-white"
                  : "border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Archivio
            </button>
            <button
              onClick={() => {
                setShowArchive(false);
                setShowTrash(true);
                setSearch("");
              }}
              className={`text-sm px-2 py-1 rounded border ${
                mode === "trash"
                  ? "border-white/20 bg-white/5 text-white"
                  : "border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Cestino
            </button>
          </div>

          <button onClick={closeAll} className="text-sm text-neutral-400 hover:text-white">
            Chiudi
          </button>
        </div>

        <div className="px-4 py-3 border-b border-neutral-800">
          <input
            type="text"
            placeholder={mode === "archive" ? "Cerca chat…" : "Cerca nel cestino…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-white"
          />
        </div>

        <div className="p-3 overflow-y-auto h-[calc(100%-110px)] space-y-2">
          {filtered.length === 0 ? (
            <div className="text-neutral-600 text-sm px-2 py-4">
              {mode === "archive" ? "Nessuna sessione." : "Nessuna sessione cestinata."}
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="border border-neutral-800 rounded-lg p-2 hover:bg-neutral-900 transition"
              >
                <div className="flex items-center gap-2">
                  {inlineEditId === s.id ? (
                    <input
                      value={inlineEditValue}
                      onChange={(e) => setInlineEditValue(e.target.value)}
                      onBlur={() => commitInlineRename(s.id)}
                      onKeyDown={(e) => e.key === "Enter" && commitInlineRename(s.id)}
                      autoFocus
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
                    />
                  ) : mode === "archive" ? (
                    <button
                      onClick={() => handleOpenSession(s.id)}
                      className="text-left text-sm flex-1"
                    >
                      <div className="text-xs text-neutral-400">
                        {s.title?.trim() ? s.title : `#${s.id.slice(-6)}`}
                      </div>
                      <div className="line-clamp-1 text-neutral-300">{s.lastMessage || "—"}</div>
                    </button>
                  ) : (
                    <div className="flex-1">
                      <div className="text-neutral-400 line-clamp-1">
                        {s.title?.trim() ? s.title : `#${s.id.slice(-6)}`}
                      </div>
                      <div className="text-neutral-600 text-xs line-clamp-1">{s.lastMessage || "—"}</div>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      inlineEditId === s.id
                        ? commitInlineRename(s.id)
                        : startInlineRename(s.id, s.title)
                    }
                    className="text-neutral-400 hover:text-white text-xs px-2"
                    title="Rinomina"
                  >
                    ✏️
                  </button>

                  {mode === "archive" ? (
                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      className="text-neutral-500 hover:text-red-400 text-xs px-2"
                      title="Cestina"
                    >
                      🗑️
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestoreSession(s.id)}
                      className="text-green-400 hover:text-green-300 text-xs px-2"
                      title="Ripristina"
                    >
                      ♻️
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
