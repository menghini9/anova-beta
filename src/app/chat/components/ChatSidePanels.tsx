"use client";
// ======================================================
// ChatSidePanels — ChatGPT-like Sidebar (NO TRASH)
// Path: src/app/chat/components/ChatSidePanels.tsx
// ======================================================

import { useMemo, useState } from "react";

type SessionMetaLite = {
  id: string;
  title?: string | null;
  lastMessage?: string | null;
};

type Props = {
  sessions: SessionMetaLite[];
  activeSessionId: string | null;

  inlineEditId: string | null;
  inlineEditValue: string;
  setInlineEditValue: (v: string) => void;
  startInlineRename: (id: string, currentTitle?: string | null) => void;
  commitInlineRename: (id: string) => void | Promise<void>;

  handleOpenSession: (id: string) => void;
  handleDeleteSession: (id: string) => void | Promise<void>;

  onNewSession: () => void;

  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

export default function ChatSidePanels(props: Props) {
  const {
    sessions,
    activeSessionId,
    inlineEditId,
    inlineEditValue,
    setInlineEditValue,
    startInlineRename,
    commitInlineRename,
    handleOpenSession,
    handleDeleteSession,
    onNewSession,
    sidebarOpen,
    setSidebarOpen,
  } = props;

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return sessions;

    return sessions.filter((s) => {
      const title = (s.title || "").toLowerCase();
      const id = s.id.toLowerCase();
      const last = (s.lastMessage || "").toLowerCase();
      return title.includes(t) || id.includes(t) || last.includes(t);
    });
  }, [sessions, search]);

  return (
    <aside
      className={[
        "h-screen sticky top-0 shrink-0 border-r border-white/10 bg-neutral-950/85 backdrop-blur overflow-hidden",
        "transition-[width] duration-200 ease-out",
        sidebarOpen ? "w-[340px]" : "w-0",
      ].join(" ")}
      aria-hidden={!sidebarOpen}
    >
      <div className={sidebarOpen ? "w-[340px]" : "w-[340px] pointer-events-none"}>
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
          <button
            onClick={onNewSession}
            className="h-10 px-4 rounded-xl border border-white/15 bg-white/10 text-[14px] font-semibold text-white hover:bg-white/14 hover:border-white/30 transition flex items-center gap-2"
            title="Nuova chat"
          >
            <span className="text-[18px] leading-none">+</span>
            <span>Nuova chat</span>
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="h-10 w-10 rounded-xl border border-white/10 bg-transparent text-white/70 hover:bg-white/5 transition flex items-center justify-center"
            title="Chiudi sidebar"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-4 border-b border-white/10">
          <input
            type="text"
            placeholder="Cerca chat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-2xl bg-black/35 border border-white/12 px-4 text-[14px] text-white placeholder-white/35 outline-none focus:border-white/25"
          />
        </div>

        {/* List */}
        <div className="px-2 py-2 overflow-y-auto h-[calc(100vh-64px-80px)]">
          {filtered.length === 0 ? (
            <div className="text-white/45 text-[14px] px-4 py-6">Nessuna chat.</div>
          ) : (
            <div className="space-y-1">
              {filtered.map((s) => {
                const title = s.title?.trim() ? s.title : `Chat #${s.id.slice(-6)}`;
                const last = s.lastMessage || "—";
                const isActive = activeSessionId === s.id;

                return (
                  <div
                    key={s.id}
                    className={[
                      "group rounded-2xl px-3 py-3 border transition",
                      isActive
                        ? "bg-white/10 border-white/15"
                        : "bg-transparent border-transparent hover:bg-white/6 hover:border-white/10",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
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
                        <button onClick={() => handleOpenSession(s.id)} className="flex-1 text-left">
                          <div className="text-[14px] text-white/90 font-semibold line-clamp-1">
                            {title}
                          </div>
                          <div className="text-[13px] text-white/45 line-clamp-1 mt-1">{last}</div>
                        </button>
                      )}

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

                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="h-9 w-9 rounded-xl border border-white/12 bg-transparent hover:bg-red-500/12 text-[14px] text-white/85 hover:text-red-200 transition"
                          title="Elimina chat"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
