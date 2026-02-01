"use client";
// ======================================================
// ChatHeader — KPI Only (Costi + Token)
// Path: src/app/chat/components/ChatHeader.tsx
// ======================================================

type UsageLite = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type Props = {
  lastCost: number;
  totalCost: number;
  lastTokens: UsageLite;
  totalTokens: UsageLite;
};

function formatEUR(v: number) {
  const n = Number.isFinite(v) ? v : 0;
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

export default function ChatHeader({ lastCost, totalCost, lastTokens, totalTokens }: Props) {
  return (
    <header className="shrink-0 w-full">
      <div className="h-14 w-full flex items-center justify-end gap-3 px-6">
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
          Ultimi token: <span className="text-white/90">{formatInt(lastTokens?.total_tokens)}</span>
        </div>
        <div className="text-[12px] text-white/60 whitespace-nowrap">
          Totale token: <span className="text-white/90">{formatInt(totalTokens?.total_tokens)}</span>
        </div>
      </div>
    </header>
  );
}
