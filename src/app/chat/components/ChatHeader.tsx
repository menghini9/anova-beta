"use client";
// ======================================================
// ChatHeader — Top Bar + Cost Panel
// Path: src/app/chat/components/ChatHeader.tsx
// ======================================================

import { useMemo } from "react";

type Props = {
  sessionId: string | null;

  sessionTitle: string;
  setSessionTitle: (v: string) => void;

  editingTitle: boolean;
  setEditingTitle: (v: boolean) => void;

  onCommitTitle: () => void | Promise<void>;

  // ✅ COSTI PROVIDER (ultimo giro + totale)
  lastCost: number;
  totalCost: number;
};

function formatEUR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
  // 0.000123 -> "€0.00012" (5 decimali per vedere microcosti)
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: n < 0.01 ? 5 : 2,
  }).format(n);
}

export default function ChatHeader({
  sessionId,
  sessionTitle,
  setSessionTitle,
  editingTitle,
  setEditingTitle,
  onCommitTitle,
  lastCost,
  totalCost,
}: Props) {
  const label = useMemo(() => {
    const fallback = sessionId ? `Chat #${sessionId.slice(-6)}` : "Chat";
    return sessionTitle?.trim() ? sessionTitle.trim() : fallback;
  }, [sessionId, sessionTitle]);

  return (
    <header className="shrink-0 border-b border-white/10 bg-black/50 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-6 h-14 flex items-center justify-between gap-3">
        {/* LEFT: Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-[14px] font-semibold text-white/90 whitespace-nowrap">
            Anova <span className="text-white/40 font-normal">β</span>
          </div>

          {/* Title */}
          <div className="min-w-0">
            {editingTitle ? (
              <input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                onBlur={() => onCommitTitle()}
                onKeyDown={(e) => e.key === "Enter" && onCommitTitle()}
                autoFocus
                className="h-9 w-[260px] max-w-[45vw] rounded-xl bg-black/40 border border-white/15 px-3 text-[13px] text-white/90 outline-none focus:border-white/25"
                placeholder="Titolo chat…"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="h-9 max-w-[45vw] px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[13px] text-white/85 truncate"
                title="Rinomina chat"
              >
                {label}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Cost Panel */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
            <div className="text-[10px] text-white/45 leading-none">Ultimo</div>
            <div className="text-[12px] font-medium text-white/85 leading-tight">
              {formatEUR(lastCost)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
            <div className="text-[10px] text-white/45 leading-none">Totale</div>
            <div className="text-[12px] font-semibold text-white leading-tight">
              {formatEUR(totalCost)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
