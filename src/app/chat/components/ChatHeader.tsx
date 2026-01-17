"use client";
// ======================================================
// ChatHeader — Top Bar (Brand + Title + KPI)
// Path: src/app/chat/components/ChatHeader.tsx
// ======================================================

import { useMemo } from "react";

type UsageLite = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type Props = {
  sessionId: string | null;

  sessionTitle: string;
  setSessionTitle: (v: string) => void;

  editingTitle: boolean;
  setEditingTitle: (v: boolean) => void;
  activeProvider: "openai" | "gemini" | "claude";
  setActiveProvider: (p: "openai" | "gemini" | "claude") => void;

  onCommitTitle: () => void | Promise<void>;

  // ✅ COSTI & TOKENS (ultimo giro + totale)
  lastCost: number;
  totalCost: number;
  lastTokens: UsageLite;
  totalTokens: UsageLite;
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

function formatInt(v: any) {
  const x = Number(v);
  if (!Number.isFinite(x)) return "0";
  return Math.round(x).toString();
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
  lastTokens,
  totalTokens,
  activeProvider,
  setActiveProvider,
}: Props) {

  const label = useMemo(() => {
    const fallback = sessionId ? `Chat #${sessionId.slice(-6)}` : "Chat";
    return sessionTitle?.trim() ? sessionTitle.trim() : fallback;
  }, [sessionId, sessionTitle]);

  return (
    <header className="shrink-0 border-b border-white/10 bg-black/50 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-6 h-14 flex items-center justify-between gap-3">
        {/* LEFT: Brand + Title (flessibile) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
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

        {/* RIGHT: KPI (Costi + Tokens) */}
        <div className="shrink-0 flex items-center gap-3">
                    {/* Provider selector */}
          <select
            value={activeProvider}
            onChange={(e) => setActiveProvider(e.target.value as any)}
            className="h-9 rounded-xl border border-white/15 bg-black/40 px-3 text-[12px] text-white/85 outline-none focus:border-white/25"
            title="Provider tab"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
          </select>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Costi */}
          <div className="text-[12px] text-white/60 whitespace-nowrap">
            Ultimo: <span className="text-white/90">{formatEUR(lastCost)}</span>
          </div>
          <div className="text-[12px] text-white/60 whitespace-nowrap">
            Totale: <span className="text-white/90">{formatEUR(totalCost)}</span>
          </div>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Tokens */}
          <div className="text-[12px] text-white/60 whitespace-nowrap">
            Ultimi token:{" "}
            <span className="text-white/90">{formatInt(lastTokens?.total_tokens)}</span>
          </div>
          <div className="text-[12px] text-white/60 whitespace-nowrap">
            Totale token:{" "}
            <span className="text-white/90">{formatInt(totalTokens?.total_tokens)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
